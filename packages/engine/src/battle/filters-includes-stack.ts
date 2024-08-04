import _ from 'lodash';
import type { BattleStack } from 'shared/types/battle';

/**
 * Check if a stack matches effect filter criteria
**/
export const filtersIncludesStack = (filters: any, stack: BattleStack) => {
  const filterKeys = Object.keys(filters || {});
  let matched = false;
  const unit = stack.unit;

  for (const key of filterKeys) {
    const matchValues = filters[key];

    if (key === 'abilities') {
      const len = matchValues.filter((val: any) => {
        return unit.abilities.find(d => d.name === val);
      }).length;

      if (len === 0) {
        matched = false;
      }
    } else {
      let subMatched = false;
      const subKeys = key.split(',');
      for (const subKey of subKeys) {
        const len = matchValues.filter((val: any) => {
          const fieldValue = _.get(unit, subKey, []);
          return fieldValue.includes(val);
        }).length;
        if (len > 0) {
          subMatched = true;
        }
        matched = subMatched;
      }
    }
    if (matched === false) break;
  }
  return matched;
}
