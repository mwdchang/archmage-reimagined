import { BattleEffect } from "shared/types/effects";
import { Spell } from "shared/types/magic";
import { Unit } from "shared/types/unit";

const attackTypes = new Set([
  'missile', 'fire', 'poison', 
  'breath', 'magic', 'melee', 
  'ranged', 'lightning', 'cold', 
  'paralyse', 'psychic', 'holy'
]);


// Validate a unit
export const validateUnit = (u: Unit) => {
  for (const type of u.primaryAttackType) {
    if (!attackTypes.has(type)) {
      throw new Error(`${u.id}: ${type} does not match valid attack types`);
    }
  }
  for (const type of u.secondaryAttackType) {
    if (!attackTypes.has(type)) {
      throw new Error(`${u.id}: ${type} does not match valid attack types`);
    }
  }
  for (const r of Object.keys(u.attackResistances)) {
    if (!attackTypes.has(r)) {
      throw new Error(`${u.id}: ${r} does not match valid resistances`);
    }
  }
}

export const validateSpell = (s: Spell) => {
  for (const eff of s.effects) {
    const type = eff.effectType;
    if (type === 'BattleEffect') {
    } else if (type === 'PreBattleEffect') {
    } else if (type === 'UnitSummonEffect') {
    } else if (type === 'KingdomBuildingsEffect') {
    }
  }
}
