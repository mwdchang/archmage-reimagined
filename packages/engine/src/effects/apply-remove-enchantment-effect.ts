import _ from "lodash";
import { EffectOrigin, RemoveEnchantmentEffect } from "shared/types/effects";
import { Mage } from "shared/types/mage";
import { betweenInt } from "../random";


export interface RemoveEnchantmentEffectResult {
  effectType: 'RemoveEnchantmentEffect',
  id: number,
  name: string,
  targetId?: number,
  targetName?: string,

  spellIds: string[],
}

export const applyRemoveEnchantmentEffect = (
  mage: Mage,
  effect: RemoveEnchantmentEffect,
  origin: EffectOrigin,
  targetMage: Mage | null
) => {
  const { min, max } = effect.trigger;
  const base = betweenInt(min, max);

  const result: RemoveEnchantmentEffectResult = {
    effectType: 'RemoveEnchantmentEffect',
    id: mage.id,
    name: mage.name,
    spellIds: []
  }
  if (targetMage) {
    result.targetId = targetMage.id;
    result.targetName = targetMage.name;
  }

  for (let i = 0; i < base; i++) {
    if (targetMage === null) {
      // Remove random enchantments
      const enchants = targetMage.enchantments.filter(d => d.isActive === true);
      if (enchants.length === 0) continue;
      const shuffled = _.shuffle(enchants);
      shuffled[0].isActive = false;
      result.spellIds.push(shuffled[0].spellId);
    } else {
      // Remove enchantments from others first
      const enchants = mage.enchantments.filter(d => d.isActive === true);
      if (enchants.length === 0) continue;

      const otherEnchants = enchants.filter(d => d.casterId !== mage.id);
      if (otherEnchants.length === 0) {
        const ownEnchants = enchants.filter(d => d.casterId === mage.id);
        if (ownEnchants.length === 0) continue;
        const shuffled = _.shuffle(ownEnchants);
        shuffled[0].isActive = false;
        result.spellIds.push(shuffled[0].spellId);
      } else {
        const shuffled = _.shuffle(otherEnchants);
        shuffled[0].isActive = false;
        result.spellIds.push(shuffled[0].spellId);
      }
    }
  }
  return result;
}
