import type { Effect } from '../src/effects';


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
  effects: Effect[],

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
  effects: Effect[]
}
