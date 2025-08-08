import _ from 'lodash';
import type { UnitFilter } from "shared/types/unit";
import type { BattleStack } from 'shared/types/battle';
import { matchesFilter } from '../base/unit';

export const calcFilteredArmy = (army: BattleStack[], filters: UnitFilter[] | null) => {
  if (filters === null) return army;

  return army.filter(battleStack => {
    const unit = battleStack.unit;
    for (const filter of filters) {
      if (matchesFilter(unit, filter) === true) {
        return true;
      }
    }
    return false;
  });
}
