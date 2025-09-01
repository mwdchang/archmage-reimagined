/* Effects improved */
import type { UnitFilter } from './unit.d.ts';

type AllowedMagic = 
  'ascendant' |
  'verdant' |
  'eradication' |
  'nether' | 
  'phantasm';

export interface Effect {
  effectType: string
}

export interface EffectOrigin {
  id: number,
  magic: string,
  spellLevel: number,
  targetId: number,
  spellId?: string,
}

/**
 * BattleEffect are effects that are triggered before the battle takes place, it can augment/debuff
 * units attributes, cause direct damages, or alter unit abilities.
 *
 *   UnitAttrEffect
 *   UnitDamageEffect
 *   UnitHealEffect
**/


export interface TemporaryUnitEffect extends Effect {
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
export interface PrebattleEffect extends BattleEffect{}
export interface BattleEffect extends Effect {
  target: 'self' | 'opponent' | 'both';
  targetType: 'all' | 'random' | 'weightedRandom'
  filters: UnitFilter[] | null;
  trigger: {
    min: number;
    max: number;
  } | null,
  effects: (UnitAttrEffect | UnitDamageEffect | UnitHealEffect | TemporaryUnitEffect)[]
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
    [key in AllowedMagic]: {
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
type DamageValue = number | { min: number, max: number };
export interface UnitDamageEffect extends Effect {
  checkResistance: boolean;
  damageType: string[],
  rule: 'direct' | 'spellLevel' | 'spellLevelUnitLoss' | 'spellLevelUnitDamage',
  magic: {
    [key in AllowedMagic ]: {
      value: DamageValue
    }
  }
}

export interface UnitHealEffect extends Effect {
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
export interface UnitSummonEffect extends Effect {
  unitIds: string[],
  summonType: 'random' | 'all',
  rule: 'spellLevel' | 'fixed',
  summonNetPower: number,
  magic: {
    [key in AllowedMagic]: {
      value: number
    }
  }
}

export interface KingdomResistanceEffect extends Effect {
  rule: 'spellLevel',
  resistance: string,
  magic: {
    [key in AllowedMagic]: {
      value: number
    }
  }
}

export interface KingdomBuildingsEffect extends Effect {
  rule: 'landPercentageLoss',
  target: string,
  magic: {
    [key in AllowedMagic]: {
      value: { min: number, max: number }
    }
  }
}

export interface KingdomResourcesEffect extends Effect {
  rule: 'addSpellLevelPercentage' | 'addSpellLevelPercentageBase',
  target: 'population' | 'mana' | 'geld' | 'item',
  magic: {
    [key in AllowedMagic]: {
      value: { min: number, max: number }
    }
  }
}

export interface KingdomArmyEffect extends Effect {
  rule: 'addSpellLevelPercentageBase',
  filters: UnitFilter[] | null,
  checkResistance: boolean;
  magic: {
    [key in AllowedMagic]: {
      value: { min: number, max: number }
    }
  }
}

export interface ProductionEffect extends Effect {
  rule: 'spellLevel' | 'addPercentageBase' | 'addSpellLevelPercentageBase',
  production: 'farms' | 'guilds' | 'nodes' | 'geld' | 'population' | 'land',
  magic: {
    [key in AllowedMagic]: {
      value: number
    }
  }
}

export interface ArmyUpkeepEffect extends Effect {
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
export interface CastingEffect extends Effect {
  rule: string,
  type: string,
  magic: {
    [key in AllowedMagic]: {
      value: number
    }
  }
}


export interface WishEffect extends Effect {
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
