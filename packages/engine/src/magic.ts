import _ from 'lodash';
import { CastingCostEffect, EffectOrigin, UnitSummonEffect } from 'shared/types/effects';
import {
  gameTable, magicAlignmentTable, productionTable
} from './base/config';
import { Enchantment, Mage } from 'shared/types/mage';
import {
  getUnitById,
  getSpellById,
  getMaxSpellLevels,
  getResearchTree,
  getRandomItem,
  getAllUniqueItems,
} from './base/references';
import { totalLand, currentSpellLevel } from './base/mage';
import { randomBM, randomInt } from './random';
import {
  ProductionEffect,
  KingdomResistanceEffect,
  CastingEffect
} from 'shared/types/effects';
import { allowedMagicList, allowedEffect as E } from 'shared/src/common';
import { getActiveEffects } from './effects';
import { AllowedMagic } from 'shared/types/common';

// Get normal max spell level, given the research tech tree
export const maxSpellLevel = (mage: Mage) => {
  const maxSpellLevels = getMaxSpellLevels();
  return maxSpellLevels[mage.magic];
}


export const itemGenerationRate = (mage: Mage) => {
  const land = totalLand(mage);
  const rate = gameTable.itemGenerationRate * Math.sqrt(mage.guilds / land);
  return rate;
}

export const doItemDestruction = (mage: Mage) => {
  const itemKeys = Object.keys(mage.items);
  if (itemKeys.length === 0) return null;

  const idx = Math.floor(Math.random() * (itemKeys.length));
  const dkey = itemKeys[idx];

  mage.items[dkey] --;
  if (mage.items[dkey] <= 0) {
    delete mage.items[dkey];
  }
  return dkey;
}

export const doItemGeneration = (mage: Mage, force: boolean = false) => {
  const rate = itemGenerationRate(mage);
  if (Math.random() <= rate || force === true) {
    const item = getRandomItem();

    if (!mage.items[item.id]) {
      mage.items[item.id] = 1;
    } else {
      mage.items[item.id] ++;
    }
    return item;
  }
  return null;
}


// Set next spell
export const nextResearch = (mage: Mage, magicToAdvance: string) => {
  const researchTree = getResearchTree();
  const currentResearch = mage.currentResearch;

  const spellList = researchTree.get(mage.magic).get(magicToAdvance);
  for (let i = 0; i < spellList.length; i++) {
    const spellId = spellList[i];
    if (!mage.spellbook[magicToAdvance].includes(spellId)) {
      const spell = getSpellById(spellId);
      const researchCostModifier = magicAlignmentTable[mage.magic].costModifier[magicToAdvance];

      currentResearch[magicToAdvance] = {
        id: spell.id,
        remainingCost: spell.researchCost * researchCostModifier,
        active: false
      };
      break;
    }
  }

  if (mage.focusResearch === true && currentResearch[magicToAdvance]) {
    currentResearch[magicToAdvance].active = true;
  } else {
    // Set next active, pick the least turns for now
    let researchables = Object.values(currentResearch);
    researchables = researchables
      .filter(d => d !== null)
      .sort((a, b) => {
        return a.remainingCost - b.remainingCost;
      });

    if (researchables.length > 0) {
      researchables[0].active = true;
    }
  }
}

// Do research
export const doResearch = (mage: Mage, points: number) => {
  const researchTree = getResearchTree();
  const currentResearch = mage.currentResearch;
  let spillOverPoints = 0;

  // Apply points to current research
  let done = false;
  let magicToAdvance: any = null;
  allowedMagicList.forEach(magic => {
    if (!done && currentResearch[magic] && currentResearch[magic].active === true) {
      currentResearch[magic].remainingCost -= points;
      if (currentResearch[magic].remainingCost <= 0 ) {
        magicToAdvance = magic;
        // console.log(`!!!!! mage ${mage.name} researchd ${currentResearch[magic].id}`);
        spillOverPoints = Math.abs(currentResearch[magic].remainingCost);
      }
      done = true;
    }
  });

  if (!magicToAdvance) return;

  // Add to spellbook
  mage.spellbook[magicToAdvance].push(currentResearch[magicToAdvance].id);
  currentResearch[magicToAdvance] = null; // Temporary reset

  // Set next spell
  nextResearch(mage, magicToAdvance);

  // Spend remaining points
  if (spillOverPoints > 0) {
    doResearch(mage, spillOverPoints);
  }
}


export const summonUnit = (effect: UnitSummonEffect, origin: EffectOrigin) => {
  const result: { [key: string]: number } = {};
  const summonType = effect.summonType;

  const magicBase = effect.magic[origin.magic] ?
    effect.magic[origin.magic].value :
    0;

  const unitIds = summonType === 'random' ?
    [effect.unitIds[randomInt(effect.unitIds.length)]] :
    effect.unitIds;

  let power = effect.summonNetPower;

  if (effect.rule === 'spellLevel') {
    // Randomness
    power *= (0.5 + 0.75 * randomBM());

    // Spell level
    power *= origin.spellLevel / getMaxSpellLevels()[origin.magic];

    // Magic
    power *= magicBase;
  } else if (effect.rule === 'fixed') {
    power = effect.summonNetPower;
  } else if (effect.rule === 'power') {
    power = (0.5 + 0.75 * randomBM()) * effect.summonNetPower;
  }


  unitIds.forEach(unitId => {
    const unit = getUnitById(unitId);
    const unitPower = unit.powerRank;
    const unitsSummoned = effect.rule === 'fixed' ?
      power :
      Math.floor(power / unitPower);

    if (!result[unit.id]) result[unit.id] = 0;
    result[unit.id] += unitsSummoned;
  });
  return result;
}

export const maxMana = (mage: Mage) => {
  return mage.nodes * 1000;
}

export const manaStorage = (mage: Mage) => {
  return mage.nodes * productionTable.manaStorage;
}

export const researchPoints = (mage: Mage) => {
  let modifier = 0.0;

  const activeEffects = getActiveEffects(mage, E.ProductionEffect);
  for (const activeEffect of activeEffects) {
    for (const effect of activeEffect.effects as ProductionEffect[]) {
      if (effect.production !== 'guilds') {
        continue;
      }

      if (effect.rule === 'spellLevel') {
        modifier += activeEffect.origin.spellLevel * effect.magic[mage.magic].value;
      } else {
        throw new Error(`${effect.rule} not implemented for ${effect.production}`);
      }
    }
  }

  const rawPoints = Math.sqrt(mage.guilds) * (productionTable.research + modifier);
  return Math.floor(rawPoints);
}

export const manaIncome = (mage: Mage) => {
  const land = totalLand(mage);
  const nodes = mage.nodes;

  const x = Math.floor(nodes * 100 / land);
  const manaYield = x * land * (110 - x) / 1000;
  // const manaYield = 0.001 * (x * land) + 0.1 * nodes * (100 - x);


  let delta = 0;
  const activeEffects = getActiveEffects(mage, E.ProductionEffect);
  for (const activeEffect of activeEffects) {
    for (const productionEffect of activeEffect.effects as ProductionEffect[]) {
      if (productionEffect.production !== 'mana') {
        continue;
      }
      const origin = activeEffect.origin;
      const base = productionEffect.magic[origin.magic];
      if (!base) {
        continue;
      }
      const rule = productionEffect.rule;
      if (rule === 'spellLevel') {
        delta += base.value * origin.spellLevel;
      } else if (rule === 'addPercentageBase') {
        delta += manaYield * base.value;
      } else if (rule === 'add') {
        delta += base.value;
      } else if (rule === 'addSpellLevelPercentageBase') {
        delta += manaYield * base.value * origin.spellLevel / getMaxSpellLevels()[origin.magic];
      } else {
        throw new Error(`Unknown rule ${rule}`);
      }
    }
  }

  return Math.floor(manaYield + delta);
}

/**
 * Check whether the spell can be successfully cast by the mage
*/
export const successCastingRate = (mage:Mage, spellId: string) => {
  const current = currentSpellLevel(mage);
  const spell = getSpellById(spellId);

  const spellRank = spell.rank;
  const spellMagic = spell.magic;

  // Spell rank and level
  let rankModifier = 0;
  if (spellRank === 'simple') rankModifier = 140;
  if (spellRank === 'average') rankModifier = 130;
  if (spellRank === 'complex') rankModifier = 90;
  if (spellRank === 'ultimate') rankModifier = 80;
  if (spellRank === 'ancient') rankModifier = 85;

  let successRate = 0.1 * current + rankModifier;
  const baseRate = successRate;

  let modifier = 0;
  const activeEffects = getActiveEffects(mage, E.CastingEffect);
  for (const activeEffect of activeEffects) {
    for (const effect of activeEffect.effects as CastingEffect[]) {
      if (effect.type !== 'castingSuccess') {
        continue;
      }

      const value = effect.magic[activeEffect.origin.magic].value;
      if (value > 0) {
        modifier += (value * activeEffect.origin.spellLevel);
      } else {
        modifier += (1.50 * value * activeEffect.origin.spellLevel);
      }
    }
  }
  successRate += modifier;

  // Adjacent and opposiite casting
  if (mage.magic !== spellMagic) {
    if (magicAlignmentTable[mage.magic].adjacent.includes(spellMagic)) {
      successRate *= 0.53;
    } else {
      successRate *= 0.45;
    }
  }

  console.log(`\tSuccess rate ${mage.name}(#${mage.id}): ${spell.id} raw/modifier/final = ${baseRate.toFixed(2)}/${modifier.toFixed(2)}/${successRate.toFixed(2)}`);
  return successRate;
}


export const castingCost = (mage: Mage, spellId: string) => {
  const spell = getSpellById(spellId);
  const mageMagic = mage.magic as AllowedMagic;
  const spellMagic = spell.magic;

  let castingCost = spell.castingCost;
  const costModifier = magicAlignmentTable[mageMagic].costModifier[spellMagic];
  castingCost *= costModifier;

  const base = castingCost;
  const activeEffects = getActiveEffects(mage, E.CastingCostEffect)

  for (const activeEffect of activeEffects) { 
    for (const castingCostEffect of activeEffect.effects as CastingCostEffect[]) {
      if (magicAlignmentTable[mageMagic].innate.includes(spellMagic)) {
        castingCost += base * castingCostEffect.magic[mageMagic].value.innate;
      }
      if (magicAlignmentTable[mageMagic].adjacent.includes(spellMagic)) {
        castingCost += base * castingCostEffect.magic[mageMagic].value.adjacent;
      }
      if (magicAlignmentTable[mageMagic].opposite.includes(spellMagic)) {
        castingCost += base * castingCostEffect.magic[mageMagic].value.opposite;
      }
    }
  }
  return castingCost;
}

const MIN_DISPEL_PROB = 0.01;
const MAX_DISPEL_PROB = 0.97
export const dispelEnchantment = (mage: Mage, enchantment: Enchantment, mana: number) => {
  const spell = getSpellById(enchantment.spellId);
  const castingCost = spell.castingCost;
  // const rawProb = (mana * (1 + currentSpellLevel(mage) / enchantment.spellLevel)) / (2.25 * castingCost);
  const rawProb = (mana / (2.75 * castingCost)) * ((1 + currentSpellLevel(mage)) / enchantment.spellLevel);


  let modifier = 0;
  const activeEffects = getActiveEffects(mage, E.CastingEffect);
  for (const activeEffect of activeEffects) {
    for (const effect of activeEffect.effects as CastingEffect[]) {
      if (effect.type !== 'castingSuccess') {
        continue;
      }

      const value = effect.magic[activeEffect.origin.magic].value;
      modifier += (0.01 * value * activeEffect.origin.spellLevel);
    }
  }


  const adjustedProb = Math.max(MIN_DISPEL_PROB, Math.min(MAX_DISPEL_PROB, rawProb + modifier));

  // Can always cancel own spells with no mana, unless noDispel is indicated
  if (enchantment.casterId === mage.id) {
    if (spell.attributes.includes('noDispel') === false && mana >= 0) {
      return 1.0;
    }
  }

  // console.log(`\tDispel rate ${mage.name}(#${mage.id}): ${spell.id} raw/modifier/final = ${rawProb.toFixed(2)}/${modifier.toFixed(2)}/${adjustedProb.toFixed(2)}`);
  return adjustedProb;
}

/**
 * Returns blocking chance  (0 to 100)
**/
export const calcKingdomResistance = (mage: Mage) => {
  const resistance: { [key: string]: number } = {
    barriers: 0,
    ascendant: 0,
    verdant: 0,
    eradication: 0,
    nether: 0,
    phantasm: 0
  };

  const activeEffects = getActiveEffects(mage, E.KingdomResistanceEffect);
  for (const activeEffect of activeEffects) {
    for (const effect of activeEffect.effects as KingdomResistanceEffect[]) {
      if (effect.rule === 'spellLevel') {
        resistance[effect.resistance] += activeEffect.origin.spellLevel * effect.magic[activeEffect.origin.magic].value;
      } else {
        throw new Error(`unspported production rule ${effect.rule} for ${activeEffect.objId}`);
      }
    }
  }


  // Max barrier is 2.5% of the land, max normal barrier is 75
  if (mage.barriers > 0) {
    const land = 0.025 * totalLand(mage);
    const barriers = Math.min(1.0, (mage.barriers / land)) * 75;
    resistance.barriers = barriers;
  }
  return resistance;
}

export const enchantmentUpkeep = (mage: Mage) => {
  const upkeep = {
    geld: 0,
    mana: 0,
    population: 0
  };

  mage.enchantments.forEach(enchant => {
    if (enchant.targetId !== mage.id) return;

    const spell = getSpellById(enchant.spellId);
    if (spell.upkeep) {
      upkeep.geld += spell.upkeep.geld;
      upkeep.mana += spell.upkeep.mana;
      upkeep.population += spell.upkeep.population;
    }
  });
  return upkeep;
}
