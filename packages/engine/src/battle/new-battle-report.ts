import type { BattleReport, BattleReportSummary } from "shared/types/battle";
import type { Combatant, Mage } from "shared/types/mage";
import { v4 as uuidv4 } from 'uuid';

export const newBattleReport = (attacker: Combatant, defender: Combatant, attackType: string) => {
  const battleReport: BattleReport = {
    id: uuidv4(),
    timestamp: Date.now(),
    attackType: attackType,
    isSuccessful: false,

    attacker: {
      id: attacker.mage.id,
      name: attacker.mage.name,
      spellId: attacker.spellId,
      itemId: attacker.itemId,
      army: []
    },
    defender: {
      id: defender.mage.id,
      name: defender.mage.name,
      spellId: defender.spellId,
      itemId: defender.itemId,
      army: []
    },

    // Tracking spells, heros, ... etc
    preBattle: {
      attacker: {
        spellResult: null,
        itemResult: null,
      },
      defender: {
        spellResult: null,
        itemResult: null,
      },
      logs: []
    },

    // Tracking engagement
    engagement: {
      logs: [],
    },

    // Units lost/gained
    postBattle: {
      unitSummary: [],
      logs: [],
    },

    // Summary
    result: {
      isSuccessful: false,
      isDefenderDefeated: false,
      landGain: 0,
      landLoss: 0,
      attacker: {
        startNetPower: 0,
        endNetPower: 0,
        armyNetPower: 0,
        armyNetPowerLoss: 0,
        startingUnits: 0,
        unitsLoss: 0,
        armyLoss: []
      },
      defender: {
        startNetPower: 0,
        endNetPower: 0,
        armyNetPower: 0,
        armyNetPowerLoss: 0,
        startingUnits: 0,
        unitsLoss: 0,
        armyLoss: []
      },
      spellsDispelled: []
    },

    landResult: {
      landLoss: {},
      landGain: {}
    }
  };
  return battleReport;
}


export const spellOrItemReportSummary = (
  attacker: Mage, 
  defender: Mage, 
  attackType: string,
  damagePercentage: number,
) => {
  const reportId = uuidv4();
  const reportSummary: BattleReportSummary = {
    id: reportId,
    timestamp: Date.now(),
    attackType: attackType,

    attackerId: attacker.id,
    attackerName: attacker.name,
    attackerStartingUnits: 0,
    attackerUnitsLoss: 0,
    attackerPowerLoss: 0,
    attackerPowerLossPercentage: 0,

    defenderId: defender.id,
    defenderName: defender.name,
    defenderStartingUnits: 0,
    defenderUnitsLoss: 0,
    defenderPowerLoss: 0,
    defenderPowerLossPercentage: damagePercentage,

    isSuccessful: true,
    isDefenderDefeated: defender.forts > 0 ? false : true,
    landGain: 0,
    landLoss: 0,

    spellsDispelled: []
  };

  return reportSummary
}
