export interface SpellResistances {
  ascendant: number,
  verdant: number,
  eradication: number,
  nether: number,
  phantasm: number
}

export interface AttackResistances {
  missile: number,
  fire: number,
  poison: number,
  breath: number,
  magic: number,
  melee: number,
  ranged: number,
  lightning: number,
  cold: number,
  paralyse: number,
  psychic: number,
  holy: number
}

export interface UnitCost {
  geld: number,
  mana: number,
  population: number
}

export interface UnitAbility {
  name: string,
  extra?: any
}

export interface Unit {
  id: string,
  name: string,
  description?: string,
  magic: string,
  powerRank: number,
  race: string[],
  attributes: string[],

  // Attacks
  primaryAttackPower: number,
  primaryAttackType: string[],
  primaryAttackInit: number,

  secondaryAttackPower: number,
  secondaryAttackType: string[],
  secondaryAttackInit: number,

  counterAttackPower: number,

  hitPoints: number,
  recruitCost: UnitCost,
  upkeepCost: UnitCost,

  abilities: UnitAbility[],

  spellResistances: SpellResistances,
  attackResistances: AttackResistances
}
