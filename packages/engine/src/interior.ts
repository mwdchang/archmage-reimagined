import _ from 'lodash';
import { randomBM } from "./random";
import type { Mage } from "shared/types/mage";
import { getUnitById } from "./base/references";
import { productionTable, explorationLimit } from "./base/config";
import { totalLand } from "./base/mage";
import { getMaxSpellLevels } from './base/references';
import {
  getSpellById,
} from './base/references';

import { ArmyUpkeepEffect, ProductionEffect } from 'shared/types/effects';
import { matchesFilter } from './base/unit';

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
  { id: 'guilds', geldCost: 200, manaCost: 0 },
  { id: 'forts', geldCost: 3000, manaCost: 0 },
  { id: 'barriers', geldCost: 50, manaCost: 0 }
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
  if (current < explorationLimit) {
    rate = Math.sqrt(explorationLimit - current) / 3;
  }

  let extra = 0;
  for (const enchantment of mage.enchantments) {
    const spell = getSpellById(enchantment.spellId);
    const productionEffects = spell.effects.filter(d => d.effectType === 'ProductionEffect') as ProductionEffect[];
    if (productionEffects.length === 0) continue;

    for (const effect of productionEffects) {
      if (effect.production === 'land') {
        if (effect.rule === 'addSpellLevelPercentageBase') {
          extra += rate * effect.magic[enchantment.casterMagic].value;
        }
        // Always add 1
        extra += 1;
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

  mage.enchantments.forEach(enchantment => {
    const spell = getSpellById(enchantment.spellId);
    const effects = spell.effects;

    effects.forEach(effect => {
      if (effect.effectType !== 'ProductionEffect') return;

      const productionEffect = effect as ProductionEffect;
      if (productionEffect.production !== 'farms') return;

      if (productionEffect.rule === 'spellLevel') {
        food += mage.farms * enchantment.spellLevel * productionEffect.magic[enchantment.casterMagic].value;
      } else {
        throw new Error(`unspported production rule ${productionEffect.rule} for ${spell.id}`);
      }
    });
  })
  return food;
}

// Determine the maximum recruitable by the geld cost
export const recruitGeldCapacity = (mage: Mage) => {
  const speed = 1.0;
  const base = 100;
  let buffer = 0.0;

  for (const enchant of mage.enchantments) {
    const spell = getSpellById(enchant.spellId);
    const spellLevel = enchant.spellLevel;
    const magic = enchant.casterMagic;
    const maxSpellLevel = getMaxSpellLevels()[magic];
    const spellPowerScale = spellLevel / maxSpellLevel;

    const effects = spell.effects;

    effects.forEach(effect => {
      if (effect.effectType !== 'ProductionEffect') return;

      const productionEffect = effect as ProductionEffect;
      if (productionEffect.production !== 'barrack') return;

      if (productionEffect.rule === 'spellLevel') {
        buffer += enchant.spellLevel * productionEffect.magic[magic].value;
      } else if (productionEffect.rule === 'addPercentageBase') {
        buffer += base * productionEffect.magic[magic].value;
      } else if (productionEffect.rule === 'addSpellLevelPercentageBase') {
        buffer += base * productionEffect.magic[magic].value * spellPowerScale;
      } else {
        throw new Error(`unspported production rule ${productionEffect.rule} for ${spell.id}`);
      }
    });
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

  for (const enchantment of mage.enchantments) {
    const spell = getSpellById(enchantment.spellId);
    const productionEffects = spell.effects.filter(d => d.effectType === 'ProductionEffect') as ProductionEffect[];
    if (productionEffects.length === 0) continue;

    for (const effect of productionEffects) {
      if (effect.production !== 'population' || !effect.magic[enchantment.casterMagic]) continue;

      if (effect.rule === 'spellLevel') {
        delta += effect.magic[enchantment.casterMagic].value * enchantment.spellLevel;
      } else if (effect.rule === 'addPercentageBase') {
        delta += effect.magic[enchantment.casterMagic].value * baseIncome;
      }
    }
  }

  return baseIncome + delta;
}

export const geldIncome = (mage: Mage) => {
  const baseIncome = mage.currentPopulation + 1000;
  let delta = 0

  for (const enchantment of mage.enchantments) {
    const spell = getSpellById(enchantment.spellId);
    const productionEffects = spell.effects.filter(d => d.effectType === 'ProductionEffect') as ProductionEffect[];
    if (productionEffects.length === 0) continue;

    for (const effect of productionEffects) {
      if (effect.production !== 'geld' || !effect.magic[enchantment.casterMagic]) continue;

      if (effect.rule === 'spellLevel') {
        delta += effect.magic[enchantment.casterMagic].value * enchantment.spellLevel;
      } else if (effect.rule === 'addPercentageBase') {
        delta += effect.magic[enchantment.casterMagic].value * baseIncome;
      } else if (effect.rule === 'addSpellLevelPercentageBase') {
        const maxSpellLevel = getMaxSpellLevels()[enchantment.casterMagic];
        delta += effect.magic[enchantment.casterMagic].value * enchantment.spellLevel / maxSpellLevel * baseIncome;
      } else {
        throw new Error(`Unknown rule ${effect.rule}`);
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

export const armyUpkeep = (mage: Mage) => {
  let mana = 0;
  let geld = 0;
  let pop = 0;

  mage.army.forEach(stack => {
    const u = getUnitById(stack.id);
    const upkeep = _.cloneDeep(u.upkeepCost);

    // Enchantment modifiers. The effecacy is calculated by level of the enchantment, not the
    // current level of the mage
    for (const enchantment of mage.enchantments) {
      const spell = getSpellById(enchantment.spellId);
      const enchantMaxSpellLevel = getMaxSpellLevels()[enchantment.casterMagic];

      const armyUpkeepEffects = spell.effects.filter(d => d.effectType === 'ArmyUpkeepEffect') as ArmyUpkeepEffect[];
      if (armyUpkeepEffects.length === 0) continue;

      for (const effect of armyUpkeepEffects) {
        const filters = effect.filters;

        // Check if effect matches unit
        let isMatch = filters === null ? true : false;
        if (isMatch === false) {
          for (const filter of filters) {
            if (matchesFilter(u, filter) === true) {
              isMatch = true;
              break;
            }
          }
        }

        // Finally apply the effect
        if (isMatch === true) {
          const base = effect.magic[enchantment.casterMagic];

          if (effect.rule === 'addSpellLevelPercentageBase') {
            const percentage = (enchantment.spellLevel / enchantMaxSpellLevel);
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
          }
        }
      }
    }

    // Ensure no weirdness
    if (upkeep.geld < 0) upkeep.geld = 0;
    if (upkeep.mana < 0) upkeep.mana = 0;
    if (upkeep.population < 0) upkeep.population = 0;

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

  result.geld += 20 * mage.farms;
  result.geld += 50 * mage.towns
  result.geld += 20 * mage.workshops;
  result.geld += 20 * mage.barracks;
  result.geld += 30 * mage.guilds;

  const n = mage.forts;
  result.geld += (240 * n + 30 * n * (n + 1));


  result.mana += 30 * mage.barriers;
  return result;
}

