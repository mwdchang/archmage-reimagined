import _ from 'lodash';
import { Unit } from 'shared/types/unit';
import { Spell, Item } from 'shared/types/magic';
import { magicAlignmentTable, spellRankTable } from './config';
import { randomInt } from '../random';

export const unitMap = new Map<string, Unit>();
export const magicTypes = ['ascendant', 'verdant', 'eradication', 'nether', 'phantasm'];
export const spellMap = new Map<string, Spell>();
export const researchTree = new Map<string, Map<string, string[]>>;
export const itemMap = new Map<string, Item>();

const spellList: Spell[] = [];
const itemList: Item[] = [];
const maxSpellLevels = {
  ascendant: 0,
  verdant: 0,
  eradication: 0,
  nether: 0,
  phantasm: 0
};

export const loadUnitData = (units: Unit[]) => {
  for (let i = 0; i < units.length; i++) {
    unitMap.set(units[i].id, units[i]);
    console.log(`Unit[${units[i].magic}] ${units[i].name} loaded`);
  }
}

export const getUnitById = (id: string): Unit => {
  const unit = unitMap.get(id);
  if (!unit) throw new Error(`Cannot find unit ${id}`);
  return _.cloneDeep(unit);
}

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

export const loadItemData = (items: Item[]) => {
  for (let i = 0; i < items.length; i++) {
    itemMap.set(items[i].id, items[i]);
    itemList.push(items[i]);
    console.log(`Item[${items[i].name}] loaded`);
  }
}

export const getItemById = (id: string): Item => {
  const item = itemMap.get(id);
  if (!item) throw new Error(`Cannot find item ${id}`);
  return _.cloneDeep(item);
}

export const getRandomItem = () => {
  return itemList[randomInt(itemList.length)];
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

        // Calculate and cache max spell level for each color
        const spellLevel = spellRankTable[rank] * researchableSpells.length;
        maxSpellLevels[magicType] += spellLevel;

        _.shuffle(researchableSpells).forEach(spell => {
          researchOrder.push(spell.id);
        });
      });
    })
  });
  console.log('Debug max spell levels', maxSpellLevels);
  // console.log(researchTree);
}

export const getResearchTree = () => {
  return _.cloneDeep(researchTree);
}

export const getMaxSpellLevels = () => {
  return _.clone(maxSpellLevels);
}
