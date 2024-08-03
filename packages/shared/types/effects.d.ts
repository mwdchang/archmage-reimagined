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
  effectType: string
}

type EffectTarget = 'self' | 'opponent';
type AffectedStack = 'all' | 'random' | 'randomSingle';
export interface BattleEffect extends Effect {
  affectedStack: AffectedStack,
  target: EffectTarget,
  filters: any,
  effects: (UnitAttrEffect | UnitDamageEffect | UnitHealEffect)[],
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


////////////////////////////////////////////////////////////////////////////////
// Sub effects
////////////////////////////////////////////////////////////////////////////////

export interface UnitEffect extends Effect {
  checkResistance: boolean,
}

export interface UnitAttrEffect extends UnitEffect {
  attributeMap: {
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

export interface UnitDamageEffect extends UnitEffect { 
  damageType: string[],
  rule: string,
  minTimes: number,
  maxTimes: number,
  magic: {
    [key: string]: {
      value: any
    }
  }
}

export interface UnitHealEffect extends UnitEffect {
  healType: string,
  rule: string,
  magic: {
    [key: string]: {
      value: any
    }
  }
}
