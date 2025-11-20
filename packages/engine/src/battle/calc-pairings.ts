import type { Unit } from "shared/types/unit";
import type { BattleStack } from 'shared/types/battle';
import { isFlying, isRanged } from "../base/unit";

const DEBUG = true;
const log = (...args: any) => {
  if (DEBUG === true) {
    console.log.apply(console, args);
  }
};

// Check if a can attack b
const canAttackPrimary = (a: Unit, b: Unit) => {
  if (isRanged(a) || isFlying(a)) return true;
  if (isFlying(b)) return false;
  return true;
}
const canAttackSecondary = (a: Unit, b: Unit) => {
  const isSecondaryRanged = a.secondaryAttackType.includes('ranged');
  if (isSecondaryRanged || isFlying(a)) return true;
  if (isFlying(b)) return false;
  return true;
}

export const calcPairings = (a: BattleStack[], b: BattleStack[]) => {
  log('');
  log('=== Calculate parings ===');

  // 1. Fnd viable targets with similar net power
  a.forEach((aStack, aIdx) => {
    log(`calculating by power`, aStack.unit.name);
    b.forEach((bStack, bIdx) => {
      if (aStack.targetIdx > -1 ) return;

      log('\tchecking target', bStack.unit.name);
      const ratio = bStack.netPower / aStack.netPower;
      if (( ratio > 0.02 && ratio <= 4.0) || aIdx === 0) {
        const canAttack = canAttackPrimary(aStack.unit, bStack.unit);
        log('\tCan attack', canAttack);
        if (canAttack && bStack.isTarget === false) {
          log('\tsetting to', bIdx);
          aStack.targetIdx = bIdx;
          bStack.isTarget = true;
        }
      }
    });
  });

  // 2. Match remaining units
  a.forEach((aStack, _aIdx) => {
    if (aStack.targetIdx > -1) return;
    log(`calculating by availability`, aStack.unit.name);
    b.forEach((bStack, bIdx) => {
      if (aStack.targetIdx > -1 ) return;
      log('\tchecking target', bStack.unit.name);
      const canAttack = canAttackPrimary(aStack.unit, bStack.unit);
      log('\tCan attack', canAttack);
      if (canAttack) {
        log('\tsetting to', bIdx);
        aStack.targetIdx = bIdx;
        bStack.isTarget = true;
      }
    });
  });

  // 3. Match possible targets for secondary-only attacks
  a.forEach((aStack, _aIdx) => {
    if (aStack.targetIdx > -1) return;
    log(`calculating by availability`, aStack.unit.name);
    b.forEach((bStack, bIdx) => {
      if (aStack.targetIdx > -1 ) return;
      log('\tchecking target', bStack.unit.name);
      const canAttack = canAttackSecondary(aStack.unit, bStack.unit);
      log('\tCan attack', canAttack);
      if (canAttack) {
        log('\tsetting to', bIdx);
        aStack.targetIdx = bIdx;
        bStack.isTarget = true;
      }
    });
  });
}

