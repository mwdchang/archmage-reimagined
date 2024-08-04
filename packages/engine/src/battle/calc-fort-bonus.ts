import { Mage } from "shared/types/mage";
import { totalLand } from "../base/mage";

/**
 * Calculate fort bonus for unit hit points
**/
export const calcFortBonus = (defenderMage: Mage, attackType: string) => {
  const defenderLand = totalLand(defenderMage);
  const defenderForts = defenderMage.forts;
  const fortsMin = 0.0067;
  const fortsMax = 0.0250;
  const fortsRatio = Math.min((defenderForts / defenderLand), fortsMax);

  let base = attackType === 'regular' ? 10 : 20;
  if (attackType === 'regular' && fortsRatio > fortsMin) {
    const additionalBonus = 27.5 * (fortsRatio - fortsMin) / (fortsMax - fortsMin);
    base += additionalBonus;
  } 

  if (attackType === 'siege' && fortsRatio > fortsMin) {
    const additionalBonus = 55 * (fortsRatio - fortsMin) / (fortsMax - fortsMin);
    base += additionalBonus;
  }
  return base;
}
