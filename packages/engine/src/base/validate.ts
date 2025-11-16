import { allowedEffect as E } from "shared/src/common";
import { BattleEffect, Effect, PostbattleEffect } from "shared/types/effects";
import { Spell } from "shared/types/magic";
import { Unit } from "shared/types/unit";

const attackTypes = new Set([
  'missile', 'fire', 'poison', 
  'breath', 'magic', 'melee', 
  'ranged', 'lightning', 'cold', 
  'paralyse', 'psychic', 'holy'
]);


// Validate a unit
export const validateUnit = (u: Unit) => {
  for (const type of u.primaryAttackType) {
    if (!attackTypes.has(type)) {
      throw new Error(`${u.id}: ${type} does not match valid attack types`);
    }
  }
  for (const type of u.secondaryAttackType) {
    if (!attackTypes.has(type)) {
      throw new Error(`${u.id}: ${type} does not match valid attack types`);
    }
  }
  for (const r of Object.keys(u.attackResistances)) {
    if (!attackTypes.has(r)) {
      throw new Error(`${u.id}: ${r} does not match valid resistances`);
    }
  }
}

export const validateSpell = (s: Spell) => {
  for (const eff of s.effects) {
    const type = eff.effectType;
    if (type === E.BattleEffect || type === E.PrebattleEffect) {
      const effect = eff as BattleEffect;
      if (!['self', 'opponent', 'both'].includes(effect.target)) {
        throw new Error(`${s.id}: effect target ${effect.target} not valid`);
      }
      if (!['all', 'random', 'weightedRandom'].includes(effect.targetType)) {
        throw new Error(`${s.id}: effect targetType ${effect.targetType} not valid`);
      }
      effect.effects.forEach(d => { validateEffect(d, s.id); });
    } else if (type === E.PostbattleEffect) {
      const effect = eff as PostbattleEffect;
      if (!['self', 'opponent'].includes(effect.target)) {
        throw new Error(`${s.id}: effect target ${effect.target} not valid`);
      }
      if (!['win', 'all'].includes(effect.condition)) {
        throw new Error(`${s.id}: effect condiation ${effect.condition} not valid`);
      }
      effect.effects.forEach(d => { validateEffect(d, s.id); });
    } else {
      validateEffect(eff, s.id);
    }
  }
}

export const validateEffect = (eff: Effect<any>, spellId: string) => {
  const type = eff.effectType;
}
