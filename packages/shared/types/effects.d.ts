/* Effects improved */
import type { UnitFilter } from './unit.d.ts';

export type ScalingRule = 
    'none'
  | 'add'                    // FIXME
  | 'percentage'             // FIXME
  | 'spellLevel'             // value * spellLevel
  | 'spellLevelPercentage'   // value * (spellLevel / baseSpellLevel)
;

export interface Effect {
  effectType: string
}

/**
 * Notes:
 *
 * chain-lightining: damage x-times

/**
 * BattleEffect are effects that are triggered before the battle takes place, it can augment/debuff
 * units attributes, cause direct damages, or alter unit abilities.
 *
 *   UnitAttrEffect
 *   UnitDamageEffect
 *   UnitHealEffect
**/


/**
 * Pseudo code:
 *
 * for (let i = 0; i < between(min, max); i++) {
 *   affectedStacks = match_units(filters);
 *   if (targetType === "random") {
 *     affectedStacks = random(affectedStacks);
 *   }
 *   applyEffect(...)
 * }
 *
**/
export interface BattleEffect extends Effect {
  target: 'self' | 'opponent' | 'both';
  targetType: 'all' | 'random' | 'weightedRandom'
  filters: UnitFilter[] | null;
  trigger: {
    min: number;
    max: number;
  } | null,
  effects: UnitAttrEffect[] | UnitDamageEffect[] | UnitHealEffect[]
}


export interface UnitAttrEffect extends Effect {
  checkResistance: boolean;
  attributes: {
    [key: string]: {
      rule: ScalingRule,
      magic: {
        [key: string]: {
          value: any
        }
      }
    }
  }
}

/**
 * direct: damage = value
 * spellLevel: damage = spellLevel * value
 * spellLevelUnit: unitloss = spellLevel * value
**/
export type UnitDamageRule = 'direct' | 'spellLevel' | 'spellLevelUnit';
export interface UnitDamageEffect extends Effect {
  checkResistance: boolean;
  damageType: string[],
  rule: UnitDamageRule,
  magic: {
    [key: string]: {
      value: any
    }
  }
}

export interface UnitHealEffect extends Effect {
  checkResistance: boolean; // not used
  healType: string,
  rule: ScalingRule,
  magic: {
    [key: string]: {
      value: any
    }
  }
}


/**
 * spellLevel = summonNetPower * randomn * currentSpellLevel / maxSpellLevel
 * fixed = summonNetPower
**/
export interface UnitSummonEffect extends Effect {
  unitIds: string[],
  summonType: 'random' | 'all',
  rule: 'spellLevel' | 'fixed',
  summonNetPower: number,
  magic: {
    [key: string]: {
      value: number
    }
  }
}


export interface KingdomResistanceEffect extends Effect {
  rule: 'spellLevel',
  resistance: string,
  magic: {
    [key: string]: {
      value: number
    }
  }
}

export interface ProductionEffect extends Effect {
  rule: 'spellLevel',
  production: 'farms' | 'guilds',
  magic: {
    [key: string]: {
      value: number
    }
  }
}

export interface ArmyUpkeepEffect extends Effect {
  rule: 'spellLevelPercentage',
  filters: UnitFilter[] | null;
  magic: {
    [key: string]: {
      value: {
        geld: any,
        mana: any,
        population: any
      }
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
