import _ from 'lodash';
import { allowedEffect as E } from "shared/src/common";
import type { Mage } from 'shared/types/mage';
import { getAllUniqueItems, getItemById, getSkillById, getSpellById } from "./base/references";
import type { EffectOrigin, Effect, PrebattleEffect, BattleEffect, UnitAttrEffect, UnitHealEffect, UnitDamageEffect, TemporaryUnitEffect, CastingCostEffect } from "shared/types/effects";
import { currentSpellLevel } from "./base/mage";
import { AllowedMagic } from 'shared/types/common';


export interface ActiveEffect {
  objId: string;
  objType: string;
  effects: Effect<any>[];
  origin: EffectOrigin;
}

/**
 * Scans through enchantments, skills, and unique items
**/
export const getActiveEffects = (
  mage: Mage, 
  effectType: E, 
  targetId?: number
) => {
  const results: ActiveEffect[] = [];

  // Enchantments
  const enchantments = mage.enchantments;
  for (const enchantment of enchantments) {
    const spell = getSpellById(enchantment.spellId);
    const enchantEffects = spell.effects.filter(s => s.effectType === effectType);
    const origin: EffectOrigin = {
      id: enchantment.casterId,
      magic: enchantment.casterMagic,
      spellLevel: enchantment.spellLevel,
      targetId: targetId ? targetId : mage.id
    }
    results.push({
      objId: spell.id,
      objType: 'enchantment',
      origin: origin,
      effects: enchantEffects
    });
  }

  // UniqueItems
  const uniques = getAllUniqueItems();
  for (const itemKey of Object.keys(mage.items)) {
    const uniqueItem = uniques.find(d => d.id === itemKey);
    if (!uniqueItem) continue;

    const origin: EffectOrigin = {
      id: mage.id,
      magic: mage.magic,
      spellLevel: currentSpellLevel(mage),
      targetId: targetId ? targetId : mage.id
    }
    const itemEffects = uniqueItem.effects.filter(s => s.effectType === effectType);
    results.push({
      objId: uniqueItem.id,
      objType: 'item',
      origin: origin,
      effects: itemEffects 
    });
  }

  // Skills
  for (const [skillId, level] of Object.entries(mage.skills)) {
    const skill = getSkillById(skillId);
    const origin: EffectOrigin = {
      id: mage.id,
      magic: mage.magic,
      spellLevel: currentSpellLevel(mage),
      targetId: targetId ? targetId : mage.id
    }

    const skillEffects = skill.effects.filter(s => s.effectType === effectType);
    results.push({
      objId: skill.id,
      objType: 'skill',
      origin: origin,
      effects: skillEffects.map(s => applySkillLevelToEffect(s, level)) 
    });
  }
  
  return results;
}


export const getActiveEffectsForBattle = (
  mage: Mage, 
  effectType: E, 
  spellId: string | null,
  itemId: string | null,
  targetId?: number
) => {

  const results = getActiveEffects(mage, effectType, targetId);
  console.log('!!', results);

  if (spellId) {
    const spell = getSpellById(spellId);
    const spellEffects = spell.effects.filter(s => s.effectType === effectType);
    const origin: EffectOrigin = {
      id: mage.id,
      magic: mage.magic,
      spellLevel: currentSpellLevel(mage),
      targetId: targetId ? targetId : mage.id
    }
    results.push({
      objId: spell.id,
      objType: 'spell',
      origin: origin,
      effects: spellEffects
    });
  }
  if (itemId) {
    const item = getItemById(itemId);
    const origin: EffectOrigin = {
      id: mage.id,
      magic: mage.magic,
      spellLevel: currentSpellLevel(mage),
      targetId: targetId ? targetId : mage.id
    }
    const itemEffects = item.effects.filter(s => s.effectType === effectType);
    results.push({
      objId: item.id,
      objType: 'item',
      origin: origin,
      effects: itemEffects 
    });
  }
  return results;
}


const applySkillLevelToEffect = (effect: Effect<any>, level: number) => {
  const effectClone = _.cloneDeep(effect);
  if (effectClone.effectType === E.BattleEffect || effectClone.effectType === E.PrebattleEffect) {
    return applySkillLevelToBattleEffect(effectClone as any, level);
  } 
  if (effectClone.effectType === E.CastingCostEffect) {
    return applySkillLevelToCastingCostEffect(effectClone as any, level);
  }
  throw new Error(`Skill boosting for : ${effect.effectType} not implemented`);
};


const applySkillLevelToBattleEffect = (battleEffect: BattleEffect | PrebattleEffect, level: number) => {
  battleEffect.effects.forEach(eff => {
    const type = eff.effectType;
    if (type === E.UnitAttrEffect) {
      const effect = eff as UnitAttrEffect;
      const attrValues = Object.values(effect.attributes);
      attrValues.forEach(attrValue => {
        for (const magic of Object.keys(attrValue.magic) as AllowedMagic[]) {
          // non numerics (eg. abilities) cannot be multiplied
          if (typeof attrValue.magic[magic].value === 'number') {
            attrValue.magic[magic].value *= level;
          }
        }
      })
    } else if (type === E.UnitHealEffect) {
      const effect = eff as UnitHealEffect;
      for (const magic of Object.keys(effect.magic) as AllowedMagic[]) {
        if (typeof effect.magic[magic].value === 'number') {
          effect.magic[magic].value *= level;
        }
      }
    } else if (type === E.UnitDamageEffect) {
      const effect = eff as UnitDamageEffect;
      for (const magic of Object.keys(effect.magic) as AllowedMagic[]) {
        effect.magic[magic].value.min *= level;
        effect.magic[magic].value.max *= level;
      }
    } else if (type === E.TemporaryUnitEffect) {
      const effect = eff as TemporaryUnitEffect;
      for (const magic of Object.keys(effect.magic) as AllowedMagic[]) {
        effect.magic[magic].value.min *= level;
        effect.magic[magic].value.max *= level;
      }
    } else {
      throw new Error(`Skill boosting for : ${type} not implemented`);
    }
  });
  return battleEffect;
}


const applySkillLevelToCastingCostEffect = (effect: CastingCostEffect, level: number) => {
  for (const magic of Object.keys(effect.magic) as AllowedMagic[]) {
    effect.magic[magic].value.innate *= level;
    effect.magic[magic].value.adjacent *= level;
    effect.magic[magic].value.opposite *= level;
  }
  return effect;
}
