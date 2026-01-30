import { BattleItemResult, BattleSpellResult } from "shared/types/battle";
import { Combatant } from "shared/types/mage";
import { getSpellById } from "../base/references";
import { calcKingdomResistance, castingCost, successCastingRate } from "../magic";
import { AvoidEffect } from "shared/types/effects";
import { allowedEffect as E } from "shared/src/common";

/**
 * Check if spell and item pass barriers
 * - spell goes throw two stages: barrier resist and magic resist.
 * - item goes through only barrier resist
**/


export const attackerSpellResult = (attacker: Combatant, defender: Combatant): BattleSpellResult=> {
  if (defender.army.length === 0)  {
    return 'notUsed';
  }

  const spell = getSpellById(attacker.spellId);
  if (attacker.mage.spellbook[spell.magic].includes(spell.id) === false) {
    return 'noSpell'
  }

  const cost = castingCost(attacker.mage, attacker.spellId);
  if (cost > attacker.mage.currentMana) { 
    return 'noMana';
  }
  attacker.mage.currentMana -= cost;

  const castingRate = successCastingRate(attacker.mage, attacker.spellId);
  const roll1 = Math.random() * 100;
  const roll2 = Math.random() * 100;

  if (Math.random() * 100 > castingRate) {
    return 'lostConcentration';
  }

  const kingdomResistances = calcKingdomResistance(defender.mage);
  if (roll1 <= kingdomResistances['barriers']) { 
    return 'barriers';
  }
  if (roll2 <= kingdomResistances[spell.magic]) {
    return 'barriers';
  }

  let avoidSpell = false;
  for (const enchantment of defender.mage.enchantments) {
    const spell = getSpellById(enchantment.spellId);
    const battleAvoidances = spell.effects.filter(eff => {
      return eff.effectType === E.AvoidEffect;
    }) as AvoidEffect[];

    for (const eff of battleAvoidances.filter(e => e.target === 'spell')) {
      if (Math.random() * 100 <= eff.magic[enchantment.casterMagic].value) {
        avoidSpell = true;
      }
    }
  }

  if (avoidSpell === true) {
    return 'missed';
  } 
  return 'success';
}


export const defenderSpellResult = (_attacker: Combatant, defender: Combatant): BattleSpellResult=> {
  if (defender.army.length === 0)  {
    return 'notUsed';
  }

  const spell = getSpellById(defender.spellId);
  if (defender.mage.spellbook[spell.magic].includes(spell.id) === false) {
    return 'noSpell';
  }

  const cost = castingCost(defender.mage, defender.spellId);
  if (cost > defender.mage.currentMana) {
    return 'noMana';
  }
  defender.mage.currentMana -= cost;

  const castingRate = successCastingRate(defender.mage, defender.spellId);
  if (Math.random() * 100 > castingRate) {
    return 'lostConcentration';
  }
  return 'success';
}


export const attackerItemResult = (attacker: Combatant, defender: Combatant): BattleItemResult => {
  if (defender.army.length === 0)  {
    return 'notUsed';
  }

  if (!attacker.mage.items[attacker.itemId] || attacker.mage[attacker.itemId] <= 0) {
    return 'noItem';
  }
  attacker.mage.items[attacker.itemId] --;
  if (attacker.mage.items[attacker.itemId] <= 0) {
    delete attacker.mage.items[attacker.itemId];
  }

  const roll = Math.random() * 100;
  const kingdomResistances = calcKingdomResistance(defender.mage);
  if (roll <= kingdomResistances['barriers']) { 
    return 'barriers';
  }
  return 'success';
}

export const defenderItemResult = (attacker: Combatant, defender: Combatant): BattleItemResult => {
  if (defender.army.length === 0)  {
    return 'notUsed';
  }
  if (!defender.mage.items[defender.itemId] || defender.mage[defender.itemId] <= 0) {
    return 'noItem';
  }
  defender.mage.items[defender.itemId] --;
  if (defender.mage.items[defender.itemId] <= 0) {
    delete defender.mage.items[defender.itemId];
  }
  return 'success';
}

