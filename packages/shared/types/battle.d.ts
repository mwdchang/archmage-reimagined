import { ArmyUnit } from "./mage.js";
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

  isTemporary: boolean,

  isTarget: boolean,
  targetIdx: number,

  // Battle calcs
  accuracy: number,
  efficiency: number,
  sustainedDamage: number,
  loss: number,

  healingPoints: number,
  healingUnits: number,
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
  summary: any
}

/*
export interface BattleReportSpellItem {
}
*/

export type BattleSpellResult = 'success' | 'lostConcentration' | 'barrier' | 'reflected' | 'noMana' | null;
export type BattleItemResult = 'success' | 'barrier' | 'noItem' | null; 


export interface BattleEffectLog {
  id: number,
  unitId: string,
  effectType: string,
  value: any
}

export interface BattleReport {
  id: string,
  timestamp: number,
  attackType: string,
  isSuccessful: boolean,

  attacker: {
    id: number,
    name: string,
    spellId: string | null,
    itemId: string | null,
    army: BattleStack[]
  }
  defender: {
    id: number,
    name: string,
    spellId: string | null,
    itemId: string | null,
    army: BattleStack[]
  },

  preBattle: {
    attacker: {
      spellResult: BattleSpellResult,
      itemResult: BattleItemResult,
    },
    defender: {
      spellResult: BattleSpellResult,
      itemResult: BattleItemResult,
    },
    logs: BattleEffectLog[]
  },

  battleLogs: {
    type: string,
    attacker: {
      id: number,
      unitId: string,
      unitsLoss: number
    },
    defender: {
      id: number,
      unitId: string,
      unitsLoss: number
    }
  }[],

  postBattleLogs: {
    id: number,
    unitId: string,
    unitsLoss: number,
    unitsHealed: number
  }[],

  summary: {
    isSuccessful: boolean;
    isDefenderDefeated: boolean;
    landGain: number;
    landLoss: number;
    attacker: {
      netPower: number,
      netPowerLoss: number,
      startingUnits: number,
      unitsLoss: number,
      armyLoss: ArmyUnit[]
    },
    defender: {
      netPower: number,
      netPowerLoss: number,
      startingUnits: number,
      unitsLoss: number,
      armyLoss: ArmyUnit[]
    }
  },

  landResult: {
    landLoss: any,
    landGain: any
  }
}
