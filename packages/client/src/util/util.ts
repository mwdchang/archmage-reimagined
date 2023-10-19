import { magicAlignmentTable } from 'engine/src/base/config';
import { 
  getSpellById,
  getItemById,
  getUnitById
} from 'engine/src/base/references';
import { npMultiplier } from 'engine/src/base/unit';
import { Spell } from 'shared/types/magic';
import { Mage } from 'shared/types/mage';

interface MageItem {
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
    castingTurn: spell.castingTurn
  };
}

export const getSpells = (mage: Mage) => {
  if (!mage) return [];
  const result: any = [];
  mage.spellbook.ascendant.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });
  mage.spellbook.verdant.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });
  mage.spellbook.eradication.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });
  mage.spellbook.nether.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });
  mage.spellbook.phantasm.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });

  return result;
}

export const getItems = (mage: Mage) => {
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
