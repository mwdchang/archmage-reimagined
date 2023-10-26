import type { Unit, UnitAbility } from "./unit.d.ts";

export enum StackType {
  NORMAL,
  REINFORCEMENT,
  TEMPORARY
}

export interface BattleStack {
  unit: Unit,
  size: number,

  stackType: StackType,
  role: string,

  isTarget: boolean,
  targetIdx: number,

  // Battle calcs
  accuracy: number,
  efficiency: number,
  sustainedDamage: number,
  loss: number,

  healingPoints: number,
  healingBuffer: number[],

  // Temporary buffer to sort out conflicting effects from items/spells
  addedAbilities: UnitAbility[],
  removedAbilities: UnitAbility[],

  // For faster calculation
  netPower: number,
}

export interface BattleReportSummary {
  id: string,
  timestamp: number,
  attackType: string
  attackerId: number,
  defenderId: number,
  summaryLogs: any[]
}

export interface BattleReport {
  id: string,
  timestamp: number,
  attackType: string,
  attacker: {
    id: number,
    spellId: string | null,
    itemId: string | null,
    army: BattleStack[],
    armyLosses: { id: string, size: number }[],

    startingNetPower: number,
    lossNetPower: number
  }
  defender: {
    id: number,
    spellId: string | null,
    itemId: string | null,
    army: BattleStack[]
    armyLosses: { id: string, size: number }[],

    startingNetPower: number,
    lossNetPower: number
  },

  preBattleLogs: any[],
  battleLogs: any[],
  postBattleLogs: any[],
  summaryLogs: any[]
}
