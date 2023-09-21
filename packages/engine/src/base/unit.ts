import _ from 'lodash';
import { Unit } from 'shared/types/unit';
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
