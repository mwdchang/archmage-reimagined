import { EffectOrigin, KingdomResourcesEffect } from "shared/types/effects";
import { Mage } from "shared/types/mage";
import { getMaxSpellLevels } from "../base/references";
import { between, randomBM } from "../random";
import { doItemDestruction, doItemGeneration } from "../magic";

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
    }
  }
  value = Math.floor(value); 

  if (effect.target === 'population') {
    if (mage.currentPopulation + value <= 0) {
      value = -mage.currentPopulation;
    }
    mage.currentPopulation += value;
    console.log(`mage(#${mage.id}) lost ${value} population`);
  } else if (effect.target === 'geld') {
    if (mage.currentGeld + value <= 0) {
      value = -mage.currentGeld;
    }
    mage.currentPopulation += value;
    console.log(`mage(#${mage.id}) lost ${value} geld`);
  } else if (effect.target === 'mana') {
    if (mage.currentMana + value <= 0) {
      value = -mage.currentMana;
    }
    mage.currentMana += value;
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
  }
};
