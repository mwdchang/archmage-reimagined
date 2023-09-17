import { Mage } from 'shared/types/mage';
import { createStackByNumber } from './army';
import { researchTree, getSpellById } from './magic';
import { mageStartTable, magicAlignmentTable } from './config';

let _id = 0;

export const createMage = (name: string, magic: string): Mage => {
  const mage: Mage = {
    id: ++_id,
    name: name,

    magic: magic,
    currentSpellLevel: 0,
    maxSpellLevel: 1000,

    spellbook: {
      ascendant: [],
      verdant: [],
      eradication: [],
      nether: [],
      phantasm: []
    },

    currentResearch: {
      ascendant: null,
      verdant: null,
      eradication: null,
      nether: null,
      phantasm: null
    },

    netPower: 0,
    currentTurn: 100,
    maxTurn: 1000,

    currentPopulation: 1000,
    currentMana: 1000,
    currentGeld: 2000000,

    farms: 150,
    towns: 60,
    workshops: 150,
    nodes: 30,
    barracks: 10,
    libraries: 10,
    fortresses: 9,
    barriers: 0,
    wilderness: 181,
    army: [],
    items: [],
    heroes: [],
    enchantments: []
  };

  // Set starting army
  mageStartTable.army.forEach(d => {
    mage.army.push(createStackByNumber(d.id, d.size));
  });

  // Seed research, default to reserch on mage's magic colour
  const tree = researchTree.get(mage.magic);
  const spellMagicTypes = ['ascendant', 'verdant', 'eradication', 'nether', 'phantasm'];

  spellMagicTypes.forEach(spellMagicType => {
    const spellId = tree.get(spellMagicType)[0];
    if (!spellId) return;

    const spell = getSpellById(spellId);
    const researchCostModifier = magicAlignmentTable[mage.magic].costModifier[spellMagicType];

    mage.currentResearch[spellMagicType] = {
      id: spell.id,
      remainingCost: spell.researchCost * researchCostModifier,
      active: spellMagicType === mage.magic
    }
  });

  return mage;
}
