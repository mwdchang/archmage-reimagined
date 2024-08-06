import type { BattleReport } from "shared/types/battle";
import type { Combatant } from "shared/types/mage";
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
      }
    },

    // Tracking engagement
    battleLogs: [],

    // Units lost/gained
    postBattleLogs: [],

    // Summary
    summary: {
      attacker: {
        netPower: 0,
        netPowerLoss: 0,
        unitsLoss: 0,
        armyLoss: []
      },
      defender: {
        netPower: 0,
        netPowerLoss: 0,
        unitsLoss: 0,
        armyLoss: []
      }
    },

    landResult: {
      landLoss: {},
      landGain: {}
    }
  };
  return battleReport;
}
