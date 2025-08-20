import _ from 'lodash';
import { EffectOrigin, UnitSummonEffect } from 'shared/types/effects';
import {
  magicAlignmentTable, spellRankTable, productionTable, itemProductionTable
} from './base/config';
import { Mage } from 'shared/types/mage';
import {
  magicTypes,
  getUnitById,
  getSpellById,
  getMaxSpellLevels,
  getResearchTree,
  getRandomItem,
} from './base/references';
import { totalLand } from './base/mage';
import { randomBM, randomInt } from './random';
import {
  ProductionEffect,
  KingdomResistanceEffect,
  CastingEffect
} from 'shared/types/effects';

// Get normal max spell level, given the research tech tree
export const maxSpellLevel = (mage: Mage) => {
  const maxSpellLevels = getMaxSpellLevels();
  return maxSpellLevels[mage.magic];
}

export const currentSpellLevel = (mage: Mage) => {
  // For testing
  if (mage.currentSpellLevel) return mage.currentSpellLevel;

  let result = 0;
  const addSpellPower = (id: string) => {
    const spell = getSpellById(id);
    const rankPower = spellRankTable[spell.rank];
    result += rankPower;
  }

  mage.spellbook.ascendant.forEach(addSpellPower);
  mage.spellbook.verdant.forEach(addSpellPower);
  mage.spellbook.eradication.forEach(addSpellPower);
  mage.spellbook.nether.forEach(addSpellPower);
  mage.spellbook.phantasm.forEach(addSpellPower);

  // TODO: others
  return result;
}

export const itemGenerationRate = (mage: Mage) => {
  const land = totalLand(mage);
  const rate = itemProductionTable.itemGenerationRate * Math.sqrt(mage.guilds / land);
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
    // console.log('Found an item!!!', item.name);

    if (!mage.items[item.id]) {
      mage.items[item.id] = 1;
    } else {
      mage.items[item.id] ++;
    }
    return item;
  }
  return null;
}

// Do research
export const doResearch = (mage: Mage, points: number) => {
  const researchTree = getResearchTree();
  const currentResearch = mage.currentResearch;
  let spillOverPoints = 0;

  // Apply points to current research
  let done = false;
  let magicToAdvance: any = null;
  magicTypes.forEach(magic => {
    if (!done && currentResearch[magic] && currentResearch[magic].active === true) {
      currentResearch[magic].remainingCost -= points;
      if (currentResearch[magic].remainingCost <= 0 ) {
        magicToAdvance = magic;
        console.log(`!!!!! mage ${mage.name} researchd ${currentResearch[magic].id}`);
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
  }

  unitIds.forEach(unitId => {
    const unit = getUnitById(unitId);
    const unitPower = unit.powerRank;
    const unitsSummoned = effect.rule === 'fixed' ?
      power :
      Math.floor(power / unitPower);

    console.log(`Summoned ${unitsSummoned} ${unit.name}`);
    if (!result[unit.id]) result[unit.id] = 0;
    result[unit.id] += unitsSummoned;
  });
  return result;
}

/*
export const summonUnit = (mage: Mage, spellId: string) => {
  const spell = getSpellById(spellId);
  const spellMagic = spell.magic;
  const magic = mage.magic;

  const manaCost = spell.castingCost * magicAlignmentTable[magic].costModifier[spellMagic];
  const effects: UnitSummonEffect[] = spell.effects as UnitSummonEffect[];

  const result: { [key: string]: number } = {};

  effects.forEach(effect => {
    const unitIds = effect.unitIds;
    let power = effect.summonNetPower;

    // Randomness
    power *= (0.5 + 0.75 * randomBM());

    // Spell level
    power *= (currentSpellLevel(mage) / maxSpellLevel(mage));

    unitIds.forEach(unitId => {
      const unit = getUnitById(unitId);
      const unitPower = unit.powerRank;
      const unitsSummoned = Math.floor(power / unitPower);
      console.log(`Summoned ${unitsSummoned} ${unit.name}, cost = ${manaCost}`);
      if (!result[unit.id]) result[unit.id] = 0;
      result[unit.id] += unitsSummoned;
    });
  });
  return result;
}
*/

export const maxMana = (mage: Mage) => {
  return mage.nodes * 1000;
}

export const manaStorage = (mage: Mage) => {
  return mage.nodes * productionTable.manaStorage;
}

export const researchPoints = (mage: Mage) => {
  let modifier = 0.0;

  mage.enchantments.forEach(enchantment => {
    const spell = getSpellById(enchantment.spellId);
    const effects = spell.effects;

    effects.forEach(effect => {
      if (effect.effectType !== 'ProductionEffect') return;
      const productionEffect = effect as ProductionEffect;
      if (productionEffect.production !== 'guilds') return;

      if (productionEffect.rule === 'spellLevel') {
        modifier += currentSpellLevel(mage) * productionEffect.magic[mage.magic].value;
      }
    });
  });
  let rawPoints = Math.sqrt(mage.guilds) * (productionTable.research + modifier);

  // return 10 + Math.floor(rawPoints);
  return Math.floor(rawPoints); // FIXME just testing
}

export const manaIncome = (mage: Mage) => {
  const land = totalLand(mage);
  const nodes = mage.nodes;

  const x = Math.floor(nodes * 100 / land);
  const manaYield = 0.001 * (x * land) + 0.1 * nodes * (100 - x);

  let valueBuffer = 0;
  for (const enchantment of mage.enchantments) {
    const spell = getSpellById(enchantment.spellId);
    const productionEffects = spell.effects.filter(d => d.effectType === 'ProductionEffect') as ProductionEffect[];
    if (productionEffects.length === 0) continue;

    for (const effect of productionEffects) {
      if (effect.production !== 'nodes') continue;

      const base = effect.magic[enchantment.casterMagic];
      if (!base) continue;

      const rule = effect.rule;
      if (rule === 'spellLevel') {
        valueBuffer += base.value * enchantment.spellLevel;
      } else if (rule === 'addPercentageBase') {
        valueBuffer += manaYield * base.value;
      } else {
        throw new Error(`Unknown rule ${effect.rule}`);
      }
    }
  }

  return Math.floor(manaYield);
}

/**
 * Whether the spell can be successfully cast by the mage
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

  // Enchantments
  const enchantments = mage.enchantments;
  let modifier = 0;
  enchantments.forEach(enchant => {
    const spell = getSpellById(enchant.spellId);
    const spellLevel = enchant.spellLevel;

    spell.effects.forEach(effect => {
      if (effect.effectType !== 'CastingEffect') return;

      const castingEffect = effect as CastingEffect;
      if (castingEffect.type !== 'castingSuccess') return;

      const value = castingEffect.magic[enchant.casterMagic].value;
      modifier += (value * spellLevel);
    });
  });
  console.log('\tenchant modifier:', modifier);

  // Adjacent and opposiite casting
  if (mage.magic !== spellMagic) {
    if (magicAlignmentTable[mage.magic].adjacent.includes(spellMagic)) {
      successRate *= 0.53;
    } else {
      successRate *= 0.45;
    }
  }

  console.log('spell lvl', current);
  console.log('success casting rate:', successRate);
  return successRate;
}


export const castingCost = (mage: Mage, spellId: string) => {
  const spell = getSpellById(spellId);
  const mageMagic = mage.magic;
  const spellMagic = spell.magic;

  let castingCost = spell.castingCost;
  const costModifier = magicAlignmentTable[mageMagic].costModifier[spellMagic];
  castingCost *= costModifier;

  return castingCost;
}

export const calcKingdomResistance = (mage: Mage) => {
  const resistance: { [key: string]: number } = {
    barrier: 0,
    ascendant: 0,
    verdant: 0,
    eradication: 0,
    nether: 0,
    phantasm: 0
  };

  mage.enchantments.forEach(enchantment => {
    const spell = getSpellById(enchantment.spellId);
    const effects = spell.effects;

    effects.forEach(effect => {
      if (effect.effectType !== 'KingdomResistanceEffect') return;

      const resistEffect = effect as KingdomResistanceEffect;
      if (resistEffect.rule === 'spellLevel') {
        resistance[resistEffect.resistance] += currentSpellLevel(mage) * resistEffect.magic[mage.magic].value;
      }
    });
  });


  // Max barrier is 2.5% of the land, max normal barrier is 75
  if (mage.barriers > 0) {
    const land = 0.025 * totalLand(mage);
    const barrier = Math.floor((mage.barriers / land) * 75);
    resistance.barrier = barrier;
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
