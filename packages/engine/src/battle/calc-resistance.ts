import type { Unit } from "shared/types/unit";
import { hasAbility } from "../base/unit";

export const calcResistance = (u: Unit, attackTypes: string[]) => {
  let resist = 0;
  for (const at of attackTypes) {
    resist += u.attackResistances[at];
  }
  resist /= attackTypes.length;

  if (hasAbility(u, 'largeShield') && attackTypes.includes('ranged')) {
    resist += 50;
  }

  if (hasAbility(u, 'piercing')) {
    resist -= 10;
  }
  return Math.min(100, resist);
}

