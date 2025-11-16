import { allowedEffect as E, allowedMagicList } from "shared/src/common";
import { BattleEffect, Effect, PostbattleEffect, UnitAttrEffect, UnitDamageEffect, UnitHealEffect } from "shared/types/effects";
import { Spell } from "shared/types/magic";
import { Unit } from "shared/types/unit";

const attackTypes = new Set([
  'missile', 'fire', 'poison', 
  'breath', 'magic', 'melee', 
  'ranged', 'lightning', 'cold', 
  'paralyse', 'psychic', 'holy'
]);

const magicTypes = new Set([...allowedMagicList] as string[]);

const attrTypes = new Set([
  'hitPoints',
  'primaryAttackPower', 'primaryAttackType', 'primaryAttackInit', 'counterAttackPower',
  'secondaryAttackPower', 'secondaryAttackType', 'secondaryAttackInit',
  'spellResistances', 'attackResistances',
  'accuracy', 'efficiency',
  'abilities', 'abilities2'
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
        throw new Error(`${s.id}: effect condition ${effect.condition} not valid`);
      }
      effect.effects.forEach(d => { validateEffect(d, s.id); });
    } else {
      validateEffect(eff, s.id);
    }
  }
}

export const validateEffect = (eff: Effect<any>, spellId: string) => {
  const type = eff.effectType;

  if (eff.effectType === E.UnitAttrEffect) {
    const effect = eff as UnitAttrEffect;
    for (const [k, v] of Object.entries(effect.attributes)) {
      for (const attr of  k.split(',')) {
        const [f1, f2] = attr.split('.');

        if (f1 === 'attackResistances' && f2) {
          if (!attackTypes.has(f2)) {
            throw new Error(`${spellId}:${effect.effectType} attribute ${attr} not valid`);
          }
        }
        if (f1 === 'spellResistances' && f2) {
          if (!magicTypes.has(f2)) {
            throw new Error(`${spellId}:${effect.effectType} attribute ${attr} not valid`);
          }
        }
        if (!attrTypes.has(f1)) {
          throw new Error(`${spellId}:${effect.effectType} attribute ${attr} not valid`);
        }
      }

      if (![
        'set', 'add', 'remove', 'addPercentageBase', 
        'addSpellLevel', 'addSpellLevelPercentage', 
        'addSpellLevelPercentageBase'
      ].includes(v.rule)) {
        throw new Error(`${spellId}:${effect.effectType} rule ${v} not valid`);
      }

      for (const [k2, v2] of Object.entries(v.magic)) {
        if (!magicTypes.has(k2)) {
          throw new Error(`${spellId}:${effect.effectType} magic ${k2} not valid`);
        }
      }
    }
  }

  if (eff.effectType === E.UnitDamageEffect) {
    const effect = eff as UnitDamageEffect;

    if (![
      'direct', 'unitLoss', 'spellLevel',
      'spellLevelUnitLoss', 'spellLevelUnitDamage'
    ].includes(effect.rule)) {
      throw new Error(`${spellId}:${effect.effectType} rule ${effect.rule} not valid`);
    }

    for (const dtype of effect.damageType) {
      if (!attackTypes.has(dtype)) {
        throw new Error(`${spellId}:${effect.effectType} damageType ${dtype} not valid`);
      }
    }

    for (const [k2, v2] of Object.entries(effect.magic)) {
      if (!magicTypes.has(k2)) {
        throw new Error(`${spellId}:${effect.effectType} magic ${k2} not valid`);
      }
    }
  }

  if (eff.effectType === E.UnitHealEffect) {
    const effect = eff as UnitHealEffect;
    if (!['points', 'percentage', 'units'].includes(effect.healType)) {
      throw new Error(`${spellId}:${effect.effectType} healType ${effect.healType} not valid`);
    }

    if (!['none', 'spellLevel'].includes(effect.rule)) {
      throw new Error(`${spellId}:${effect.effectType} rule ${effect.rule} not valid`);
    }

    for (const [k2, v2] of Object.entries(effect.magic)) {
      if (!magicTypes.has(k2)) {
        throw new Error(`${spellId}:${effect.effectType} magic ${k2} not valid`);
      }
    }
  }

}
