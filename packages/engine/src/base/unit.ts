import _ from 'lodash';
import type { Unit, UnitFilter } from 'shared/types/unit';
import { ArmyUnit } from 'shared/types/mage';
import { getUnitById } from './references';

export const hasAbility = (u:Unit, abilityStr: string) => {
  return u.abilities.map(d => d.name).includes(abilityStr);
}

export const hasHealing = (u: Unit) => {
  return u.abilities.map(d => d.name).includes('healing');
}

export const hasRegeneration = (u: Unit) => {
  return u.abilities.map(d => d.name).includes('regeneration');
}

export const isFlying = (u: Unit) => {
  return u.abilities.map(d => d.name).includes('flying');
}

export const isRanged = (u: Unit) => {
  return u.primaryAttackType.includes('ranged');
}

export const npMultiplier = (u: Unit) => {
  if (isFlying(u)) return 2.25;
  if (!isRanged(u)) return 1.5;
  return 1.0;
}

// Create a stack by number of units
export const createStackByNumber = (id: string, num: number): ArmyUnit => {
  const unit = getUnitById(id);
  return { id: unit.id, size: num };
}

// Create a stack by power
export const createStackByPower = (id: string, power: number) => {
  const unit = getUnitById(id);
  const num = Math.floor(power / unit.powerRank);
  return { id: unit.id, size: num };
}


// Check if unit matches filter
export const matchesFilterByUnitId = (id: string, filter: UnitFilter) => {
  const unit = getUnitById(id);
  return matchesFilter(unit, filter);
}
export const matchesFilter = (unit: Unit, filter: UnitFilter) => {
  if (!filter) return true;

  if (filter.magic) {
    if (!filter.magic.includes(unit.magic)) {
      return false;
    }
  }

  if (filter.race) {
    if (_.intersection(filter.race, unit.race).length === 0) {
      return false;
    }
  }

  if (filter.allAttackType) {
    const primary = _.intersection(filter.allAttackType, unit.primaryAttackType);
    const secondary = _.intersection(filter.allAttackType, unit.secondaryAttackType);

    if (primary.length === 0 && secondary.length === 0) {
      return false;
    }
  }

  if (filter.primaryAttackPower) {
    if (filter.primaryAttackPower.op === 'gte') {
      if (unit.primaryAttackPower < filter.primaryAttackPower.value) return false;
    } 
    if (filter.primaryAttackPower.op === 'lte') {
      if (unit.primaryAttackPower > filter.primaryAttackPower.value) return false;
    }
  }
  if (filter.primaryAttackType) {
    if (_.intersection(filter.primaryAttackType, unit.primaryAttackType).length === 0) {
      return false;
    }
  }
  if (filter.primaryAttackInit) {
    if (filter.primaryAttackInit.op === 'gte') {
      if (unit.primaryAttackInit < filter.primaryAttackInit.value) return false;
    } 
    if (filter.primaryAttackInit.op === 'lte') {
      if (unit.primaryAttackInit > filter.primaryAttackInit.value) return false;
    }
  }

  if (filter.secondaryAttackPower) {
    if (filter.secondaryAttackPower.op === 'gte') {
      if (unit.secondaryAttackPower < filter.secondaryAttackPower.value) return false;
    } 
    if (filter.secondaryAttackPower.op === 'lte') {
      if (unit.secondaryAttackPower > filter.secondaryAttackPower.value) return false;
    }
  }
  if (filter.secondaryAttackType) {
    if (_.intersection(filter.secondaryAttackType, unit.secondaryAttackType).length === 0) {
      return false;
    }
  }
  if (filter.secondaryAttackInit) {
    if (filter.secondaryAttackInit.op === 'gte') {
      if (unit.secondaryAttackInit < filter.secondaryAttackInit.value) return false;
    } 
    if (filter.secondaryAttackInit.op === 'lte') {
      if (unit.secondaryAttackInit > filter.secondaryAttackInit.value) return false;
    }
  }

  if (filter.counterAttackPower) {
    if (filter.counterAttackPower.op === 'gte') {
      if (unit.counterAttackPower < filter.counterAttackPower.value) return false;
    } 
    if (filter.counterAttackPower.op === 'lte') {
      if (unit.counterAttackPower > filter.counterAttackPower.value) return false;
    }
  }

  if (filter.abilities) {
    if (_.intersection(filter.abilities, unit.abilities.map(d => d.name)).length === 0) {
      return false;
    }
  }

  return true;
}
