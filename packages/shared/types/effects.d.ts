export interface Effect {
  // Expect the effectType to be one of the sub interfaces
  effectType: string
}

export interface KingdomResistanceEffect extends Effect {
  rule: string,
  resistance: string,
  magic: {
    [key: string]: {
      value: number
    }
  }
}

export interface KingdomProductioneffect extends Effect {
  rule: string,
  production: string,
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
  target: string,         // self, opponent
  fiilter: {
    [key: string]: any 
  },
  stack: string,       // random, randomSingle, all
  effects: (UnitEffect | DamageEffect | HealEffect)[]
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
export interface UnitEffect {
  name: string,
  attributeMap: {
    [key: string]: {
      rule: string,
      has: any,
      magic: {
        [key: string]: {
          value: any
        }
      }
    }
  }
}

export interface DamageEffect { 
  name: string,
  damageType: string[],
  rule: string,
  magic: {
    [key: string]: {
      value: any
    }
  }
}

export interface HealEffect {
  name: string,
  healType: string,
  rule: string,
  magic: {
    [key: string]: {
      value: any
    }
  }
}
