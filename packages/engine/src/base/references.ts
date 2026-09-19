import _ from 'lodash';
import { Unit, UnitSchema } from 'shared/src/unit';
import { Spell, Item, SpellSchema, ItemSchema } from 'shared/src/magic';
import { Skill, SkillSchema } from 'shared/src/skills';
import { allowedMagicList } from 'shared/src/common';
import { AllowedMagic } from 'shared/src/common';
import { magicAlignmentTable, spellRankTable } from './config';
import { randomWeighted } from '../random';


export const unitMap = new Map<string, Unit>();

export const spellMap = new Map<string, Spell>();
export const researchTree = new Map<string, Map<string, string[]>>;
export const itemMap = new Map<string, Item>();
export const skillMap = new Map<string, Skill>();

const spellList: Spell[] = [];
const itemList: Item[] = [];

export const loadSkillGroup = (skills: Skill[]) => {
  for (const s of skills) {
    try {
      SkillSchema.parse(s);
    } catch (error) {
      throw new Error(`Failed to load skill: ${s.id}`, { cause: error });
    }
    skillMap.set(s.id, s);
  }
}

export const getAllSkills = () => {
  return _.cloneDeep([...skillMap.values()]);
}

export const getSkillById = (id: string) => {
  return _.cloneDeep(skillMap.get(id));
}

const maxSpellLevels: Record<AllowedMagic, number> = Object.fromEntries(
  allowedMagicList.map(type => [type, 0])
) as Record<AllowedMagic, number>;


export const loadUnitData = (units: Unit[]) => {
  for (let i = 0; i < units.length; i++) {
    try {
      UnitSchema.parse(units[i]);
    } catch (error) {
      throw new Error(`Failed to load unit: ${units[i].id}`, { cause: error });
    }
    unitMap.set(units[i].id, units[i]);
  }
}

export const getUnitById = (id: string): Unit => {
  const unit = unitMap.get(id);
  if (!unit) throw new Error(`Cannot find unit ${id}`);
  return _.cloneDeep(unit);
}

export const getAllUnits = (): Unit[] => {
  return _.clone([...unitMap.values()]);
}

export const getRecruitableUnits = (magic: string): Unit[] => {
  const recruitables: Unit[] = [];

  unitMap.forEach((unit: Unit) => {
    if (
      (unit.attributes.includes('special') && unit.magic === magic) ||
      (unit.attributes.includes('basic'))
    ) {
      recruitables.push(_.cloneDeep(unit));
    }
  });
  return recruitables;
}

export const loadSpellData = (spells: Spell[]) => {
  for (let i = 0; i < spells.length; i++) {
    if (spells[i].disabled === true) continue;

    try {
      SpellSchema.parse(spells[i]);
    } catch (error) {
      throw new Error(`Failed to load spell: ${spells[i].id}`, { cause: error });
    }
    spellMap.set(spells[i].id, spells[i]);
    spellList.push(spells[i]);
  }
}

export const getSpellById = (id: string): Spell => {
  const spell = spellMap.get(id);
  if (!spell) throw new Error(`Cannot find spell ${id}`);
  return _.cloneDeep(spell);
}

export const getAllSpells = (): Spell[] => {
  return _.cloneDeep(spellList);
};

export const loadItemData = (items: Item[]) => {
  for (let i = 0; i < items.length; i++) {
    try {
      ItemSchema.parse(items[i]);
    } catch (error) {
      throw new Error(`Failed to load item: ${items[i].id}`, { cause: error });
    }
    itemMap.set(items[i].id, items[i]);
    itemList.push(items[i]);
  }
}

export const getItemById = (id: string): Item => {
  const item = itemMap.get(id);
  if (!item) throw new Error(`Cannot find item ${id}`);
  return _.cloneDeep(item);
}

export const getAllLesserItems = (): Item[] => {
  const lessers = itemList.filter(item => item.attributes.includes('lesser'));
  return _.clone(lessers);
}

export const getAllUniqueItems = (): Item[] => {
  const uniques = itemList.filter(item => item.attributes.includes('unique'));
  return _.clone(uniques);
}

export const getRandomItem = () => {
  const lessers = itemList.filter(item => item.attributes.includes('lesser'));
  const totalW = lessers.reduce((acc, item) => acc + item.weight, 0);
  const weightTable = lessers.map((item, idx) => {
    return { value: idx, weight: 100 * item.weight / totalW };
  }).sort((a, b) => {
    return b.weight - a.weight;
  });

  const idx = randomWeighted(weightTable)
  return lessers[idx];
}

export const initializeResearchTree = () => {
  if (spellMap.size === 0) throw new Error('No spells available');

  const magicTypes = allowedMagicList;

  // Reset research tree
  researchTree.clear();
  magicTypes.forEach(magicType => {
    const m = new Map<string, string[]>();
    magicTypes.forEach(m2 => {
      m.set(m2, []);
    });
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
}

export const getResearchTree = () => {
  return _.cloneDeep(researchTree);
}

export const getMaxSpellLevels = () => {
  return _.clone(maxSpellLevels);
}

// For debugging
export const getResearchTreeJSON = () => {
  return Object.fromEntries(
    [...getResearchTree().entries()].map(([key, innerMap]) => [
      key,
      Object.fromEntries(innerMap),
    ])
  ) as { [key in AllowedMagic]: { [key in AllowedMagic]: string[] } }
}
