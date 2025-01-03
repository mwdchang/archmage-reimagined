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
 * BattleEffect are effects that are triggered before the battle takes place, it can augment/debuff
 * units attributes, cause direct damages, or alter unit abilities.
 *
 *   UnitAttrEffect
 *   UnitDamageEffect
 *   UnitHealEffect
**/
export interface BattleEffect extends Effect {
  target: 'self' | 'opponent' | 'all';
  targetStack: 'all' | 'random' | 'weighted' | 'randomSingle' /* fixme */;
  filter?: UnitFilter;
  effectsTrigger?: {
    max: number;
    min: number;
    triggerType: 'all' | 'random'
  },
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

export interface UnitDamageEffect extends Effect {
  checkResistance: boolean;
  damageType: string[],
  rule: ScalingRule,
  minTimes: number,
  maxTimes: number,
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
