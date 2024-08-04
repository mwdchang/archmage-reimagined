import { BattleStack } from "shared/types/battle";
import { hasHealing, hasRegeneration } from "../base/unit";

export const calcHealing = (stack: BattleStack) => {
  if (stack.size <= 0) return 0;

  let totalUnitsHealed = 0;

  // Healing points
  if (stack.healingPoints > 0 && stack.loss > 0) {
    let unitsHealed = Math.floor(stack.healingPoints / stack.unit.hitPoints);
    if (unitsHealed >= stack.loss) {
      unitsHealed = stack.loss;
    }
    totalUnitsHealed += unitsHealed;
  }

  // Percentage based healing
  if (hasHealing(stack.unit)) {
    stack.healingBuffer.push(30);
  }
  if (hasRegeneration(stack.unit)) {
    stack.healingBuffer.push(20);
  }
  if (stack.healingBuffer.length > 0 && stack.loss > 0) {
    let heal = 1.0;
    stack.healingBuffer.forEach(hValue => {
      heal = heal * (100 - hValue) / 100;
    });
    heal = 1 - heal;

    let unitsHealed = Math.floor(heal * stack.loss);
    // if (unitsHealed >= stack.loss) {
    //   unitsHealed = stack.loss;
    // }
    // stack.loss -= unitsHealed;
    // stack.size += unitsHealed;
    totalUnitsHealed += unitsHealed;
    // console.log(`healing ${stack.unit.name} = ${unitsHealed}`);
  }
  return totalUnitsHealed;
}
