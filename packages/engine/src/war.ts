import _ from 'lodash';
import { Enchantment, Mage, Combatant } from "shared/types/mage";
import { UnitAttrEffect, UnitDamageEffect, UnitHealEffect, BattleEffect } from 'shared/types/effects';
import { betweenInt, randomBM, randomInt, randomWeighted } from './random';
import { hasAbility } from "./base/unit";
import { getSpellById, getItemById, getUnitById, getMaxSpellLevels } from './base/references';
import {
  currentSpellLevel,
  castingCost
} from './magic';
import { BattleReport, BattleStack, BattleEffectLog } from 'shared/types/battle';

// Various battle helpers
import { calcBattleOrders } from './battle/calc-battle-orders';
import { calcAccuracyModifier } from './battle/calc-accuracy-modifier';
import { calcResistance } from './battle/calc-resistance';
import { calcDamageMultiplier } from './battle/calc-damage-multiplier';
import { calcPairings } from './battle/calc-pairings';
import { resolveUnitAbilities } from './battle/resolve-unit-abilities';
import { calcHealing } from './battle/calc-stack-healing';
import { calcFortBonus } from './battle/calc-fort-bonus';
import { calcBattleSummary } from './battle/calc-battle-summary';
import { newBattleReport } from './battle/new-battle-report';
import { prepareBattleStack } from './battle/prepare-battle-stack';
import { calcLandLoss } from './battle/calc-landloss';
import { calcFilteredArmy } from './battle/calc-filtered-army';

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

export interface EffectOrigin {
  id: number,
  magic: string,
  spellLevel: number,
  targetId: number,
}

const calcDamageVariance = (attackType: String[]) => {
  let randomModifier = randomBM();
  if (attackType.includes('magic') || attackType.includes('psychic')) {
    randomModifier = 0.5;
  }
  return randomModifier;
}

/**
 * Apply effect that can alter unit attributes as outlined in Unit typing definition.
 *
 * The general grammar is: "Apply X to unit that match condition Y with rule Z"
 * Where
 *  - X is an attribute like primaryAttackPower, or attackReistances.cold
 *  - Y is filtering rule, like matching all units with melee attacks
 *  - Z determines how the final value is calculate; scale with spell-level, percentage .. etc
 *
 *  Finally there a magic multiplier. Generally speaking if you cast other schools's spell it will
 *  become a weaker version of the same spell casted by a mage whose magic is innate to that school.
 *
 *  e.g. Ascendant mages get better bonuses casting Blinding-Flash than a Nether mage casting the
 *  same spell.
 */
const applyUnitEffect = (
  // caster: Combatant,
  origin: EffectOrigin,
  unitEffect: UnitAttrEffect,
  affectedArmy: BattleStack[]
) => {
  const casterMagic = origin.magic;
  const casterSpellLevel = origin.spellLevel;
  const casterMaxSpellLevel = getMaxSpellLevels()[casterMagic];

  Object.keys(unitEffect.attributes).forEach(attrKey => {
    const attr = unitEffect.attributes[attrKey];
    const fields = attrKey.split(',').map(d => d.trim());

    // Caster colour does not get this effect
    if (!attr.magic[casterMagic]) return;

    // Finally apply effects
    affectedArmy.forEach(stack => {
      const unit = stack.unit;
      const rule = attr.rule;
      let baseValue = attr.magic[casterMagic].value;
      let finalValue: any = null;

      let originalUnit = getUnitById(unit.id);

      fields.forEach(rawField => {
        // Resolve nesting
        let root = unit;
        let originalRoot = originalUnit;
        let field = rawField;

        if (rawField.includes('.')) {
          const [t1, t2] = rawField.split('.');
          root = unit[t1];
          originalRoot = originalUnit[t1];
          field = t2;
        }

        // Figure out the value to add
        if (rule === 'add') {
          finalValue = baseValue;
        } else if (rule === 'addPercentageBase') {
          finalValue = baseValue * originalRoot[field];
        } else if (rule === 'addSpellLevel') {
          finalValue = baseValue * casterSpellLevel;
        } else if (rule === 'addSpellLevelPercentage') {
          finalValue = casterSpellLevel / casterMaxSpellLevel * baseValue;
        } else if (rule === 'addSpellLevelPercentageBase') {
          finalValue = casterSpellLevel / casterMaxSpellLevel * baseValue * originalRoot[field];
        } else if (rule === 'remove') {
          finalValue = baseValue;
        } else if (rule === 'set') {
          finalValue = baseValue;
        } else {
          throw new Error(`Unable to proces rule ${rule}`);
        }

        // Finally apply
        if (field === 'abilities') {
          if (rule === 'add') {
            stack.addedAbilities.push(finalValue);
          } else if (rule === 'remove') {
            stack.removedAbilities.push(finalValue);
          } else {
            throw new Error(`Unable to resolve ${rule}`);
          }
        } else if (field === 'primaryAttackType') {
          unit.primaryAttackType.push(finalValue);
        } else if (field === 'secondaryAttackType') {
          unit.secondaryAttackType.push(finalValue);
        } else if (field === 'accuracy') {
          stack.accuracy += finalValue;
        } else if (field === 'efficiency') {
          stack.efficiency += finalValue;
        } else if (field === 'attackResistances') {
          // applies across to all attack types
          const ar = unit.attackResistances;
          ar.breath += finalValue;
          ar.missile += finalValue;
          ar.melee += finalValue;
          ar.paralyse += finalValue;
          ar.poison += finalValue;
          ar.psychic += finalValue;
          ar.magic += finalValue;
          ar.holy += finalValue;
          ar.lightning += finalValue;
          ar.cold += finalValue;
          ar.fire += finalValue;
          ar.ranged += finalValue;
        } else {
          if (field === 'secondaryAttackInit' || field === 'secondaryAttackPower') {
            if (unit.secondaryAttackType.length === 0) return;
          }
          root[field] += Math.floor(finalValue);
        }
      });
    });
  });
};

/**
 * Apply direct damage to target stacks
 */
const applyDamageEffect = (
  origin: EffectOrigin,
  damageEffect: UnitDamageEffect,
  affectedArmy: BattleStack[]
) => {
  const logs: BattleEffectLog[] = [];
  const casterMagic = origin.magic;
  const casterSpellLevel = origin.spellLevel;

  const damageType = damageEffect.damageType;
  let rawDamage = 0;

  if (!damageEffect.magic[casterMagic]) return;

  affectedArmy.forEach(stack => {
    // TODO: minTimes and maxTimes
    const rule = damageEffect.rule;
    if (rule === 'spellLevel') {
      rawDamage = damageEffect.magic[casterMagic].value * casterSpellLevel;
    } else if (rule === 'spellLevelUnit') {
      rawDamage = damageEffect.magic[casterMagic].value * casterSpellLevel;
    } else if (rule === 'direct') {
      rawDamage = damageEffect.magic[casterMagic].value;
    }

    if (rule === 'spellLevelUnit') {
      let unitsLoss = Math.floor(rawDamage);
      // Give it a bit of randomness
      unitsLoss = Math.ceil(0.7 * unitsLoss) + Math.ceil(0.3 * randomBM() * unitsLoss);

      if (unitsLoss >= stack.size) {
        unitsLoss = stack.size;
      }
      stack.sustainedDamage = 0;
      stack.size -= unitsLoss;
      stack.loss += unitsLoss;

      logs.push({
        id: origin.targetId,
        unitId: stack.unit.id,
        effectType: 'slain',
        value: unitsLoss
      });
      console.log(`dealing unitDamage units=${unitsLoss}`);
      return;
    }

    const resistance = calcResistance(stack.unit, damageType);
    const damage = rawDamage * ((100 - resistance) / 100);
    let totalDamage = damage + stack.sustainedDamage;
    let unitsLoss = Math.floor(totalDamage / stack.unit.hitPoints);

    if (unitsLoss >= stack.size) {
      totalDamage = stack.size * stack.unit.hitPoints;
      unitsLoss = stack.size;
    }
    if (unitsLoss > 0) {
      stack.sustainedDamage = 0;
    }
    stack.sustainedDamage += (totalDamage % stack.unit.hitPoints);
    stack.size -= unitsLoss;
    stack.loss += unitsLoss;

    logs.push({
      id: origin.targetId,
      unitId: stack.unit.id,
      effectType: 'slain',
      value: unitsLoss
    })
    console.log(`dealing rawDamage=${damage} actualDamage=${totalDamage} units=${unitsLoss}`);
  });

  return logs
};

const applyHealEffect = (
  origin: EffectOrigin,
  healEffect: UnitHealEffect,
  affectedArmy: BattleStack[]
) => {
  const casterMagic = origin.magic;
  const casterSpellLevel = origin.spellLevel;
  const healType = healEffect.healType;
  const rule = healEffect.rule;

  let healBase = 0;
  if (rule === 'spellLevel') {
    healBase = healEffect.magic[casterMagic].value * casterSpellLevel;
  } else {
    healBase = healEffect.magic[casterMagic].value;
  }

  affectedArmy.forEach(stack => {
    if (healType === 'points') {
      stack.healingPoints += stack.size * healBase;
    } else if (healType === 'percentage') {
      stack.healingBuffer.push(healBase);
    }
  });
};


/**
 * Entry point for casting battle spells. This ensures the correct caster and affected army
 * are in-place before handing off the actual calculation to helper effects functions.
 *
 * The stack attribute determines how the affected army is chosen, there are several options.
 * - random: If the spell has multiple effects, each effect targets a random stack
 *   spells that have both UnitEffect and DamageEffect and wants to target the same unit.
 * - all: All stacks get all effects
 */
const battleSpell = (
  caster: Combatant,
  casterBattleStack: BattleStack[],
  defender: Combatant,
  defenderBattleStack: BattleStack[],
  enchantment: Enchantment = null
) => {
  const logs: BattleEffectLog[] = [];

  const casterSpell = enchantment ?
    getSpellById(enchantment.spellId) :
    getSpellById(caster.spellId);

  let effectOrigin: EffectOrigin = {
    id: caster.mage.id,
    magic: caster.mage.magic,
    spellLevel: currentSpellLevel(caster.mage),
    targetId: defender.mage.id
  };

  // Override default if calculating enchantment
  if (enchantment) {
    effectOrigin.id = enchantment.casterId;
    effectOrigin.magic = enchantment.casterMagic;
    effectOrigin.spellLevel = enchantment.spellLevel;
  }

  const battleEffects = casterSpell.effects.filter(d => d.effectType === 'BattleEffect') as BattleEffect[];
  for (const battleEffect of battleEffects) {
    const targetType = battleEffect.targetType;
    const effects = battleEffect.effects;
    const army = battleEffect.target === 'self' ? casterBattleStack: defenderBattleStack;
    const numTimes = battleEffect.trigger ? betweenInt(battleEffect.trigger.min, battleEffect.trigger.max) : 1;

    // Matching spell filters
    const filteredArmy = calcFilteredArmy(army, battleEffect.filters);

    // Nothing to do
    if (filteredArmy.length === 0) continue;

    for (let num = 0; num < numTimes; num++) {
      let randomIdx = -1;
      if (targetType === 'random') {
        randomIdx = randomInt(filteredArmy.length);
      } else if (targetType === 'weightedRandom') {
        randomIdx = Math.min(randomWeighted() - 1, filteredArmy.length -1);
      }

      for (const effect of effects) {
        let affectedArmy: BattleStack[] = [];
        if (targetType === 'random' || targetType === 'weightedRandom') {
          affectedArmy = [filteredArmy[randomIdx]];
        } else {
          affectedArmy = filteredArmy;
        }

        if (effect.checkResistance === true) {
          affectedArmy = affectedArmy.filter(stack => {
            const roll = Math.random() * 100;
            if (roll > stack.unit.spellResistances[casterSpell.magic]) {
              return true;
            }
            console.log(`${stack.unit.name} resisted ${stack.unit.spellResistances[casterSpell.magic]}`);
            return false;
          });
        }
        console.log(`Applying ${effect.effectType} effect to ${affectedArmy.map(d => d.unit.name)}`);

        if (effect.effectType === 'UnitAttrEffect') {
          const unitAttrEffect = effect as UnitAttrEffect;
          applyUnitEffect(effectOrigin, unitAttrEffect, affectedArmy);
        } else if (effect.effectType === 'UnitDamageEffect') {
          const damageEffect = effect as UnitDamageEffect;
          const damageLogs = applyDamageEffect(effectOrigin, damageEffect, affectedArmy);
          logs.push(...damageLogs);
        } else if (effect.effectType === 'UnitHealEffect') {
          const healEffect = effect as UnitHealEffect;
          applyHealEffect(effectOrigin, healEffect, affectedArmy);
        }
      }
    } // end numTimes
  }
  return logs;
}

/**
 * Use a battle item. The process is similar to battleSpell, however items cannot be resisted or
 * reflected by opposing forces at the mage level. Item effects also cannot be resisted at the
 * unit level.
 */
const battleItem = (
  caster: Combatant,
  casterBattleStack: BattleStack[],
  defender: Combatant,
  defenderBattleStack: BattleStack[]) => {

  const logs: BattleEffectLog[] = []
  const casterItem = getItemById(caster.itemId);

  const effectOrigin: EffectOrigin = {
    id: caster.mage.id,
    magic: caster.mage.magic,
    spellLevel: currentSpellLevel(caster.mage),
    targetId: defender.mage.id
  };

  casterItem.effects.forEach(effect => {
    if (effect.effectType !== 'BattleEffect') return;

    const battleEffect = effect as BattleEffect;
    const army = battleEffect.target === 'self' ? casterBattleStack : defenderBattleStack;
    const numTimes = battleEffect.trigger ? betweenInt(battleEffect.trigger.min, battleEffect.trigger.max) : 1;

    const filteredArmy = calcFilteredArmy(army, battleEffect.filters);
    const targetType = battleEffect.targetType;

    // Nothing to do
    if (filteredArmy.length === 0) return;

    for (let num = 0; num < numTimes; num++) {
      let randomIdx = -1;
      if (targetType === 'random') {
        randomIdx = randomInt(filteredArmy.length);
      } else if (targetType === 'weightedRandom') {
        randomIdx = Math.min(randomWeighted() - 1, filteredArmy.length -1);
      }

      for (let i = 0; i < battleEffect.effects.length; i++) {
        let affectedArmy: BattleStack[] = [];
        if (targetType === 'random' || targetType === 'weightedRandom') {
          affectedArmy = [filteredArmy[randomIdx]];
        } else {
          affectedArmy = filteredArmy;
        }

        const eff = battleEffect.effects[i];
        console.log(`Applying effect ${i+1} (${eff.effectType}) to ${affectedArmy.map(d => d.unit.name)}`);

        if (eff.effectType === 'UnitAttrEffect') {
          const unitAttrEffect = eff as UnitAttrEffect;
          applyUnitEffect(effectOrigin, unitAttrEffect, affectedArmy);
        } else if (eff.effectType === 'UnitDamageEffect') {
          const damageEffect = eff as UnitDamageEffect;
          applyDamageEffect(effectOrigin, damageEffect, affectedArmy);
        }
      }
    } // end numTimes
  });

  return logs;
}

// For debugging different scenarios
export interface BattleOptions {
  useFortBonus: boolean,
  useEnchantments: boolean,
  useUnlimitedResources: boolean,
}

const battleOptions: BattleOptions = {
  useFortBonus: true,
  useEnchantments: true,
  useUnlimitedResources: true
};

// TODO: Redo report structure

/**
 * Handles siege and regular battles. The battle phase goes as follows
 * - Prepare battle stacks from chosen armies from both sides, this is used to track progress
 * - Apply spells
 * - Apply items
 * - Resolve conflicting effects
 * - Calculate unit pairings
 * - Calculte battle order
 * - Calculate healing factors
**/
export const battle = (attackType: string, attacker: Combatant, defender: Combatant) => {
  console.log(`war ${attackType}`, attackType, attacker.army.length, defender.army.length);

  // Create mutable data for the battle
  const attackingArmy =  prepareBattleStack(attacker.army, 'attacker');
  const defendingArmy =  prepareBattleStack(defender.army, 'defender');

  ////////////////////////////////////////////////////////////////////////////////
  // TODO:
  // - Hero effects
  ////////////////////////////////////////////////////////////////////////////////

  // Enchantments effects are equivalent to spell effects, but the
  // efficacy is the enchantment spell level, and not that of the caster's
  // current spell level
  console.log('>> apply attacker enchantments')
  attacker.mage.enchantments.forEach(enchant => {
    battleSpell(
      attacker,
      attackingArmy,
      defender,
      defendingArmy,
      enchant);
  });

  console.log('>> apply defender enchantments')
  defender.mage.enchantments.forEach(enchant => {
    battleSpell(
      defender,
      defendingArmy,
      attacker,
      attackingArmy,
      enchant);
  });

  // Apply fort bonus to defender
  if (battleOptions.useFortBonus === true) {
    const base = calcFortBonus(defender.mage, attackType);
    defendingArmy.forEach(stack => {
      stack.unit.hitPoints += Math.floor((base / 100) * stack.unit.hitPoints);
    });
  }

  // Initialize battle report
  const battleReport = newBattleReport(attacker, defender, attackType);


  // TODO: check barriers and success
  const preBattle = battleReport.preBattle;
  if (attacker.spellId) {
    console.log(`>> attacker spell ${attacker.spellId}`);
    const cost = castingCost(attacker.mage, attacker.spellId);
    if (cost > attacker.mage.currentMana || battleOptions.useUnlimitedResources) {
      attacker.mage.currentMana -= cost;
      preBattle.attacker.spellResult = 'success';
      const battleSpellLogs = battleSpell(attacker, attackingArmy, defender, defendingArmy, null);
      preBattle.logs.push(...battleSpellLogs);
    } else {
      preBattle.attacker.spellResult = 'noMana';
    }
    console.log('');
  }
  if (attacker.itemId) {
    console.log(`>> attacker item ${attacker.itemId}`);
    if (attacker.mage.items[attacker.itemId] > 0 || battleOptions.useUnlimitedResources) {
      attacker.mage.items[attacker.itemId] --;
      const battleItemLogs = battleItem(attacker, attackingArmy, defender, defendingArmy);
      preBattle.logs.push(...battleItemLogs);
      preBattle.attacker.itemResult = 'success';
    } else {
      preBattle.attacker.itemResult = 'noItem';
    }
    console.log('');
  }

  if (defender.spellId) {
    console.log(`>> defender spell ${defender.spellId}`);
    const cost = castingCost(defender.mage, defender.spellId);
    if (cost > defender.mage.currentMana || battleOptions.useUnlimitedResources) {
      defender.mage.currentMana -= cost;

      preBattle.defender.spellResult = 'success';
      const battleSpellLogs = battleSpell(defender, defendingArmy, attacker, attackingArmy, null);
      preBattle.logs.push(...battleSpellLogs);
    } else {
      preBattle.defender.spellResult = 'noMana';
    }
    console.log('');
  }
  if (defender.itemId) {
    console.log(`>> defender item ${defender.itemId}`);
    if (defender.mage.items[defender.itemId] > 0 || battleOptions.useUnlimitedResources) {
      defender.mage.items[defender.itemId] --;
      const battleItemLogs = battleItem(defender, defendingArmy, attacker, attackingArmy);
      preBattle.logs.push(...battleItemLogs);
      preBattle.defender.itemResult = 'success';
    } else {
      preBattle.defender.itemResult = 'noItem';
    }
    console.log('');
  }



  // Resolving contradicting ability states
  resolveUnitAbilities(attackingArmy);
  resolveUnitAbilities(defendingArmy);

  // Find pairing
  calcPairings(attackingArmy, defendingArmy);
  calcPairings(defendingArmy, attackingArmy);

  // Sort out attacking order
  const battleOrders = calcBattleOrders(attackingArmy, defendingArmy);

  battleReport.attacker.army = _.cloneDeep(attackingArmy);
  battleReport.defender.army = _.cloneDeep(defendingArmy);

  console.log('=== Engagement ===');
  for (let i = 0; i < battleOrders.length; i++) {
    const battleOrder = battleOrders[i];
    const attackType = battleOrder.attackType;
    const position = battleOrder.position;
    const side = battleOrder.side;
    const attackingStack = side === 'attacker' ? attackingArmy[position] : defendingArmy[position];
    const targetIdx = attackingStack.targetIdx;
    const defendingStack = side === 'attacker' ? defendingArmy[targetIdx] : attackingArmy[targetIdx];

    console.log('\t', i, `${side}: ${attackingStack.unit.name}(${attackingStack.accuracy}) attacks:${attackType} ${defendingStack.unit.name}`);

    const aUnit = attackingStack.unit;
    const dUnit = defendingStack.unit;

    const attackingMage = side === 'attacker' ? attacker.mage : defender.mage;
    const defendingMage = side === 'attacker' ? defender.mage : attacker.mage;

    /////////// Primary //////////
    if (attackType === 'primary') {
      if (attackingStack.unit.primaryAttackInit < 1 || attackingStack.size <= 0) continue;
      if (defendingStack.size <= 0) continue;

      // Resolve burst
      if (hasAbility(dUnit, 'bursting')) {
        const burstingAbilities = dUnit.abilities.filter(d => d.name === 'bursting');

        for (const burstingAbility of burstingAbilities) {
          console.log('handle burst', burstingAbility);

          let burstingType = dUnit.primaryAttackType;
          let burstingPower = dUnit.powerRank;

          if (burstingAbility.extra) {
            const extra = burstingAbility.extra;
            if (extra.type) burstingType = extra.type;
            if (extra.value) burstingPower = extra.value;
          }

          // Calculate attacker burst loss
          let attackerResistance = calcResistance(aUnit, burstingType);
          let attackerDamageMultiplier = calcDamageMultiplier(dUnit, aUnit, burstingType);
          let attackerDamageVariance = calcDamageVariance(burstingType);
          let attackerDamage = burstingPower *
            defendingStack.size *
            (defendingStack.efficiency / 100) *
            ((100 - attackerResistance) / 100) *
            attackerDamageVariance;
          attackerDamage = Math.floor(attackerDamage * attackerDamageMultiplier);
          let attackerSustainedDamage = attackingStack.sustainedDamage;
          let attackerTotalDamage = attackerDamage + attackerSustainedDamage;

          let attackerUnitLoss = Math.floor(attackerTotalDamage / aUnit.hitPoints);
          if (attackerUnitLoss >= attackingStack.size) {
            attackerUnitLoss = attackingStack.size;
            attackerTotalDamage = attackingStack.size * aUnit.hitPoints;
          }

          if (attackerUnitLoss > 0) {
            attackingStack.sustainedDamage = 0;
          }
          attackingStack.sustainedDamage += (attackerTotalDamage % aUnit.hitPoints);
          attackingStack.size -= attackerUnitLoss;
          attackingStack.loss += attackerUnitLoss;


          // Calculate defender burst loss
          let defenderResistance = calcResistance(dUnit, burstingType);
          let defenderDamageMultiplier = calcDamageMultiplier(dUnit, dUnit, burstingType);
          let defenderDamageVariance = calcDamageVariance(burstingType);
          let defenderDamage = burstingPower *
            defendingStack.size *
            (defendingStack.efficiency / 100) *
            ((100 - defenderResistance) / 100) *
            defenderDamageVariance;
          defenderDamage = Math.floor(defenderDamage * defenderDamageMultiplier);
          let defenderSustainedDamage = defendingStack.sustainedDamage;
          let defenderTotalDamage = defenderDamage + defenderSustainedDamage;

          let defenderUnitLoss = Math.floor(defenderTotalDamage / dUnit.hitPoints);
          if (defenderUnitLoss >= defendingStack.size) {
            defenderUnitLoss = defendingStack.size;
          }

          if (defenderUnitLoss > 0) {
            defendingStack.sustainedDamage = 0;
          }
          defendingStack.sustainedDamage += (defenderTotalDamage % dUnit.hitPoints);
          defendingStack.size -= defenderUnitLoss;
          defendingStack.loss += defenderUnitLoss;

          battleReport.battleLogs.push({
            type: `burst`,
            attacker: {
              id: attackingMage.id,
              unitId: attackingStack.unit.id,
              unitsLoss:attackerUnitLoss
            },
            defender: {
              id: defendingMage.id,
              unitId: defendingStack.unit.id,
              unitsLoss: defenderUnitLoss
            }
          });
        }
      }


      let accuracy = attackingStack.accuracy + calcAccuracyModifier(aUnit, dUnit);
      let resistance = calcResistance(dUnit, aUnit.primaryAttackType);
      let efficiency = attackingStack.efficiency;
      let damageMultiplier = calcDamageMultiplier(aUnit, dUnit, aUnit.primaryAttackType);
      let damageVariance = calcDamageVariance(aUnit.primaryAttackType);
      if (hasAbility(dUnit, 'charm')) {
        efficiency -= 50;
        efficiency = Math.max(0, efficiency);
      }

      let damage = aUnit.primaryAttackPower *
        attackingStack.size *
        (accuracy / 100) *
        (efficiency / 100) *
        ((100 - resistance) / 100) *
        damageVariance;
      damage = Math.floor(damage * damageMultiplier);
      let sustainedDamage = defendingStack.sustainedDamage;
      let totalDamage = damage + sustainedDamage;

      let defenderUnitLoss = Math.floor(totalDamage / dUnit.hitPoints);
      if (defenderUnitLoss >= defendingStack.size) {
        totalDamage = defendingStack.size * dUnit.hitPoints;
        defenderUnitLoss = defendingStack.size;
      }

      console.log(`\t\t damage=${damage}+${sustainedDamage}, loss=${defenderUnitLoss}`);
      battleReport.battleLogs.push({
        type: 'primary',
        attacker: {
          id: attackingMage.id,
          unitId: attackingStack.unit.id,
          unitsLoss: 0
        },
        defender: {
          id: defendingMage.id,
          unitId: defendingStack.unit.id,
          unitsLoss: defenderUnitLoss
        }
      });

      // Accumulate or clear partial damage
      if (defenderUnitLoss > 0) {
        defendingStack.sustainedDamage = 0;
      }
      defendingStack.sustainedDamage += (totalDamage % dUnit.hitPoints);
      defendingStack.size -= defenderUnitLoss;
      defendingStack.loss += defenderUnitLoss;

      // Additonal Strike ability
      if (hasAbility(aUnit, 'additionalStrike')) {
        let damageVariance = calcDamageVariance(aUnit.primaryAttackType);
        let damage = aUnit.primaryAttackPower *
          attackingStack.size *
          (accuracy / 100) *
          (efficiency / 100) *
          ((100 - resistance) / 100) *
          damageVariance;
        damage = Math.floor(damage * damageMultiplier);
        let sustainedDamage = defendingStack.sustainedDamage;
        let totalDamage = damage + sustainedDamage;

        let defenderUnitLoss = Math.floor(totalDamage / dUnit.hitPoints);
        if (defenderUnitLoss >= defendingStack.size) {
          totalDamage = defendingStack.size * dUnit.hitPoints;
          defenderUnitLoss = defendingStack.size;
        }

        console.log(`\t\t damage=${damage}+${sustainedDamage}, loss=${defenderUnitLoss}`);
        battleReport.battleLogs.push({
          type: 'additionalStrike',
          attacker: {
            id: attackingMage.id,
            unitId: attackingStack.unit.id,
            unitsLoss: 0
          },
          defender: {
            id: defendingMage.id,
            unitId: defendingStack.unit.id,
            unitsLoss: defenderUnitLoss
          }
        });

        // Accumulate or clear partial damage
        if (defenderUnitLoss > 0) {
          defendingStack.sustainedDamage = 0;
        }
        defendingStack.sustainedDamage += (totalDamage % dUnit.hitPoints);
        defendingStack.size -= defenderUnitLoss;
        defendingStack.loss += defenderUnitLoss;
      } // end Additional Strike


      // Counter attack
      if (aUnit.primaryAttackType.includes('paralyse')) {
        // Unit paralysed
      } else if (aUnit.primaryAttackType.includes('ranged')) {
        // Cannot counter ranged
      } else if (defendingStack.size > 0 && attackingStack.size > 0) {
        // Execute counter
        let accuracy = defendingStack.accuracy + calcAccuracyModifier(dUnit, aUnit);
        let resistance = calcResistance(aUnit, dUnit.primaryAttackType);
        let efficiency = defendingStack.efficiency;
        let damageMultiplier = calcDamageMultiplier(dUnit, aUnit, dUnit.primaryAttackType);
        let damageVariance = calcDamageVariance(dUnit.primaryAttackType);
        if (hasAbility(aUnit, 'charm')) {
          efficiency -= 50;
          efficiency = Math.max(0, efficiency);
        }

        let damage = dUnit.counterAttackPower *
          defendingStack.size *
          (accuracy / 100) *
          (efficiency / 100) *
          ((100 - resistance) / 100) *
          damageVariance;
        damage = Math.floor(damage * damageMultiplier);
        let sustainedDamage = attackingStack.sustainedDamage;
        let totalDamage = damage + sustainedDamage;

        let attackerUnitLoss = Math.floor(totalDamage / aUnit.hitPoints);
        if (attackerUnitLoss >= attackingStack.size) {
          totalDamage = attackingStack.size * aUnit.hitPoints;
          attackerUnitLoss = attackingStack.size;
        }
        console.log(`\t\t counter damage=${damage}+${sustainedDamage}, loss=${attackerUnitLoss}`);

        battleReport.battleLogs.push({
          type: 'counter',
          attacker: {
            id: attackingMage.id,
            unitId: attackingStack.unit.id,
            unitsLoss: attackerUnitLoss
          },
          defender: {
            id: defendingMage.id,
            unitId: defendingStack.unit.id,
            unitsLoss: 0
          }
        });

        // Accumulate or clear partial damage
        if (attackerUnitLoss > 0) {
          attackingStack.sustainedDamage = 0;
        }
        attackingStack.sustainedDamage += (totalDamage % aUnit.hitPoints);
        attackingStack.size -= attackerUnitLoss;
        attackingStack.loss += attackerUnitLoss;
      }

      // Fatigue
      attackingStack.efficiency -= hasAbility(aUnit, 'endurance') ? 10 : 15;
      if (attackingStack.efficiency < 0) attackingStack.efficiency = 0;

      defendingStack.efficiency -= hasAbility(dUnit, 'endurance') ? 10 : 15;
      if (defendingStack.efficiency < 0) defendingStack.efficiency = 0;
    }

    /////////// Secondary //////////
    if (attackType === 'secondary') {
      if (attackingStack.unit.secondaryAttackInit < 1 || attackingStack.size <= 0) continue;

      let accuracy = attackingStack.accuracy + calcAccuracyModifier(aUnit, dUnit);
      let resistance = calcResistance(dUnit, aUnit.secondaryAttackType);
      let damageVariance = calcDamageVariance(aUnit.secondaryAttackType);
      let damageMultiplier = calcDamageMultiplier(aUnit, dUnit, aUnit.secondaryAttackType);

      let damage = aUnit.secondaryAttackPower *
        attackingStack.size *
        (accuracy / 100) *
        ((100 - resistance) / 100) *
        damageVariance;
      damage = Math.floor(damage * damageMultiplier);
      let sustainedDamage = defendingStack.sustainedDamage;
      let totalDamage = damage + sustainedDamage;

      let defenderUnitLoss = Math.floor(totalDamage / dUnit.hitPoints);
      if (defenderUnitLoss >= defendingStack.size) {
        totalDamage = defendingStack.size * dUnit.hitPoints;
        defenderUnitLoss = defendingStack.size;
      }
      console.log(`\t\t damage=${damage}+${sustainedDamage}, loss=${defenderUnitLoss}`);

      battleReport.battleLogs.push({
        type: 'secondary',
        attacker: {
          id: attackingMage.id,
          unitId: attackingStack.unit.id,
          unitsLoss: 0
        },
        defender: {
          id: defendingMage.id,
          unitId: defendingStack.unit.id,
          unitsLoss: defenderUnitLoss
        }
      });

      // Accumulate or clear partial damage
      if (defenderUnitLoss > 0) {
        defendingStack.sustainedDamage = 0;
      }
      defendingStack.sustainedDamage += (totalDamage % dUnit.hitPoints);
      defendingStack.size -= defenderUnitLoss;
      defendingStack.loss += defenderUnitLoss;
    }
  } // end battleOrders


  // Post battle, healing calculation
  // Attacker healing
  attackingArmy.forEach(stack => {
    let startingStackLoss = stack.loss;
    let totalUnitsHealed = calcHealing(stack);

    if (totalUnitsHealed >= stack.loss) {
      totalUnitsHealed = stack.loss;
    }
    stack.loss -= totalUnitsHealed;
    stack.size += totalUnitsHealed;

    battleReport.postBattleLogs.push({
      id: attacker.mage.id,
      unitId: stack.unit.id,
      unitsLoss: startingStackLoss,
      unitsHealed: totalUnitsHealed
    });
  });

  // Defender healing
  defendingArmy.forEach(stack => {
    let startingStackLoss = stack.loss;
    let totalUnitsHealed = calcHealing(stack);

    if (totalUnitsHealed >= stack.loss) {
      totalUnitsHealed = stack.loss;
    }
    stack.loss -= totalUnitsHealed;
    stack.size += totalUnitsHealed;

    battleReport.postBattleLogs.push({
      id: defender.mage.id,
      unitId: stack.unit.id,
      unitsLoss: startingStackLoss,
      unitsHealed: totalUnitsHealed
    });
  });

  // Calculate combat result
  const battleSummary = calcBattleSummary(attackingArmy, defendingArmy);
  const brA = battleReport.summary.attacker;
  const brD = battleReport.summary.defender;

  // Starting army size
  brA.startingUnits = battleReport.attacker.army.reduce((v, stack) => {
    return v + stack.size;
  }, 0);
  brA.netPower = battleSummary.attacker.netPower;
  brA.netPowerLoss = battleSummary.attacker.netPowerLoss;
  brA.unitsLoss = battleSummary.attacker.unitsLoss;
  brA.armyLoss = attackingArmy.map(d => ({id: d.unit.id, size: d.loss}));

  brD.startingUnits = battleReport.defender.army.reduce((v, stack) => {
    return v + stack.size;
  }, 0);
  brD.netPower = battleSummary.defender.netPower;
  brD.netPowerLoss = battleSummary.defender.netPowerLoss;
  brD.unitsLoss = battleSummary.defender.unitsLoss;
  brD.armyLoss = defendingArmy.map(d => ({id: d.unit.id, size: d.loss}));

  if (brA.netPowerLoss < brD.netPowerLoss && brD.netPowerLoss >= 0.1 * brD.netPower) {
    battleReport.isSuccessful = true;
    battleReport.summary.isSuccessful = true;
  } else {
    battleReport.isSuccessful = false;
    battleReport.summary.isSuccessful = false;
  }
  return battleReport;
}

export const resolveBattle = (attacker: Mage, defender: Mage, battleReport: BattleReport) => {
  ////////////////////////////////////////////////////////////////////////////////
  // Resolve army losses
  ////////////////////////////////////////////////////////////////////////////////
  const summary = battleReport.summary;
  const attackerLosses = summary.attacker.armyLoss;
  attackerLosses.forEach(stack => {
    const f = attacker.army.find(d => { return d.id === stack.id });
    if (f) f.size -= stack.size;
  });
  attacker.army = attacker.army.filter(d => d.size > 0);

  const defenderLosses = summary.defender.armyLoss;
  defenderLosses.forEach(stack => {
    const f = defender.army.find(d => { return d.id === stack.id });
    if (f) f.size -= stack.size;
  });
  defender.army = defender.army.filter(d => d.size > 0);

  if (battleReport.isSuccessful === false) {
    return;
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Resolve land losses
  ////////////////////////////////////////////////////////////////////////////////
  let unitsRemaining = 0;
  battleReport.attacker.army.forEach(stack => {
    if (stack.size > 0) unitsRemaining += stack.size;
  });
  const landResult = calcLandLoss(defender, battleReport.attackType, unitsRemaining);

  Object.keys(landResult.landLoss).forEach(key => {
    defender[key] -= landResult.landLoss[key];
  });
  Object.keys(landResult.landGain).forEach(key => {
    attacker[key] += landResult.landGain[key];
  });
  battleReport.landResult = _.cloneDeep(landResult);

  if (defender.forts <= 0) {
    defender.status = 'defeated';
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Resolve mage status
  ////////////////////////////////////////////////////////////////////////////////
  if (defender.forts <= 0) {
    defender.status = 'defeated';
    battleReport.summary.isDefenderDefeated = true;
  }


  // land summary for battle report
  const buildingTypes = [
    'wilderness', 'farms', 'towns',
    'workshops', 'nodes', 'barracks',
    'guilds', 'barriers', 'forts'
  ];
  let totalLandGain = 0;
  buildingTypes.forEach(building => {
    totalLandGain += battleReport.landResult.landGain[building];
  });
  let totalLandLoss = 0;
  buildingTypes.forEach(building => {
    totalLandLoss += battleReport.landResult.landLoss[building];
  });
  battleReport.summary.landGain = totalLandGain;
  battleReport.summary.landLoss = totalLandLoss;

}
