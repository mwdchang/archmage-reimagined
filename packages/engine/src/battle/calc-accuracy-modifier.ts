import type { Unit } from "shared/types/unit";
import { hasAbility } from "../base/unit";

export const calcAccuracyModifier = (attackingUnit: Unit, defendingUnit: Unit) => {
  let modifier = 0;
  if (hasAbility(attackingUnit, 'clumsiness')) {
    modifier -= 10;
  }
  if (hasAbility(defendingUnit, 'swift')) {
    modifier -= 10;
  }
  if (hasAbility(defendingUnit, 'beauty')) {
    modifier -= 5;
  }
  if (hasAbility(defendingUnit, 'fear') && !hasAbility(attackingUnit, 'fear')) {
    modifier -= 15;
  }
  if (hasAbility(attackingUnit, 'marksmanship')) {
    modifier += 10;
  }
  return modifier;
}

