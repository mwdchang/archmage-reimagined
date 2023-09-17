import _ from 'lodash';
import { Spell } from 'shared/types/magic';
import { UnitSummonEffect } from 'shared/types/effects';
import { magicAlignmentTable } from './config';
import { Mage } from 'shared/types/mage';
import { getUnitById } from './army';

export const magicTypes = ['ascendant', 'verdant', 'eradication', 'nether', 'phantasm'];
export const spellMap = new Map<string, Spell>();
export const researchTree = new Map<string, Map<string, string[]>>;

const spellList: Spell[] = [];

export const loadSpellData = (spells: Spell[]) => {
  for (let i = 0; i < spells.length; i++) {
    spellMap.set(spells[i].id, spells[i]);
    spellList.push(spells[i]);
    console.log(`Spell[${spells[i].magic}] ${spells[i].name} loaded`);
  }
}

export const getSpellById = (id: string): Spell => {
  const spell = spellMap.get(id);
  if (!spell) throw new Error(`Cannot find spell ${id}`);
  return _.cloneDeep(spell);
}

export const getReserchTree = () => {
  return _.cloneDeep(researchTree);
}

export const initializeResearchTree = () => {
  if (spellMap.size === 0) throw new Error('No spells available');

  const magicTypes = Object.keys(magicAlignmentTable);

  // Reset research tree
  researchTree.clear();
  magicTypes.forEach(magicType => {
    const m = new Map<string, string[]>();
    m.set('ascendant', []);
    m.set('verdant', []);
    m.set('eradication', []);
    m.set('nether', []);
    m.set('phantasm', []);
    researchTree.set(magicType, m);
  });

  // Create research tree, shuffle the order at each rank
  magicTypes.forEach(magicType => {
    const research = magicAlignmentTable[magicType].research;
    const tree = researchTree.get(magicType);

    magicTypes.forEach(researchMagicType => {
      const researchRanks = research[researchMagicType]; 
      const researchOrder = tree.get(researchMagicType);
      researchRanks.forEach((rank: string) => {
        const researchableSpells = spellList.filter(d => d.magic === researchMagicType && d.rank === rank);
        _.shuffle(researchableSpells).forEach(spell => {
          researchOrder.push(spell.id);
        });
      });
    })
  });
}

// Do research, 
// This assumes that spell takes at least one turn to research despite the points generated
export const doResearch = (mage: Mage, points: number) => {
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
