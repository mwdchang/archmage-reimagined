export interface Effect {
  // Expect the effectType to be one of the sub interfaces
  effectType: string
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
  effects: (UnitEffect | DamageEffect)[]
}

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

export interface BattleHealingEffect extends Effect {
}
