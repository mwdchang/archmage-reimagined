import { Mage } from 'shared/types/mage';
import { createStackByNumber } from './unit';
import { researchTree, getSpellById, getUnitById } from './references';
import { mageStartTable, magicAlignmentTable } from './config';

let _id = 0;

export const createMage = (name: string, magic: string): Mage => {
  const mage: Mage = {
    id: ++_id,
    name: name,

    magic: magic,
    currentSpellLevel: 0,

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
    currentTurn: 2000,
    maxTurn: 2000,

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
    items: {},
    heroes: [],
    enchantments: [],

    assignment: {
      spellId: -1,
      spellCondition: 0,
      itemId: -1,
      itemCondition: 0,
    }
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

  Object.keys(mage.items).forEach(key => {
    netpower += 1000 * mage.items[key];
  });

  // Army
  mage.army.forEach(stack => {
    const u = getUnitById(stack.id);
    netpower += u.powerRank + stack.size;
  });

  // TODO: allies and heroes??
  return netpower;
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

export const calcKingdomResistance = (mage: Mage) => {
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
