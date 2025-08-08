import type { BattleStack } from "shared/types/battle";
import _ from 'lodash';

/**
 * Resolve conflicting abilities, e.g. a unit can gain flying and lose flying. Any negative
 * cancels out all positive.
 */
export const resolveUnitAbilities = (stack: BattleStack[]) => {
  stack.forEach(stack => {
    const addedAbilities = stack.addedAbilities;
    const removedAbilities = stack.removedAbilities;

    // 1. add first, so negatives can cancel
    for (let i = 0; i < addedAbilities.length; i++) {
      const ability = addedAbilities[i];
      if (!stack.unit.abilities.find(d => d.name === ability.name)) {
        stack.unit.abilities.push(ability);
      }
    }
    
    // 2. then remove if there are conflicts
    for (let i = 0; i < removedAbilities.length; i++) {
      const ability = removedAbilities[i];
      if (stack.unit.abilities.find(d => d.name === ability.name)) {
        stack.unit.abilities = stack.unit.abilities.filter(d => d.name !== ability.name);
      }
    }
  });
}
