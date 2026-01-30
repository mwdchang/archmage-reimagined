import type { Mage, ResearchItem } from 'shared/types/mage';
import { createStackByNumber } from './unit';
import { researchTree, getSpellById, getUnitById } from './references';
import { mageStartTable, magicAlignmentTable, spellRankTable } from './config';
import { allowedMagicList } from 'shared/src/common';
import { AllowedMagic } from 'shared/types/common';


export const createMage = (id: number, name: string, magic: string, override?:Partial<Mage>): Mage => {
  const mage: Mage = {
    id: id,
    name: name,
    status: '',
    type: '',

    magic: magic,
    adjacent: [],
    opposite: [],

    testingSpellLevel: 0,

    spellbook: allowedMagicList.reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {} as Record<AllowedMagic, string[]>),

    currentResearch: allowedMagicList.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {} as Record<AllowedMagic, ResearchItem | null>),

    focusResearch: false,

    netPower: 0, // Deprecated
    currentTurn: 1000,
    maxTurn: 1000,
    turnsUsed: 0,

    currentPopulation: 60000,
    currentMana: 10000,
    currentGeld: 8000000,

    farms: mageStartTable.buildings.farms,
    towns: mageStartTable.buildings.towns,
    workshops: mageStartTable.buildings.workshops,
    nodes: mageStartTable.buildings.nodes,
    barracks: mageStartTable.buildings.barracks,
    guilds: mageStartTable.buildings.guilds,
    forts: mageStartTable.buildings.forts,
    barriers: mageStartTable.buildings.barriers,
    wilderness: mageStartTable.buildings.wilderness,

    army: [],
    recruitments: [],
    items: {
      'treasureChest': 10,
      'magicCompass': 10
    },
    heroes: [],
    enchantments: [],

    assignment: {
      spellId: '',
      spellCondition: -1,
      itemId: '',
      itemCondition: -1,
    },

    skillPoints: 0,
    skills: {}
  };

  // Set starting army
  mageStartTable.army.forEach(d => {
    mage.army.push(createStackByNumber(d.id, d.size));
  });

  // Seed research, default to reserch on mage's magic colour
  const tree = researchTree.get(mage.magic);
  allowedMagicList.forEach(spellMagicType => {
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

  Object.assign(mage, override);
  return mage;
}

// For ease of testing
// export const createMageTest = (name: string, magic: string, override: Partial<Mage>): Mage => {
//   let mage = createMage(name, magic);
//   mage = Object.assign(mage, override);
// 
//   return mage;
// }


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
    mage.guilds + 
    mage.forts + 
    mage.barriers);
  netpower += mage.forts * 19360;
  netpower += mage.barriers * 6500;

  // Mana, geld, items ... etc 
  netpower += Math.floor(0.05 * mage.currentMana);
  netpower += Math.floor(0.0005 * mage.currentGeld);
  netpower += Math.floor(0.02 * mage.currentPopulation);
  netpower += 1000 * currentSpellLevel(mage),

  Object.keys(mage.items).forEach(key => {
    if (!mage.items[key]) return;
    netpower += 1000 * mage.items[key];
  });

  // Army
  mage.army.forEach(stack => {
    const u = getUnitById(stack.id);
    netpower += u.powerRank * stack.size;
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
    mage.guilds + 
    mage.forts + 
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

export const currentSpellLevel = (mage: Mage) => {
  // For testing
  if (mage.testingSpellLevel > 0) return mage.testingSpellLevel;

  let result = 0;
  const addSpellPower = (id: string) => {
    const spell = getSpellById(id);
    const rankPower = spellRankTable[spell.rank];
    result += rankPower;
  }

  for (const magic of allowedMagicList) {
    mage.spellbook[magic].forEach(addSpellPower);
  }
  return result;
}

