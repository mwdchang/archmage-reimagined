import { randomBM } from "./random";
import type { Mage } from "shared/types/mage";
import { getUnitById } from "./base/references";
import { productionTable, explorationLimit } from "./base/config";
import { totalLand } from "./base/mage";

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
export const explorationRate = (mage: Mage) => {
  const current = totalLand(mage);
  if (current >= explorationLimit) return 0;

  // return 1 + (1/ current) * 2500;
  return Math.sqrt(explorationLimit - current) / 3; 
}

export const explore = (rate: number) => {
  if (rate <= 0) return 0;

  return Math.floor(0.75 * rate + randomBM() * 0.25 * rate);
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

export const spaceForUnits = (mage: Mage) => {
  let space = 0;
  mage.army.forEach(u => {
    const unit = getUnitById(u.id);
    space += (unit.upkeepCost.population * u.size);
  });
  return Math.ceil(space);
}

export const populationIncome = (mage: Mage) => {
  return Math.floor(mage.currentPopulation * 0.015 + 50);
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
    mana += Math.ceil(u.upkeepCost.mana * stack.size);
    pop += Math.ceil(u.upkeepCost.population * stack.size);
    geld += Math.ceil(u.upkeepCost.geld * stack.size);
  });

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

  // Max barrier is 2.5% of the land, max normal barrier is 75
  if (mage.barriers > 0) {
    const land = 0.025 * totalLand(mage);
    const barrier = Math.floor((mage.barriers / land) * 75);
    resistance.barrier = barrier;
  }
  return resistance;
}
