import { magicAlignmentTable } from 'engine/src/base/config';
import { 
  getSpellById,
  getItemById,
  getUnitById
} from 'engine/src/base/references';
import { npMultiplier } from 'engine/src/base/unit';
import { Spell } from 'shared/types/magic';
import { Enchantment, Mage } from 'shared/types/mage';
import { allowedMagicList } from 'shared/src/common';

export interface MageItem {
  id: string,
  name: string,
  attributes: string[],
  amount: number
}

export const spellDisplay = (spell: Spell, magic: string) => {
  return {
    id: spell.id,
    magic: spell.magic,
    name: spell.name,
    castingCost: spell.castingCost * magicAlignmentTable[magic].costModifier[spell.magic],
    castingTurn: spell.castingTurn,
    attributes: spell.attributes
  };
}

export const getSpells = (mage: Mage) => {
  if (!mage) return [];
  const result: any = [];

  for (const magic of allowedMagicList) {
    mage.spellbook[magic].forEach(spellId => {
      const spell = getSpellById(spellId);
      result.push(spellDisplay(spell, mage.magic));
    });
  }
  return result;
}

export const getItems = (mage: Mage): MageItem[] => {
  let result: MageItem[] = [];
  Object.keys(mage.items).forEach(key => {
    const item = getItemById(key);
    result.push({
      id: key,
      name: item.name,
      attributes: item.attributes,
      amount: mage.items[key] as number
    });
  });
  return result;
}


export interface ArmyItem {
  id: string,
  name: String,
  size: number,
  upkeep: { [key: string]: number },
  attributes: string[],
  power: number,
  powerPercentage: number
}
export interface BattleArmyItem extends ArmyItem {
  active: boolean
}

export const getArmy = (mage: Mage) => {
  let result: ArmyItem[] = [];
  let totalArmyPower = 0;

  mage.army.forEach(stack => {
    const unit = getUnitById(stack.id);
    const multiplier = npMultiplier(unit);

    const upkeep = {
      geld: Math.ceil(stack.size * unit.upkeepCost.geld),
      mana: Math.ceil(stack.size * unit.upkeepCost.mana),
      population: Math.ceil(stack.size * unit.upkeepCost.population)
    };

    result.push({
      id: stack.id,
      name: unit.name,
      size: stack.size,
      upkeep,
      attributes: unit.attributes,
      power: multiplier * unit.powerRank * stack.size,
      powerPercentage: 0
    });
    totalArmyPower += multiplier * unit.powerRank * stack.size;
  });

  result.forEach(d => {
    d.powerPercentage = d.power / totalArmyPower;
  });
  return result;
}


export const getBattleArmy = (mage: Mage) => {
  const rawArmy = getArmy(mage);
  let result: BattleArmyItem[] = []; 

  rawArmy.forEach(d => {
    result.push({
      ...d,
      active: false
    });
  });
  return result;
}


export const enchantMagic = (enchantment: Enchantment) => {
  const spell = getSpellById(enchantment.spellId);
  return spell.magic;
};


/**
 * Human readable string for spell and item assignment conditions
**/
export const conditionString = (v: number) => {
  if (v < 0) return 'Never';
  if (v === 0) return 'Always';

  return `Greater than ${v}%`;
}

const userLocale =
  navigator.languages && navigator.languages.length > 0
    ? navigator.languages[0]
    : navigator.language || 'en-US';


export const readableStr = (str: string) => {
  if (!str) return '';

  // Insert space before capital letters and capitalize the first word
  return str
    .replace(/([A-Z])/g, ' $1')   // insert space before capital letters
    .replace(/^./, char => char.toUpperCase()); // capitalize first letter
}


export const readbleNumber = (
  v: number,
  options?: Intl.NumberFormatOptions
) => {
  return new Intl.NumberFormat(userLocale, options).format(v);
}

export const readableDate = (date: Date | string | number) => {
  const d = new Date(date);
  return new Intl.DateTimeFormat(userLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(d) + ' UTC';
};
