import _ from 'lodash';
import { UnitSummonEffect } from 'shared/types/effects';
import { 
  magicAlignmentTable, spellRankTable, productionTable 
} from './base/config';
import { Mage } from 'shared/types/mage';
import { 
  magicTypes,
  getUnitById,
  getSpellById,
  getMaxSpellLevels,
  getResearchTree
} from './base/references';
import { totalLand } from './base/mage';

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

// Do research, 
// This assumes that spell takes at least one turn to research despite the points generated
export const doResearch = (mage: Mage, points: number) => {
  const researchTree = getResearchTree();
  const currentResearch = mage.currentResearch;

  // Apply points to current research
  let done = false;
  let magicToAdvance: any = null;
  magicTypes.forEach(magic => {
    if (!done && currentResearch[magic] && currentResearch[magic].active === true) {
      currentResearch[magic].remainingCost -= points;
      console.log(`!!!!! mage ${mage.name} researching ${currentResearch[magic].id} ${currentResearch[magic].remainingCost}`);
      if (currentResearch[magic].remainingCost <= 0 ) {
        magicToAdvance = magic;
        console.log(`!!!!! mage ${mage.name} researchd ${currentResearch[magic].id}`);
      }
      done = true;
    }
  });

  if (!magicToAdvance) return;

  // Add to spellbook
  mage.spellbook[magicToAdvance].push(currentResearch[magicToAdvance].id);
  currentResearch[magicToAdvance] = null;

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
    }
  }

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

export const summonUnit = (mage: Mage, spellId: string) => {
  const spell = getSpellById(spellId);
  const spellMagic = spell.magic;
  const magic = mage.magic;

  const manaCost = spell.castingCost * magicAlignmentTable[magic].costModifier[spellMagic];
  const effects: UnitSummonEffect[] = spell.effects as UnitSummonEffect[];

  const result: { [key: string]: number } = {};

  effects.forEach(effect => {
    const unitIds = effect.unitIds;
    const power = effect.summonNetPower;

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

export const maxMana = (mage: Mage) => {
  return mage.nodes * 1000;
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
