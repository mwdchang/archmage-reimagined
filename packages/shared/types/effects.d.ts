/* Effects improved */
import type { UnitFilter } from './unit.d.ts';

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
  effects: (UnitAttrEffect | UnitDamageEffect | UnitHealEffect)[]
}


/**
 * add:                          value
 * addPercentageBase:            value * base
 *
 * addSpellLevel:                value * spellLevel
 * addSpellLevelPercentage:      value * spellLevel / maxSpellLevel  
 * addSpellLevelPercentageBase:  value * spellLevel / maxSpellLevel * base
**/
export interface UnitAttrEffect extends Effect {
  checkResistance: boolean;
  attributes: {
    [key: string]: {
      rule: 'set' | 'add' | 'remove' | 'addPercentageBase' | 'addSpellLevel' | 'addSpellLevelPercentage' | 'addSpellLevelPercentageBase',
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
 * spellLevelUnitLoss: unitloss = spellLevel * value
 * spellLevelUnitDamage: damage = numUnits * spellLevel * value
**/
export interface UnitDamageEffect extends Effect {
  checkResistance: boolean;
  damageType: string[],
  rule: 'direct' | 'spellLevel' | 'spellLevelUnitLoss' | 'spellLevelUnitDamage',
  magic: {
    [key: string]: {
      value: any
    }
  }
}

export interface UnitHealEffect extends Effect {
  checkResistance: boolean; // not used
  healType: 'points' | 'percentage',
  rule: 'none' | 'spellLevel',
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

export interface KingdomBuildingsEffect extends Effect {
  rule: 'landPercentage',
  target: string,
  magic: {
    [key: string]: {
      value: { min: number, max: number }
    }
  }
}

export interface KingdomResourcesEffect extends Effect {
  rule: 'spellLevel',
  target: string,
  magic: {
    [key: string]: {
      value: { min: number, max: number }
    }
  }
}

export interface ProductionEffect extends Effect {
  rule: 'spellLevel' | 'addPercentageBase' 
  production: 'farms' | 'guilds' | 'nodes',
  magic: {
    [key: string]: {
      value: number
    }
  }
}

export interface ArmyUpkeepEffect extends Effect {
  rule: 'addSpellLevelPercentageBase' | 'addPercentageBase',
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
