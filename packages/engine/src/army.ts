import _ from 'lodash';
import { Unit } from 'shared/types/unit';
import { ArmyUnit } from 'shared/types/mage';

export const unitMap = new Map<string, Unit>();

export const loadUnitData = (units: Unit[]) => {
  for (let i = 0; i < units.length; i++) {
    unitMap.set(units[i].id, units[i]);
    console.log(`Unit[${units[i].magic}] ${units[i].name} loaded`);
  }
}

export const getUnitById = (id: string): Unit => {
  const unit = unitMap.get(id);
  if (!unit) throw new Error(`Cannot find unit ${id}`);
  return _.cloneDeep(unit);
}

export const hasAbility = (u:Unit, abilityStr: string) => {
  return u.abilities.map(d => d.name).includes(abilityStr);
}

export const isFlying = (u: Unit) => {
  return u.abilities.map(d => d.name).includes('flying');
}

export const isRanged = (u: Unit) => {
  return u.primaryAttackType.includes('ranged');
}

// Create a stack by number of units
export const createStackByNumber = (id: string, num: number): ArmyUnit => {
  const unit = unitMap.get(id);
  if (!unit) throw new Error(`Cannot find unit ${id}`);
  return { id: unit.id, size: num };
}

// Create a stack by power
export const createStackByPower = (id: string, power: number) => {
  const unit = unitMap.get(id);
  if (!unit) throw new Error(`Cannot find unit ${id}`);
  const num = Math.floor(power / unit.powerRank);
  return { id: unit.id, size: num };
}
