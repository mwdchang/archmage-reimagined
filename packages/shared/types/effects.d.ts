/**
 * Effect hierarchy
 *
 * - Effect
 *   - BattleEffect
 *     - UnitAttrEffect
 *     - UnitHealeffect
 *     - UnitDamageEffect
 *   - UnitSummonEffect
**/

export interface Effect {
  // Expect the effectType to be one of the sub interfaces
  effectType: string
}

export interface ResistanceEffect extends Effect {
  rule: string,
  resistance: string,
  magic: {
    [key: string]: {
      value: number
    }
  }
}

export interface ProductionEffect extends Effect {
  rule: string,
  production: string,
  magic: {
    [key: string]: {
      value: number
    }
  }
}

/**
 * type can be one of
 * - summon
 * - castingRate
 */
export interface CastingEffect extends Effect {
  rule: string,
  type: string,
  magic: {
    [key: string]: {
      value: number
    }
  }
}

export interface UnitSummonEffect extends Effect {
  unitIds: string[],
  summonType: string, // random, all
  summonNetPower: number,
  rule: string,
  magic: {
    [key: string]: {
      value: number
    }
  }
}

export interface BattleEffect extends Effect {
  effects: (UnitAttrEffect | UnitDamageEffect | UnitHealEffect)[]
}

/**
 * The "rule" field dictates how the attributeMap fields are to be modified by the magic value.
 *
 * The general grammar is:
 *   "Change unit's XYZ if it matches criteria by RULE and magic VALUE
 *
 * The rule types are:
 *
 * - add: Add value to array fields, e.g. abilities, attack types
 * - remove: Remove value to array fields, e.g. abilities, attack types
 *
 * - spellLevel: X = X + mage.spellLevel * value
 * - spellLevelPercentage: X = X + (X * mage.spellLevel * value)
 *
 * - percentage: X = X + X * value
**/

type EffectTarget = 'self' | 'opponent' | 'all';
type EffectStack = 'all' | 'random';

export interface UnitEffect {
  effectType: string,
  target: EffectTarget,
  stack: EffectStack,
  filters: any,
}

export interface UnitAttrEffect {
  attributes: {
    [key: string]: {
      rule: string,
      magic: {
        [key: string]: {
          value: any
        }
      }
    }
  }
}

export interface UnitDamageEffect { 
  damageType: string[],
  rule: string,
  minTimes: number,
  maxtimes: number,
  magic: {
    [key: string]: {
      value: any
    }
  }
}

export interface UnitHealEffect {
  healType: string,
  rule: string,
  magic: {
    [key: string]: {
      value: any
    }
  }
}
