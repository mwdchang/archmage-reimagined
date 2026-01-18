import type { Unit } from "shared/types/unit";
import { hasAbility } from "../base/unit";


function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}


export const applyAccuracyBuff = (currentAccuracy: number, buff: number) => {
  const POWER = 0.45;
  const BASE = 30;
  const MIN = 0.1;
  const MAX = 100;

  let result = currentAccuracy;

  if (buff < 0) {
    // ----- DEBUFF -----
    let debuff = -buff;
    if (debuff > 0 && result > MIN) {
      const t = (result - MIN) / (BASE - MIN);
      const scale = Math.pow(clamp01(t), POWER);
      result -= debuff * scale;
    }
  } else if (buff > 0) {
    // ----- BUFF -----
    let boost = buff;
    if (boost > 0 && result < MAX) {
      const t = (MAX - result) / (MAX - BASE);
      const scale = Math.pow(clamp01(t), POWER);
      result += boost * scale;
    }
  }
  // Final hard clamp
  result = Math.max(MIN, Math.min(MAX, result));
  return result;
}



export const calcAttackAccuracy = (
  attackType: 'primary' | 'secondary' | 'counter',
  accuracy: number, 
  attackingUnit: Unit, 
  defendingUnit: Unit
) => {
  let acc = accuracy;
  if (hasAbility(attackingUnit, 'clumsiness')) {
    acc = applyAccuracyBuff(acc, -10);
  }
  if (hasAbility(defendingUnit, 'swift')) {
    acc = applyAccuracyBuff(acc, -10);
  }
  if (hasAbility(defendingUnit, 'beauty')) {
    acc = applyAccuracyBuff(acc, -5);
  }
  if (hasAbility(defendingUnit, 'fear') && !hasAbility(attackingUnit, 'fear') && attackType !== 'secondary') {
    acc = applyAccuracyBuff(acc, -15);
  }
  if (hasAbility(attackingUnit, 'marksmanship')) {
    acc = applyAccuracyBuff(acc, 10);
  }
  return acc;
}

