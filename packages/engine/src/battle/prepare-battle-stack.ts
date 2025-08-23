import type { ArmyUnit } from "shared/types/mage";
import type { BattleStack } from "shared/types/battle";
import type { Unit } from "shared/types/unit";
import { getUnitById } from "../base/references";
import { isFlying, isRanged } from "../base/unit";

const NONE = -1;

enum StackType {
  NORMAL,
  REINFORCEMENT,
  TEMPORARY
}

// Returns power modifiers
// - flyer
// - ranged
// - everything else
export const getPowerModifier = (u: Unit) => {
  if (isFlying(u)) return  1.5 * 1.5;
  if (isRanged(u)) return 1.0;
  return 1.5;
};


/**
 * Returns the stacks in power ranking order
 *
 * As determined by primary attack type and unit abilities
 * - flying units have a 2.25 multiplier
 * - ground, none-ranged units have 1.5 multiplier
 * - ranged has 1.0 multipiler
**/
export const prepareBattleStack = (army: ArmyUnit[], role: string) => {
  const battleStack: BattleStack[] = army.map(stack => {
    const u = getUnitById(stack.id);
    return {
      unit: u,
      size: stack.size,
      stackType: StackType.NORMAL,
      role,
      isTarget: false,
      targetIdx: NONE,
      accuracy: 30,
      efficiency: 100,
      sustainedDamage: 0,

      healingUnits: 0,
      healingPoints: 0,
      healingBuffer: [],

      addedAbilities: [],
      removedAbilities: [],

      loss: 0,
      netPower: u.powerRank * stack.size,

      isTemporary: false
    }
  });

  // Initially sort by power
  return battleStack.sort((a, b) => {
    return b.netPower * getPowerModifier(b.unit) - a.netPower * getPowerModifier(a.unit);
  });
}
