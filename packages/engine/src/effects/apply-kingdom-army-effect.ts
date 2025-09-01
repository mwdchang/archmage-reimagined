import { EffectOrigin, KingdomArmyEffect } from "shared/types/effects";
import { Mage } from "shared/types/mage";
import { getMaxSpellLevels, getUnitById } from "../base/references";
import { between, randomBM } from "../random";
import { doItemDestruction, doItemGeneration } from "../magic";
import { matchesFilter } from "../base/unit";

export const applyKingdomArmyEffect = (
  mage: Mage,
  effect: KingdomArmyEffect,
  origin: EffectOrigin
) => {
  const spellLevel = origin.spellLevel;
  const magic = origin.magic;
  const maxSpellLevel = getMaxSpellLevels()[magic];
  const spellPowerScale = spellLevel / maxSpellLevel;

  const { min, max } = effect.magic[magic].value as { min: number, max: number };
  const base = between(min, max);

  let filteredArmy = mage.army;

  if (effect.filters) {
    filteredArmy = filteredArmy.filter(d => {
      const unit = getUnitById(d.id);
      for (const filter of effect.filters) {
        if (matchesFilter(unit, filter) === true) {
          return true
        }
      }
      return false;
    });
  }

  if (effect.checkResistance === true) {
    filteredArmy = filteredArmy.filter(d => {
      const unit = getUnitById(d.id);
      const roll = Math.random() * 100;
      if (roll > unit.spellResistances[magic]) {
        return true;
      }
      return false;
    });
  }

  // Apply
  const rule = effect.rule;
  for (const armyUnit of filteredArmy) {
    if (rule === 'addSpellLevelPercentageBase') {
      let value = Math.floor(armyUnit.size * spellPowerScale * base);
      if (armyUnit.size + value < 0) {
        value = - armyUnit.size;
      }
      armyUnit.size += value;
      
      if (value < 0) {
        console.log(`lost ${value} ${armyUnit.id}`);
      } else {
        console.log(`gain ${value} ${armyUnit.id}`);
      }
    } else {
      throw new Error(`unsupported KingdomArmyEffect rule ${rule}`);
    }
  }

};
