import { randomBM } from "./random";
import type { Mage } from "shared/types/mage";
import { getUnitById } from "./army";
import { productionTable } from "./config";

export interface Building {
  id: string,
  geldCost: number
  manaCost: number,
}

export const buildingTypes: Building[] = [
  { id: 'farms', geldCost: 50, manaCost: 0 },
  { id: 'towns', geldCost: 300, manaCost: 0 },
  { id: 'workshops', geldCost: 100, manaCost: 0 },
  { id: 'barracks', geldCost: 50, manaCost: 0 },
  { id: 'nodes', geldCost: 300, manaCost: 0 },
  { id: 'libraries', geldCost: 200, manaCost: 0 },
  { id: 'fortresses', geldCost: 3000, manaCost: 0 },
  { id: 'barriers', geldCost: 50, manaCost: 0 }
];


export const buildingRate = (mage: Mage, buildType: string) => {
  if (buildType === 'farms') return (mage.workshops + 1) / 5;
  if (buildType === 'towns') return (mage.workshops + 1) / 30;
  if (buildType === 'workshops') return (mage.workshops + 1 ) / 10;
  if (buildType === 'barracks') return (mage.workshops + 1) / 5;
  if (buildType === 'nodes') return (mage.workshops + 1) / 30;
  if (buildType === 'libraries') return (mage.workshops + 1) / 20;
  if (buildType === 'fortresses') return (mage.workshops + 1) / 300;
  if (buildType === 'barriers') return 1;
  return 0;
}

// Returns an approximate exploration rate
export const explorationRate = (current: number, max: number) => {
  if (current >= max) return 0;

  // return 1 + (1/ current) * 2500;
  return Math.sqrt(max - current) / 3; 
}

export const explore = (rate: number) => {
  if (rate < 0) return 0;
  return Math.floor(randomBM() * rate);
}

export const maxPopulation = (mage: Mage) => {
  let space = 0
  Object.keys(productionTable.space).forEach(key => {
    space += mage[key] * productionTable.space[key];
  });
  return space;
}

export const maxFood = (mage: Mage) => {
  let food = 0;
  Object.keys(productionTable.food).forEach(key => {
    food += mage[key] * productionTable.food[key];
  });
  return food;
}

// Calculate total land
export const totalLand = (mage: Mage) => {
  return mage.farms + 
    mage.towns + 
    mage.barracks +
    mage.workshops +
    mage.nodes + 
    mage.libraries + 
    mage.fortresses + 
    mage.barriers + 
    mage.wilderness;
}

export const totalUnits = (mage: Mage) => {
  let num = 0;
  mage.army.forEach(unit => {
    num += unit.size;
  });
  return num;
}

export const spaceForUnits = (mage: Mage) => {
  let space = 0;
  mage.army.forEach(u => {
    const unit = getUnitById(u.id);
    space += (unit.upkeepCost.population * u.size);
  });
  return Math.ceil(space);
}

export const maxMana = (mage: Mage) => {
  return mage.nodes * 1000;
}

export const totalNetPower = (mage: Mage) => {
  let netpower = 0;

  // Land
  netpower += 1000 * (
    mage.wilderness +
    mage.farms + 
    mage.towns + 
    mage.workshops + 
    mage.barracks + 
    mage.nodes + 
    mage.libraries + 
    mage.fortresses + 
    mage.barriers);
  netpower += mage.fortresses * 19360;
  netpower += mage.barriers * 6500;

  // Mana, geld, items ... etc 
  netpower += Math.floor(0.05 * mage.currentMana);
  netpower += Math.floor(0.0005 * mage.currentGeld);
  netpower += Math.floor(0.02 * mage.currentPopulation);
  netpower += 1000 * mage.currentSpellLevel;
  netpower += 1000 * mage.items.length;

  // Army
  mage.army.forEach(stack => {
    const u = getUnitById(stack.id);
    netpower += u.powerRank + stack.size;
  });

  // TODO: allies and heroes??
  return netpower;
}

export const manaStorage = (mage: Mage) => {
  return mage.nodes * productionTable.manaStorage;
}

export const researchPoints = (mage: Mage) => {
  let rawPoints = Math.sqrt(mage.libraries) * productionTable.research;
  // return 10 + Math.floor(rawPoints);
  return 99999 + Math.floor(rawPoints); // FIXME just testing
}

export const manaIncome = (mage: Mage) => {
  const land = totalLand(mage);
  const nodes = mage.nodes;

  const x = Math.floor(nodes * 100 / land);
  const manaYield = 0.001 * (x * land) + 0.1 * nodes * (100 - x);
  return Math.floor(manaYield);
}

export const populationIncome = (mage: Mage) => {
  return Math.floor(mage.currentPopulation * 1.05 + 50);
}

export const geldIncome = (mage: Mage) => {
  return mage.currentPopulation + 1000;
}

export const armyUpkeep = (mage: Mage) => {
  let mana = 0;
  let geld = 0;
  let pop = 0;

  mage.army.forEach(stack => {
    const u = getUnitById(stack.id);
    mana += u.upkeepCost.mana * stack.size;
    pop += u.upkeepCost.population * stack.size;
    geld += u.upkeepCost.geld * stack.size;
  });

  console.log(mana, pop, geld);

  return {
    mana: mana, 
    geld: geld,
    population: pop
  };
}

export const calcResistance = (mage: Mage) => {
  const resistance: { [key: string]: number } = {
    barrier: 0,
    ascendant: 0,
    verdant: 0,
    eradication: 0,
    nether: 0,
    phantasm: 0
  };

  // Max barrier is 2.5% of the land
  const land = totalLand(mage);

  return resistance;
}
