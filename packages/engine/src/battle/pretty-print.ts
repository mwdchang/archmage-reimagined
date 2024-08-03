import { BattleReport } from "shared/types/battle";
import { LPretty, RPretty } from "../util";
import { devNull } from "os";

/**
 * For debugging, pretty print BR report for console
**/
export const prettyPrintBR = (br: BattleReport) => {
  console.log('== Battle Report ==');

  const attackerStr = `${br.attacker.name} (#${br.attacker.id})`;
  const defenderStr = `${br.defender.name} (#${br.defender.id})`;

  const mageMap = {
    [br.attacker.id]: attackerStr,
    [br.defender.id]: defenderStr
  }

  console.log('');
  console.log(`=== Attacking army (#${br.attacker.id})===`);
  console.log(
    LPretty('name'),
    RPretty('size'),
    RPretty('Attack'),
    RPretty('Extra'),
    RPretty('Counter'),
    RPretty('Hitpoints'),
    RPretty('Accuracy'),
    LPretty('Abilities'),
  );
  br.attacker.army.forEach(stack => {
    console.log(
      LPretty(stack.unit.name),
      RPretty(stack.size),
      RPretty(stack.unit.primaryAttackPower),
      RPretty(stack.unit.secondaryAttackPower),
      RPretty(stack.unit.counterAttackPower),
      RPretty(stack.unit.hitPoints),
      RPretty(stack.accuracy),
      JSON.stringify((stack.unit.abilities.map(d => d.name)))
    );
  })

  console.log('');
  console.log(`=== Attacking army (#${br.defender.id})===`);
  console.log(
    LPretty('name'),
    RPretty('size'),
    RPretty('Attack'),
    RPretty('Extra'),
    RPretty('Counter'),
    RPretty('Hitpoints'),
    RPretty('Accuracy'),
    LPretty('Abilities'),
  );
  br.defender.army.forEach(stack => {
    console.log(
      LPretty(stack.unit.name),
      RPretty(stack.size),
      RPretty(stack.unit.primaryAttackPower),
      RPretty(stack.unit.secondaryAttackPower),
      RPretty(stack.unit.counterAttackPower),
      RPretty(stack.unit.hitPoints),
      RPretty(stack.accuracy),
      JSON.stringify((stack.unit.abilities.map(d => d.name)))
    );
  })

  console.log('');
  console.log('=== Spells/Items ===');
  console.log(`${attackerStr} casts ${br.attacker.spellId}`);
  console.log(`${attackerStr} uses ${br.attacker.itemId}`);

  console.log(`${defenderStr} casts ${br.defender.spellId}`);
  console.log(`${defenderStr} uses ${br.defender.itemId}`);

  console.log('');
  console.log('=== Battle ===');

  br.battleLogs.forEach(entry => {
    if (entry.type === 'primary' || entry.type === 'secondary') {
      console.log(`${mageMap[entry.attacker.id]}'s ${entry.attacker.unitId} attacks ${mageMap[entry.defender.id]}'s ${entry.defender.unitId}`);
      console.log(`${mageMap[entry.attacker.id]}'s ${entry.attacker.unitId} slew ${mageMap[entry.defender.id]}'s ${entry.defender.unitLoss} ${entry.defender.unitId}`);
    } else if (entry.type === 'additionalStrike') {
      console.log(`${mageMap[entry.attacker.id]}'s ${entry.attacker.unitId} attacks ${mageMap[entry.defender.id]}'s ${entry.defender.unitId} again`);
      console.log(`${mageMap[entry.attacker.id]}'s ${entry.attacker.unitId} slew ${mageMap[entry.defender.id]}'s ${entry.defender.unitLoss} ${entry.defender.unitId}`);
    } else if (entry.type === 'counter') {
      console.log(`${mageMap[entry.defender.id]}'s ${entry.defender.unitId} struck back ${mageMap[entry.attacker.id]}'s ${entry.attacker.unitId}`);
      console.log(`${mageMap[entry.defender.id]}'s ${entry.defender.unitId} slew ${mageMap[entry.attacker.id]}'s ${entry.defender.unitLoss} ${entry.attacker.unitId}`);
    }
    console.log('');
  })

}
