import { magicAlignmentTable } from 'engine/src/base/config';
import { getSpellById } from 'engine/src/base/references';
import { getItemById } from 'engine/src/base/references';
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
