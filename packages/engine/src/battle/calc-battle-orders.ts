import _ from 'lodash';
import type { BattleStack } from 'shared/types/battle';

interface BattleOrder {
  side: string,
  position: number,
  attackType: string,
  attackInit: number
}

/**
 * Calculate the order of attacks for both sides.
 * First put both primary and secondary attack inits to a list, then shuffe
 * and re-sort
 */
const NONE = -1;
export const calcBattleOrders = (attackingArmy: BattleStack[], defendingArmy: BattleStack[]) => {
  let battleOrders: BattleOrder[] = [];

  // Helper
  const extractAttacks = (army: BattleStack[], side: string) => {
    for (let i = 0; i < army.length; i++) {
      const u = army[i];
      if (u.targetIdx === NONE) continue;

      if (u.unit.primaryAttackInit > 0) {
        battleOrders.push({
          side,
          position: i,
          attackType: 'primary',
          attackInit: u.unit.primaryAttackInit
        });
      }
      if (u.unit.secondaryAttackInit > 0) {
        battleOrders.push({
          side,
          position: i,
          attackType: 'secondary',
          attackInit: u.unit.secondaryAttackInit
        });
      }
    }
  }
  extractAttacks(attackingArmy, 'attacker');
  extractAttacks(defendingArmy, 'defender');

  battleOrders = _.shuffle(battleOrders);
  battleOrders = _.orderBy(battleOrders, d => -d.attackInit);
  return battleOrders;
}

