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
  effects: Effect[]
}

export interface Item {
  id: string,
  name: string,
  description: string,
  attributes: string[],
  chargeTurns: number,
  upkeep: {
    geld: number,
    mana: number,
    population: number
  } | null,
  effects: Effect[]
}
