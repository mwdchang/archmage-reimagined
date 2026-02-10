import _ from 'lodash';
import { randomBM } from "./random";
import type { Mage } from "shared/types/mage";
import { getAllUniqueItems, getUnitById } from "./base/references";
import { productionTable, gameTable } from "./base/config";
import { totalLand } from "./base/mage";
import { getMaxSpellLevels } from './base/references';
import {
  getSpellById,
} from './base/references';
import { allowedEffect as E } from 'shared/src/common';

import { ArmyUpkeepEffect, ProductionEffect } from 'shared/types/effects';
import { matchesFilter } from './base/unit';
import { ActiveEffect, getActiveEffects } from './effects';

export interface Building {
  id: string,
  geldCost: number
  manaCost: number,
  upkeep: {
    geld: number,
    mana: number,
    population: number,
  }
}

export const buildingTypes: Building[] = [
  {
    id: 'farms', geldCost: 50, manaCost: 0,
    upkeep: {
      geld: 20,
      mana: 0,
      population: 0
    }
  },
  {
    id: 'towns', geldCost: 300, manaCost: 0,
    upkeep: {
      geld: 50,
      mana: 0,
      population: 0
    }
  },
  {
    id: 'workshops', geldCost: 100, manaCost: 0,
    upkeep: {
      geld: 20,
      mana: 0,
      population: 0
    }
  },
  {
    id: 'barracks', geldCost: 50, manaCost: 0,
    upkeep: {
      geld: 20,
      mana: 0,
      population: 0
    }
  },
  {
    id: 'nodes', geldCost: 300, manaCost: 0,
    upkeep: {
      geld: 0,
      mana: 0,
      population: 0
    }
  },
  {
    id: 'guilds', geldCost: 200, manaCost: 0,
    upkeep: {
      geld: 30,
      mana: 0,
      population: 0
    }
  },
  // FIXME: forts has special rules
  {
    id: 'forts', geldCost: 3000, manaCost: 0,
    upkeep: {
      geld: 0,
      mana: 0,
      population: 0
    }
  },
  {
    id: 'barriers', geldCost: 50, manaCost: 0,
    upkeep: {
      geld: 0,
      mana: 60,
      population: 0
    }
  }
];
export const getBuildingTypes = () => {
  return buildingTypes.map(d => d.id);
};

export const buildingRate = (mage: Mage, buildType: string) => {
  if (buildType === 'farms') return (mage.workshops + 1) / 5;
  if (buildType === 'towns') return (mage.workshops + 1) / 30;
  if (buildType === 'workshops') return (mage.workshops + 1 ) / 10;
  if (buildType === 'barracks') return (mage.workshops + 1) / 5;
  if (buildType === 'nodes') return (mage.workshops + 1) / 30;
  if (buildType === 'guilds') return (mage.workshops + 1) / 20;
  if (buildType === 'forts') return (mage.workshops + 1) / 300;
  if (buildType === 'barriers') return 1;
  return 0;
}

// Returns an approximate exploration rate
export const explorationRate = (mage: Mage) => {
  const current = totalLand(mage);
  let rate = 0;
  if (current < gameTable.explorationLimit) {
    rate = Math.sqrt(gameTable.explorationLimit - current) / 3;
  }

  let extra = 0;
  const activeEffects = getActiveEffects(mage, E.ProductionEffect);
  for (const activeEffect of activeEffects) {
    for (const effect of activeEffect.effects as ProductionEffect[]) {
      if (effect.production !== 'land' || !effect.magic[activeEffect.origin.magic]) {
        continue;
      }

      if (effect.rule === 'addPercentageBase') {
        extra += Math.max(1, rate * effect.magic[activeEffect.origin.magic].value);
      }
    }
  }
  return (rate + extra);
}

export const explore = (rate: number) => {
  if (rate <= 0) return 0;

  return Math.floor(0.75 * rate + randomBM() * 0.25 * rate);
}

export const spacesForUnits = (mage: Mage) => {
  return mage.barracks * 150;
}

export const maxPopulation = (mage: Mage) => {
  let space = 0
  Object.keys(productionTable.space).forEach(key => {
    space += mage[key] * productionTable.space[key];
  });
  return space;
}

export const realMaxPopulation = (mage: Mage) => {
  let armySpaceAndPopulation = 0;
  mage.army.forEach(d => {
    const unit = getUnitById(d.id);
    armySpaceAndPopulation += (d.size * unit.upkeepCost.population);
  });

  const max = maxPopulation(mage);

  armySpaceAndPopulation -= spacesForUnits(mage);
  if (armySpaceAndPopulation <= 0) {
    return max;
  }
  return max - armySpaceAndPopulation;
}

export const maxFood = (mage: Mage) => {
  let food = 0;
  Object.keys(productionTable.food).forEach(key => {
    food += mage[key] * productionTable.food[key];
  });

  const activeEffects = getActiveEffects(mage, E.ProductionEffect);
  for (const activeEffect of activeEffects) {
    for (const effect of activeEffect.effects as ProductionEffect[]) {
      if (effect.production !== 'farms' || !effect.magic[activeEffect.origin.magic]) {
        continue;
      }

      if (effect.rule === 'spellLevel') {
        food += mage.farms * activeEffect.origin.spellLevel * effect.magic[activeEffect.origin.magic].value;
      } else {
        throw new Error(`unspported production rule ${effect.rule} for ${activeEffect.objId}`);
      }
    }
  }

  return food;
}

// Determine the maximum recruitable by the geld cost
export const recruitGeldCapacity = (mage: Mage) => {
  const speed = 1.0;
  const base = 100;
  let buffer = 0.0;


  const activeEffects = getActiveEffects(mage, E.ProductionEffect);
  for (const activeEffect of activeEffects) {
    const magic = activeEffect.origin.magic;
    const maxSpellLevel = getMaxSpellLevels()[magic];
    const spellPowerScale = activeEffect.origin.spellLevel / maxSpellLevel;

    for (const effect of activeEffect.effects as ProductionEffect[]) {
      if (effect.production !== 'barrack' || !effect.magic[activeEffect.origin.magic]) {
        continue;
      }

      if (effect.rule === 'spellLevel') {
        buffer += activeEffect.origin.spellLevel * effect.magic[magic].value;
      } else if (effect.rule === 'addPercentageBase') {
        buffer += base * effect.magic[magic].value;
      } else if (effect.rule === 'addSpellLevelPercentageBase') {
        buffer += base * effect.magic[magic].value * spellPowerScale;
      } else {
        throw new Error(`unspported production rule ${effect.rule} for ${activeEffect.objId}`);
      }
    }
  }

  return (base + buffer) * mage.barracks * speed;
}

export const recruitmentAmount = (mage: Mage, unitId: string) => {
  const unit = getUnitById(unitId);
  const amt = recruitGeldCapacity(mage) / unit.recruitCost.geld;
  return Math.floor(amt);
}

// export const spaceForUnits = (mage: Mage) => {
//   let space = 0;
//   mage.army.forEach(u => {
//     const unit = getUnitById(u.id);
//     space += (unit.upkeepCost.population * u.size);
//   });
//   return Math.ceil(space);
// }

export const populationIncome = (mage: Mage) => {
  const baseIncome = Math.floor(mage.currentPopulation * 0.015 + 50);
  let delta = 0;

  const activeEffects = getActiveEffects(mage, E.ProductionEffect);
  for (const activeEffect of activeEffects) {
    for (const effect of activeEffect.effects as ProductionEffect[]) {
      if (effect.production !== 'population' || !effect.magic[activeEffect.origin.magic]) {
        continue;
      }

      if (effect.rule === 'spellLevel') {
        delta += effect.magic[activeEffect.origin.magic].value * activeEffect.origin.spellLevel;
      } else if (effect.rule === 'addPercentageBase') {
        delta += effect.magic[activeEffect.origin.magic].value * baseIncome;
      } else if (effect.rule === 'add') {
        delta += effect.magic[mage.magic].value;
      } else {
        throw new Error(`unspported production rule ${effect.rule} for ${activeEffect.objId}`);
      }
    }
  }

  return baseIncome + delta; 
}

export const geldIncome = (mage: Mage) => {
  const baseIncome = mage.currentPopulation + 1000;
  let delta = 0

  const activeEffects = getActiveEffects(mage, E.ProductionEffect);
  for (const activeEffect of activeEffects) {
    const magic = activeEffect.origin.magic;

    for (const effect of activeEffect.effects as ProductionEffect[]) {
      if (effect.production !== 'geld' || !effect.magic[activeEffect.origin.magic]) {
        return;
      }

      if (effect.rule === 'spellLevel') {
        delta += effect.magic[magic].value * activeEffect.origin.spellLevel;
      } else if (effect.rule === 'addPercentageBase') {
        delta += effect.magic[magic].value * baseIncome;
      } else if (effect.rule === 'addSpellLevelPercentageBase') {
        const maxSpellLevel = getMaxSpellLevels()[activeEffect.origin.magic];
        delta += effect.magic[magic].value * activeEffect.origin.spellLevel / maxSpellLevel * baseIncome;
      } else if (effect.rule === 'add') {
        delta += effect.magic[magic].value;
      } else {
        throw new Error(`Unimplemented rule ${effect.rule} for ${activeEffect.objId}`);
      }
    }
  }
  return baseIncome + delta; 
}


export const recruitUpkeep = (mage: Mage) => {
  let mana = 0;
  let geld = 0;
  let population = 0;
  let geldCapacity = recruitGeldCapacity(mage);

  const recruits: { id: string, size: number }[] = [];
  for (let i = 0; i < mage.recruitments.length; i++) {
    const recruit = mage.recruitments[i];
    const unit = getUnitById(recruit.id);
    const unitCapacity = Math.floor(geldCapacity / unit.recruitCost.geld);
    const numUnits = Math.min(unitCapacity, recruit.size);

    if (numUnits <= 0) break;

    geld += numUnits * unit.recruitCost.geld;
    mana += numUnits * unit.recruitCost.mana;
    population += numUnits * unit.recruitCost.population;
    geldCapacity -= numUnits * unit.recruitCost.geld;
    recruits.push({ id: unit.id, size: numUnits });

    if (numUnits < recruit.size) break;
  }

  return { geld, mana, population, recruits };
}


export const unitUpkeep = (unitId: string, activeEffects: ActiveEffect[]) => {
  const u = getUnitById(unitId);
  const upkeep = _.cloneDeep(u.upkeepCost);

  for (const activeEffect of activeEffects) {
    for (const effect of activeEffect.effects as ArmyUpkeepEffect[]) {
      const filters = effect.filters;
      let isMatch = filters === null ? true : false;
      if (isMatch === false) {
        for (const filter of filters) {
          if (matchesFilter(u, filter) === true) {
            isMatch = true;
            break;
          }
        }
      }

      if (isMatch === false) {
        continue;
      }

      const base = effect.magic[activeEffect.origin.magic];

      if (effect.rule === 'addSpellLevelPercentageBase') {
        const percentage = (activeEffect.origin.spellLevel / getMaxSpellLevels()[activeEffect.origin.magic]);
        if (base.value.geld) {
          upkeep.geld += percentage * u.upkeepCost.geld * base.value.geld;
        }
        if (base.value.mana) {
          upkeep.mana += percentage * u.upkeepCost.mana * base.value.mana;
        }
        if (base.value.population) {
          upkeep.population += percentage * u.upkeepCost.population * base.value.population;
        }
      } else if (effect.rule === 'addPercentageBase') {
        if (base.value.geld) {
          upkeep.geld += u.upkeepCost.geld * base.value.geld;
        }
        if (base.value.mana) {
          upkeep.mana += u.upkeepCost.mana * base.value.mana;
        }
        if (base.value.population) {
          upkeep.population += u.upkeepCost.population * base.value.population;
        }
      } else {
        throw new Error(`Unimplemented rule ${effect.rule} for ${activeEffect.objId}`);
      }
    }
  }

  // Ensure no weirdness
  if (upkeep.geld < 0) upkeep.geld = 0;
  if (upkeep.mana < 0) upkeep.mana = 0;
  if (upkeep.population < 0) upkeep.population = 0;

  return upkeep;
}


export const armyUpkeep = (mage: Mage) => {
  let mana = 0;
  let geld = 0;
  let pop = 0;

  const activeEffects = getActiveEffects(mage, E.ArmyUpkeepEffect);
  mage.army.forEach(stack => {
    const upkeep = unitUpkeep(stack.id, activeEffects);

    mana += Math.ceil(upkeep.mana * stack.size);
    pop += Math.ceil(upkeep.population * stack.size);
    geld += Math.ceil(upkeep.geld * stack.size);
  });

  return {
    mana: mana,
    geld: geld,
    population: pop
  };
}

export const buildingUpkeep = (mage: Mage) => {
  const result = {
    mana: 0,
    geld: 0,
    population: 0
  };

  buildingTypes.forEach(bType => {
    if (bType.id === 'forts') return;

    result.geld += bType.upkeep.geld * mage[bType.id];
    result.mana += bType.upkeep.mana * mage[bType.id];
    result.population += bType.upkeep.population * mage[bType.id];
  });

  // Fort has special rule
  const n = mage.forts;
  result.geld += (240 * n + 30 * n * (n + 1));

  return result;
}

