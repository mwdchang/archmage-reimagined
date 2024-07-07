import { Unit } from "shared/types/unit";
import { hasAbility } from "../base/unit";

export const calcDamageMultiplier = (attackingUnit: Unit, defendingUnit: Unit, attackType: string[]) => {
  let multiplier = 1.0;

  // TODO: racial enemy

  // Check weaknesses
  defendingUnit.abilities.forEach(ability => {
    if (ability.name === 'weakness') {
      const weakType = ability.extra as string;
      if (attackType.includes(weakType)) {
        multiplier *= 2.0;
      }
    }
  });

  if (hasAbility(defendingUnit, 'scales')) {
    multiplier *= 0.75;
  }
  return multiplier;
}

