import { EffectOrigin, StealEffect } from "shared/types/effects";
import { Mage } from "shared/types/mage";
import { getMaxSpellLevels } from "../base/references";
import { between } from "../random";
import { doItemDestruction } from "../magic";


export interface StealEffectResult {
  effectType: 'StealEffect',
  id: number,
  name: string,
  targetId: number,
  targetName: string,

  target: string,
  lossValue: number,
  stealValue: number
}

export const applyStealEffect = (
  mage: Mage,
  effect: StealEffect,
  origin: EffectOrigin,
  targetMage: Mage
) => {
  const spellLevel = origin.spellLevel;
  const magic = origin.magic;
  const maxSpellLevel = getMaxSpellLevels()[magic];
  const spellPowerScale = spellLevel / maxSpellLevel;

  const { min, max } = effect.magic[magic].value as { min: number, max: number };
  const base = between(min, max);
  const stealPercent = effect.magic[magic].value.stealPercent;

  let lossValue = 0;
  let stealValue = 0;

  // Figuire out the amount target mage loses
  if (effect.rule === 'addSpellLevelPercentageBase') {
    if (effect.target === 'geld') {
      lossValue = Math.floor(base * targetMage.currentGeld * spellPowerScale);
      lossValue = Math.min(targetMage.currentGeld, lossValue);
    } else if (effect.target === 'mana') {
      lossValue = Math.floor(base * targetMage.currentMana * spellPowerScale);
      lossValue = Math.min(targetMage.currentMana, lossValue);
    } else if (effect.target === 'item') {
      lossValue = base
    }
  } else if (effect.rule === 'addSpellLevelPercentage') {
    if (effect.target === 'geld') {
      lossValue = Math.floor(base * spellPowerScale);
      lossValue = Math.min(targetMage.currentGeld, lossValue);
    } else if (effect.target === 'mana') {
      lossValue = Math.floor(base * spellPowerScale);
      lossValue = Math.min(targetMage.currentMana, lossValue);
    } else if (effect.target === 'item') {
      lossValue = base
    }
  } else {
    throw new Error(`Unable to process ${effect.rule} for ${origin.spellId}`);
  }

  // Figure out the amount to keep
  stealValue = effect.target === 'item' ? lossValue : Math.floor(stealPercent * lossValue);

  // Finally resolve
  if (effect.target === 'geld') {
    targetMage.currentGeld -= lossValue;
    mage.currentGeld += stealValue;
    console.log(`You destroyed ${lossValue} geld, you stole ${stealValue} geld`);
  } else if (effect.target === 'mana') {
    targetMage.currentMana -= lossValue;
    mage.currentMana += stealValue;
    console.log(`You destroyed ${lossValue} mana, you stole ${stealValue} mana`);
  } else if (effect.target === 'item') {
    for (let i = 0; i < stealValue; i++) {
      const itemId = doItemDestruction(targetMage);
      if (itemId === null) {
        console.log('You stole no items');
        break;
      }

      if (mage.items[itemId]) {
        mage.items[itemId] ++;
      } else {
        mage.items[itemId] = 1;
      }
      console.log(`You stole ${itemId} from ${targetMage.id}`);
    }
  }

  const r: StealEffectResult = {
    effectType: 'StealEffect',
    id: mage.id,
    name: mage.name,
    targetId: targetMage.id,
    targetName: targetMage.name,

    target: effect.target,
    lossValue: lossValue,
    stealValue: stealValue
  };
  return r
}
