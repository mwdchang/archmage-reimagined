import { EffectOrigin, KingdomResourcesEffect } from "shared/types/effects";
import { Mage } from "shared/types/mage";
import { getMaxSpellLevels } from "../base/references";
import { between, randomBM } from "../random";
import { doItemGeneration } from "../magic";

export const applyKingdomResourcesEffect = (
  mage: Mage, 
  effect: KingdomResourcesEffect,
  origin: EffectOrigin
) => {
  const spellLevel = origin.spellLevel;
  const magic = origin.magic;
  const maxSpellLevel = getMaxSpellLevels()[magic];
  const spellPowerScale = spellLevel / maxSpellLevel;

  if (effect.rule === 'spellLevelLoss' || effect.rule === 'spellLevelGain') {
    const { min, max } = effect.magic[magic].value as { min: number, max: number };
    const base = between(min, max);

    // Give it a little bit of randomness
    let value = Math.floor((1.0 + 0.4 * randomBM()) * spellPowerScale * base);
    if (effect.rule === 'spellLevelLoss') {
      value = -value;
    }

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
        for (let i = 0; i < value; i++) {
          const item = doItemGeneration(mage, true);
          console.log(`Found ${item.id}`);
        }
      } else {
        // FIXME: item loss
      }
    }
  }
};

