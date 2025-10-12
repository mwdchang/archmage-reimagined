import { EffectOrigin, KingdomResourcesEffect } from "shared/types/effects";
import { Mage } from "shared/types/mage";
import { getMaxSpellLevels } from "../base/references";
import { between, randomBM } from "../random";
import { doItemDestruction, doItemGeneration } from "../magic";

export interface KingdomResourcesEffectResult {
  effectType: 'KingdomResourcesEffect',
  id: number,
  name: string,

  target: string,
  value: number
}

export const applyKingdomResourcesEffect = (
  mage: Mage,
  effect: KingdomResourcesEffect,
  origin: EffectOrigin
) => {
  const spellLevel = origin.spellLevel;
  const magic = origin.magic;
  const maxSpellLevel = getMaxSpellLevels()[magic];
  const spellPowerScale = spellLevel / maxSpellLevel;

  const { min, max } = effect.magic[magic].value as { min: number, max: number };
  const base = between(min, max);

  let value = 0;
  if (effect.rule === 'addSpellLevelPercentage') {
    // Give it a little bit of randomness
    value = (1.0 + 0.4 * randomBM()) * spellPowerScale * base;
  } else if (effect.rule === 'addSpellLevelPercentageBase') {
    if (effect.target === 'item') {
      value = Object.keys(mage.items).length * base * spellPowerScale;
    } else if (effect.target === 'population') {
      value = mage.currentPopulation * base * spellPowerScale;
    } else if (effect.target === 'mana') {
      value = mage.currentMana * base * spellPowerScale;
    } else  if (effect.target === 'geld') {
      value = mage.currentGeld * base * spellPowerScale;
    } else if (effect.target === 'turn') {
      throw new Error('addSpellLevelPercentage not supported for turns');
    }
  } else if (effect.rule === 'add') {
    value = base;
  } else {
    throw new Error(`Unable to find rule ${effect.rule}`);
  }
  value = Math.floor(value); 

  const result: KingdomResourcesEffectResult = {
    effectType: 'KingdomResourcesEffect',
    id: mage.id,
    name: mage.name,

    target: '',
    value: 0
  };

  if (effect.target === 'population') {
    if (mage.currentPopulation + value <= 0) {
      value = -mage.currentPopulation;
    }
    mage.currentPopulation += value;

    result.target = 'population';
    result.value = value;
    console.log(`mage(#${mage.id}) lost ${value} population`);
  } else if (effect.target === 'geld') {
    if (mage.currentGeld + value <= 0) {
      value = -mage.currentGeld;
    }
    mage.currentPopulation += value;

    result.target = 'geld';
    result.value = value;
    console.log(`mage(#${mage.id}) lost ${value} geld`);
  } else if (effect.target === 'mana') {
    if (mage.currentMana + value <= 0) {
      value = -mage.currentMana;
    }
    mage.currentMana += value;

    result.target = 'mana';
    result.value = value;
    console.log(`mage(#${mage.id}) lost ${value} mana`);
  } else if (effect.target === 'item') {
    if (value > 0) {
      // item gain
      for (let i = 0; i < Math.abs(value); i++) {
        const item = doItemGeneration(mage, true);
        console.log(`Found ${item.id}`);
      }
    } else {
      // item loss
      for (let i = 0; i < Math.abs(value); i++) {
        const itemKey = doItemDestruction(mage);
        console.log(`Destroyed ${itemKey}`);
      }
    }
    result.target = 'item';
    result.value = value;
  } else if (effect.target === 'turn') {
    if (mage.currentTurn + value <= 0) {
      value = -mage.currentTurn;
    }
    mage.currentTurn += value;

    result.target = 'turn';
    result.value = value;
    console.log(`mage(#${mage.id}) lost ${value} turns`);
  }

  return result;
};
