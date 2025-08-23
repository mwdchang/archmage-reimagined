import type { BattleStack } from "shared/types/battle";

/**
 * Sum up unit NP losses
**/
export const calcBattleSummary = (attackingArmy: BattleStack[], defendingArmy: BattleStack[]) => {
  let attackerStartingNP = 0;
  let defenderStartingNP = 0;
  attackingArmy.forEach(stack => attackerStartingNP += stack.netPower);
  defendingArmy.forEach(stack => defenderStartingNP += stack.netPower);

  let attackerPowerLoss = 0;
  let attackerUnitLoss = 0;
  attackingArmy.forEach(stack => {
    if (stack.isTemporary) return;
    const np = stack.unit.powerRank * stack.loss;
    attackerPowerLoss += np;
    attackerUnitLoss += stack.loss;
    // console.log('\t', stack.unit.name, stack.loss, `(net power = ${np})`);
  });

  let defenderPowerLoss = 0;
  let defenderUnitLoss = 0;
  defendingArmy.forEach(stack => {
    if (stack.isTemporary) return;
    const np = stack.unit.powerRank * stack.loss;
    defenderPowerLoss += np;
    defenderUnitLoss += stack.loss;
    // console.log('\t', stack.unit.name, stack.loss, `(net power = ${np})`);
  });


  return {
    attacker: {
      netPower: attackerStartingNP,
      netPowerLoss: attackerPowerLoss,
      unitsLoss: attackerUnitLoss,
      armyLoss: attackingArmy.map(d => ({id: d.unit.id, size: d.loss}))
    },
    defender: {
      netPower: defenderStartingNP,
      netPowerLoss: defenderPowerLoss,
      unitsLoss: defenderUnitLoss,
      armyLoss: defendingArmy.map(d => ({id: d.unit.id, size: d.loss}))
    }
  }
}
