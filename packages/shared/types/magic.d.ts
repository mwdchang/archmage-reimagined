import type { Effect } from './effects.d.ts';


export interface Spell {
  id: string,
  name: string,
  description: string,
  magic: string,
  rank: string,
  attributes: string[],
  researchCost: number,
  castingCost: number,
  castingTurn: number,
  life?: number,
  upkeep: {
    geld: number,
    mana: number,
    population: number
  } | null,
  effects: Effect<any>[],

  // For dev purpose
  disabled?: boolean
}

export interface Item {
  id: string,
  name: string,
  description: string,
  attributes: string[],
  weight: number,
  chargeTurns: number, // not used
  upkeep: {
    geld: number,
    mana: number,
    population: number
  } | null,
  effects: Effect<any>[]
}
