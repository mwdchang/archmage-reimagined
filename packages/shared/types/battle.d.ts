import { ArmyUnit } from "./mage.js";
import type { Unit, UnitAbility } from "./unit.d.ts";
import { StackType } from "../src/common.ts";

/*
export enum StackType {
  NORMAL,
  REINFORCEMENT,
  TEMPORARY
}
*/

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


  // Tracks what effect have been applied onto the stack
  appliedEffects: {
    origin: string; // For tracking only
    id: string;
    type: 'item' | 'spell'; // FIXME : not used???
  }[]
}

export interface BattleReportSummary {
  id: string,
  timestamp: number,
  attackType: string

  attackerId: number,
  attackerName: string,
  attackerPowerLoss: number,
  attackerPowerLossPercentage: number,
  attackerStartingUnits: number,
  attackerUnitsLoss: number,

  defenderId: number,
  defenderName: string,
  defenderPowerLoss: number,
  defenderPowerLossPercentage: number,
  defenderStartingUnits: number,
  defenderUnitsLoss: number,

  isSuccessful: boolean;
  isDefenderDefeated: boolean;
  landGain: number;
  landLoss: number;
  spellsDispelled: string[];
}



export type BattleSpellResult = 'success' | 'lostConcentration' | 'barriers' | 'reflected' | 'noMana' | 'notUsed' | 'missed' | null;
export type BattleItemResult = 'success' | 'barriers' | 'noItem' | 'notUsed' | 'missed' | null; 

export interface BattleEffectLog {
  id: number,
  unitId: string,
  effectType: string,
  value: any
}

export interface EngagementLog {
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

  engagement: {
    logs: EngagementLog[]
  },

  postBattle: {
    unitSummary: {
      id: number,
      unitId: string,
      unitsLoss: number,
      unitsHealed: number
    }[],

    logs: any[]
  },

  result: {
    isSuccessful: boolean;
    isDefenderDefeated: boolean;
    landGain: number;
    landLoss: number;
    attacker: {
      startNetPower: number,
      endNetPower: number,
      armyNetPower: number,
      armyNetPowerLoss: number,
      startingUnits: number,
      unitsLoss: number,
      armyLoss: ArmyUnit[]
    },
    defender: {
      startNetPower: number,
      endNetPower: number,
      armyNetPower: number,
      armyNetPowerLoss: number,
      startingUnits: number,
      unitsLoss: number,
      armyLoss: ArmyUnit[]
    },
    spellsDispelled: string[]
  },

  landResult: {
    landLoss: any,
    landGain: any
  }
}
