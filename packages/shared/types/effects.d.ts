/* Effects improved */
import type { UnitFilter } from './unit.d.ts';
import type { AllowedMagic } from './common.js';
import type { allowedEffect as E } from '../src/common.ts';


export interface Effect<T extends string> {
  effectType: T
}

export interface EffectOrigin {
  id: number,
  magic: string,
  spellLevel: number,
  targetId: number,
  spellId?: string,
}


/**
 * Effect catalogue.
 * Effects form the foundation of all actions in Archmage. They generally fall
 * into these categories.
 *
 *
 * Effect used in battles
 * - PrebattleEffect, BattleEffect
 *   - UnitDamageEffect: Damages pre-engagement
 *   - UnitHealEffect: Unit healing effects
 *   - UnitAttrEffect: Unit attribute changes
 *   - TemporaryUnitEffect: Create temporary units for battle
 *
 *
 * These effect change kingdom attributes
 * - KingdomResistanceEffect
 * - KingdomBuildingsEffect
 * - KingdomArmyEffect
 * - KingdomResourcesEffect
 * - StealEffect
 * - WishEffect
 * - UnitSummonEffect
 *
 * These are passive effects
 * - ArmyUpkeepEffect
 * - ProductionEffect
 * - CastingEffect
 *
**/


/**
 * This effect describes how to create temporary units for a battle. These units participate
 * as any other units, however they do not count in the success/failure calculations and are
 * dismissed after the battle.
**/
export interface TemporaryUnitEffect extends Effect<E.TemporaryUnitEffect>{
  checkResistance: false;
  unitId: string,
  rule: 'spellLevelPercentageBase' | 'fixed', 
  target: 'population' | null,
  magic: {
    [key in AllowedMagic]: {
      value: number
    }
  }
}


/**
 * Prebattle effects takes place before the armies line up. This is used to
 * - Priortize unit attribute changes, eg: set to fix number
 * - Create temporary stacks
**/
export interface PrebattleEffect extends BattleEffect {
  effectype: E.PrebattleEffect
}
export interface BattleEffect extends Effect<E.BattleEffect> {
  target: 'self' | 'opponent' | 'both';
  targetType: 'all' | 'random' | 'weightedRandom'
  filters: UnitFilter[] | null;
  trigger: {
    min: number;
    max: number;
  } | null,
  effects: (UnitAttrEffect | UnitDamageEffect | UnitHealEffect | TemporaryUnitEffect)[]
}

export interface PostbattleEffect extends Effect<E.PostbattleEffect> {
  target: 'self' | 'opponent',
  condition: 'win' | 'all';
  effects: (KingdomResourcesEffect | StealEffect)[]
}



/**
 * add:                          value
 * addPercentageBase:            value * base
 *
 * addSpellLevel:                value * spellLevel
 * addSpellLevelPercentage:      value * spellLevel / maxSpellLevel  
 * addSpellLevelPercentageBase:  value * spellLevel / maxSpellLevel * base
**/
export interface UnitAttrEffect extends Effect<E.UnitAttrEffect> {
  checkResistance: boolean;
  activation?: 'attack' | 'defence';
  attributes: {
    [key: string ]: {
      rule: 'set' | 'add' | 'remove' | 'addPercentageBase' | 'addSpellLevel' | 'addSpellLevelPercentage' | 'addSpellLevelPercentageBase',
      magic: {
        [key in AllowedMagic]: {
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
type DamageValue = number | { min: number, max: number };
export interface UnitDamageEffect extends Effect<E.UnitDamageEffect> {
  checkResistance: boolean;
  damageType: string[],
  rule: 'direct' | 'unitLoss' | 'spellLevel' | 'spellLevelUnitLoss' | 'spellLevelUnitDamage',
  magic: {
    [key in AllowedMagic ]: {
      value: DamageValue
    }
  }
}

export interface UnitHealEffect extends Effect<E.UnitHealEffect> {
  checkResistance: boolean; // not used
  healType: 'points' | 'percentage' | 'units',
  rule: 'none' | 'spellLevel',
  magic: {
    [key in AllowedMagic]: {
      value: any
    }
  }
}


/**
 * spellLevel = summonNetPower * randomn * currentSpellLevel / maxSpellLevel
 * fixed = summonNetPower 
**/
export interface UnitSummonEffect extends Effect<E.UnitSummonEffect> {
  unitIds: string[],
  summonType: 'random' | 'all',
  rule: 'spellLevel' | 'fixed' | 'power',
  summonNetPower: number,
  magic: {
    [key in AllowedMagic]: {
      value: number
    }
  }
}

export interface KingdomResistanceEffect extends Effect<E.KingdomResistanceEffect> {
  rule: 'spellLevel',
  resistance: string,
  magic: {
    [key in AllowedMagic]: {
      value: number
    }
  }
}

export interface KingdomBuildingsEffect extends Effect<E.KingdomBuildingsEffect> {
  rule: 'landPercentageLoss',
  target: string,
  magic: {
    [key in AllowedMagic]: {
      value: { min: number, max: number }
    }
  }
}

export interface KingdomResourcesEffect extends Effect<E.KingdomResourcesEffect> {
  rule: 'add' | 'addSpellLevelPercentage' | 'addSpellLevelPercentageBase',
  target: 'population' | 'mana' | 'geld' | 'item' | 'turn',
  magic: {
    [key in AllowedMagic]: {
      value: { min: number, max: number }
    }
  }
}

export interface KingdomArmyEffect extends Effect<E.KingdomArmyEffect> {
  rule: 'addSpellLevelPercentageBase',
  filters: UnitFilter[] | null,
  checkResistance: boolean;
  magic: {
    [key in AllowedMagic]: {
      value: { min: number, max: number }
    }
  }
}

export interface ProductionEffect extends Effect<E.ProductionEffect> {
  rule: 'spellLevel' | 'addPercentageBase' | 'addSpellLevelPercentageBase',
  production: 'farms' | 'guilds' | 'nodes' | 'geld' | 'population' | 'land' | 'barrack',
  magic: {
    [key in AllowedMagic]: {
      value: number
    }
  }
}

export interface ArmyUpkeepEffect extends Effect<E.ArmyUpkeepEffect> {
  rule: 'addSpellLevelPercentageBase' | 'addPercentageBase',
  filters: UnitFilter[] | null;
  magic: {
    [key in AllowedMagic]: {
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
export interface CastingEffect extends Effect<E.CastingEffect> {
  rule: 'spellLevel',
  type: 'castingSuccess',
  magic: {
    [key in AllowedMagic]: {
      value: number
    }
  }
}

export interface WishEffect extends Effect<E.WishEffect> {
  trigger: {
    min: number;
    max: number;
  } | null,
  rolls: {
    target: 'geld' | 'population' | 'mana' | 'turn' | 'item' | null,
    min: number,
    max: number,
    weight: number
  } []
}


export interface RemoveEnchantmentEffect extends Effect<E.RemoveEnchantmentEffect> {
  trigger: {
    min: number;
    max: number;
  }
}

/**
 * The target loses between [min, max] resources, some some stealPercentage is transferred to the caster
**/
export interface StealEffect extends Effect<E.StealEffect> {
  rule: 'addSpellLevelPercentageBase' | 'addSpellLevelPercentage' | 'addPercentage',
  target: 'mana' | 'geld' | 'item',
  magic: {
    [key in AllowedMagic]?: {
      value: { min: number, max: number, stealPercent: number | null }
    }
  }
}
