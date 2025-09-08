import type { BattleReport } from "shared/types/battle";
import { LPretty, RPretty } from "../util";

/**
 * For debugging, pretty print BR report for console
**/
export const prettyPrintBR = (br: BattleReport) => {
  console.log('');
  console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
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
      RPretty(stack.accuracy.toFixed(2)),
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
      RPretty(stack.accuracy.toFixed(2)),
      JSON.stringify((stack.unit.abilities.map(d => d.name)))
    );
  })

  console.log('');
  console.log('=== Engage ===');
  console.log(`${attackerStr} casts ${br.attacker.spellId}`);
  if (br.preBattle.attacker.spellResult == 'noMana') {
    console.log('Not enough mana to cast spell');
  }
  if (br.preBattle.attacker.spellResult == 'barriers') {
    console.log('The spell hit the barriers and fizzled');
  }
  console.log(`${attackerStr} uses ${br.attacker.itemId}`);
  if (br.preBattle.attacker.itemResult == 'barriers') {
    console.log('The item hit the barriers and fizzled');
  }

  console.log(`${defenderStr} casts ${br.defender.spellId}`);
  if (br.preBattle.defender.spellResult == 'noMana') {
    console.log('Not enough mana to cast spell');
  }
  console.log(`${defenderStr} uses ${br.defender.itemId}`);

  console.log('');
  for (const log of br.preBattle.logs) {
    console.log(`#${log.id}'s ${log.value} ${log.unitId} are slain`);
  }
  console.log('');
  console.log('=== Assault note ===');

  br.engagement.logs.forEach(entry => {
    const aId = entry.attacker.id;
    const dId = entry.defender.id;

    if (entry.type === 'primary' || entry.type === 'secondary') {
      console.log(`${mageMap[aId]}'s ${entry.attacker.unitId} attacks ${mageMap[dId]}'s ${entry.defender.unitId}`);
      console.log(`${mageMap[aId]}'s ${entry.attacker.unitId} slew ${mageMap[dId]}'s ${entry.defender.unitsLoss} ${entry.defender.unitId}`);
      if (entry.attacker.unitsLoss < 0) {
        console.log(`${mageMap[aId]}'s created ${Math.abs(entry.attacker.unitsLoss)} ${entry.attacker.unitId}`);
      }
    } else if (entry.type === 'additionalStrike') {
      console.log(`${mageMap[aId]}'s ${entry.attacker.unitId} attacks ${mageMap[dId]}'s ${entry.defender.unitId} again`);
      console.log(`${mageMap[aId]}'s ${entry.attacker.unitId} slew ${mageMap[dId]}'s ${entry.defender.unitsLoss} ${entry.defender.unitId}`);
      if (entry.attacker.unitsLoss < 0) {
        console.log(`${mageMap[aId]}'s created ${Math.abs(entry.attacker.unitsLoss)} ${entry.attacker.unitId}`);
      }
    } else if (entry.type === 'counter') {
      console.log(`${mageMap[dId]}'s ${entry.defender.unitId} struck back ${mageMap[aId]}'s ${entry.attacker.unitId}`);
      console.log(`${mageMap[dId]}'s ${entry.defender.unitId} slew ${mageMap[aId]}'s ${entry.attacker.unitsLoss} ${entry.attacker.unitId}`);
      if (entry.defender.unitsLoss < 0) {
        console.log(`${mageMap[dId]}'s created ${Math.abs(entry.defender.unitsLoss)} ${entry.defender.unitId}`);
      }
    } else if (entry.type.startsWith('burst')) {
      console.log(`burst from ${mageMap[dId]}'s ${entry.defender.unitId} slew ${mageMap[aId]}'s ${entry.attacker.unitsLoss} ${entry.attacker.unitId}`);
      console.log(`burst from ${mageMap[dId]}'s ${entry.defender.unitId} slew ${mageMap[dId]}'s ${entry.defender.unitsLoss} ${entry.defender.unitId}`);
    }
    console.log('');
  })

  console.log('=== Assault result ===');
  br.postBattle.unitSummary.forEach(entry => {
    console.log(`${mageMap[entry.id]}'s ${entry.unitsLoss} ${entry.unitId} where slain during battle`);
    console.log(`${mageMap[entry.id]}'s ${entry.unitsHealed} ${entry.unitId} are resurrected from death`);
    console.log(``);
  })
  console.log('');

  console.log('=== Post battle logs ===');
  br.postBattle.logs.forEach(entry => {
    console.log(entry);
  });

  console.log('=== Power loss ===');
  console.log(br.result);

  console.log('=== Battle result ===');
  console.log(`Success = ${br.isSuccessful}`);

  console.log('=== Land loss/gain ===');
  console.log(br.landResult);
}
