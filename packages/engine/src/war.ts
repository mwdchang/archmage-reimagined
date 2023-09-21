import _ from 'lodash';
import { ArmyUnit, Mage } from "shared/types/mage";
import { Unit } from "shared/types/unit";
import { UnitEffect, DamageEffect, HealEffect, BattleEffect } from 'shared/types/effects';
import { randomBM, randomInt } from './random';
import { isFlying, isRanged, hasAbility, hasHealing, hasRegeneration } from "./base/unit";
import { getSpellById, getItemById, getUnitById } from './base/references';
import { currentSpellLevel } from './magic';

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const DEBUG = true;
const NONE = -1;

export interface Combatant {
  mage: Mage,
  spellId: string,
  itemId: string,

  // Different than mage.army as you don't send all stacks
  army: ArmyUnit[], 
}

enum StackType {
  NORMAL,
  REINFORCEMENT,
  TEMPORARY
}

interface BattleStack {
  unit: Unit,
  size: number,

  stackType: StackType,
  role: string,

  isTarget: boolean,
  targetIdx: number,

  // Battle calcs
  accuracy: number,
  efficiency: number,
  sustainedDamage: number,
  loss: number,

  healingPoints: number,
  healingBuffer: number[],

  // For faster calculation
  netPower: number,
}

// Returns power modifiers
// - flyer
// - ranged
// - everything else
const getPowerModifier = (u: Unit) => {
  if (isFlying(u)) return  1.5 * 1.5;
  if (isRanged(u)) return 1.0;
  return 1.5;
};


/**
 * Returns the stacks in power ranking order
 *
 * As determined by primary attack type and unit abilities
 * - flying units have a 2.25 multiplier
 * - ground, none-ranged units have 1.5 multiplier
 * - ranged has 1.0 multipiler
 */
const prepareBattleStack = (army: ArmyUnit[], role: string) => {
  const battleStack: BattleStack[] = army.map(stack => {
    const u = getUnitById(stack.id);
    return {
      unit: u,
      size: stack.size,
      stackType: StackType.NORMAL,
      role,
      isTarget: false,
      targetIdx: NONE,
      accuracy: 30,
      efficiency: 100,
      sustainedDamage: 0,
      healingPoints: 0,
      healingBuffer: [],
      loss: 0,
      netPower: u.powerRank * stack.size
    }
  });

  // Initially sort by power
  return battleStack.sort((a, b) => {
    return b.netPower * getPowerModifier(b.unit) - a.netPower * getPowerModifier(a.unit);
  });
};


// Check if a can attack b
const canAttackPrimary = (a: Unit, b: Unit) => {
  if (isRanged(a) || isFlying(a)) return true;
  if (isFlying(b)) return false;
  return true;
}
const canAttackSecondary = (a: Unit, b: Unit) => {
  const isSecondaryRanged = a.secondaryAttackType.includes('ranged');
  if (isSecondaryRanged || isFlying(a)) return true;
  if (isFlying(b)) return false;
  return true;
}

const log = (...args: any) => {
  if (DEBUG === true) {
    console.log.apply(console, args);
  }
};

const calculateParing = (a: BattleStack[], b: BattleStack[]) => {
  log('');
  log('=== Calculate parings ===');
  // 1. Fnd viable targets with similar net power
  a.forEach((aStack, aIdx) => {
    log(`calculating by power`, aStack.unit.name);
    b.forEach((bStack, bIdx) => {
      if (aStack.targetIdx > -1 ) return;

      log('\tchecking target', bStack.unit.name);
      if ((bStack.netPower / aStack.netPower) <= 4.0 || aIdx === 0) {
        const canAttack = canAttackPrimary(aStack.unit, bStack.unit);
        log('\tCan attack', canAttack);
        if (canAttack && bStack.isTarget === false) {
          log('\tsetting to', bIdx);
          aStack.targetIdx = bIdx;
          bStack.isTarget = true;
        }
      }
    });
  });

  // 2. Match remaining units
  a.forEach((aStack, _aIdx) => {
    if (aStack.targetIdx > -1) return;
    log(`calculating by availability`, aStack.unit.name);
    b.forEach((bStack, bIdx) => {
      if (aStack.targetIdx > -1 ) return;
      log('\tchecking target', bStack.unit.name);
      const canAttack = canAttackPrimary(aStack.unit, bStack.unit);
      log('\tCan attack', canAttack);
      if (canAttack) {
        log('\tsetting to', bIdx);
        aStack.targetIdx = bIdx;
        bStack.isTarget = true;
      }
    });
  });

  // 3. Match possible targets for secondary-only attacks
  a.forEach((aStack, _aIdx) => {
    if (aStack.targetIdx > -1) return;
    log(`calculating by availability`, aStack.unit.name);
    b.forEach((bStack, bIdx) => {
      if (aStack.targetIdx > -1 ) return;
      log('\tchecking target', bStack.unit.name);
      const canAttack = canAttackSecondary(aStack.unit, bStack.unit);
      log('\tCan attack', canAttack);
      if (canAttack) {
        log('\tsetting to', bIdx);
        aStack.targetIdx = bIdx;
        bStack.isTarget = true;
      }
    });
  });
}


interface BattleOrder {
  side: string,
  position: number,
  attackType: string,
  attackInit: number
}

/**
 * Calculate the order of attacks for both sides.
 * First put both primary and secondary attack inits to a list, then shuffe
 * and re-sort
 */
const calcBattleOrders = (attackingArmy: BattleStack[], defendingArmy: BattleStack[]) => {
  let battleOrders: BattleOrder[] = [];

  // Helper
  const extractAttacks = (army: BattleStack[], side: string) => {
    for (let i = 0; i < army.length; i++) {
      const u = army[i];
      if (u.targetIdx === NONE) continue;

      if (u.unit.primaryAttackInit > 0) {
        battleOrders.push({
          side,
          position: i,
          attackType: 'primary',
          attackInit: u.unit.primaryAttackInit
        });
      }
      if (u.unit.secondaryAttackInit > 0) {
        battleOrders.push({
          side,
          position: i,
          attackType: 'secondary',
          attackInit: u.unit.secondaryAttackInit
        });
      }
    }
  }
  extractAttacks(attackingArmy, 'attacker');
  extractAttacks(defendingArmy, 'defender');

  battleOrders = _.shuffle(battleOrders);
  battleOrders = _.orderBy(battleOrders, d => -d.attackInit);
  return battleOrders;
}

const calcResistance = (u: Unit, attackTypes: string[]) => {
  let resist = 0;
  for (const at of attackTypes) {
    resist += u.attackResistances[at];
  }
  resist /= attackTypes.length;

  if (hasAbility(u, 'largeShield')) {
    resist += 50;
  }

  if (hasAbility(u, 'piercing')) {
    resist -= 10;
  }
  return Math.min(100, resist);
}

const calcDamageMultiplier = (attackingUnit: Unit, defendingUnit: Unit, attackType: string[]) => {
  let multiplier = 1.0;

  // Check weaknesses
  defendingUnit.abilities.forEach(ability => {
    if (ability.name === 'weakness') {
      const weakType = ability.extra as string;
      if (attackType.includes(weakType)) {
        multiplier *= 2.0;
      }
    }
  });

  if (hasAbility(defendingUnit, 'scales')) {
    multiplier *= 0.75;
  }
  return multiplier;
}

const calcDamageVariance = (attackType: String[]) => {
  let randomModifier = randomBM();
  if (attackType.includes('magic') || attackType.includes('psychic')) {
    randomModifier = 0.5;
  }
  return randomModifier;
}

const calcAccuracyModifier = (attackingUnit: Unit, defendingUnit: Unit) => {
  let modifier = 0;
  if (hasAbility(attackingUnit, 'clumsiness')) {
    modifier -= 10;
  }
  if (hasAbility(defendingUnit, 'swift')) {
    modifier -= 10;
  }
  if (hasAbility(defendingUnit, 'beauty')) {
    modifier -= 5;
  }
  if (hasAbility(defendingUnit, 'fear') && !hasAbility(attackingUnit, 'fear')) {
    modifier -= 15;
  }
  if (hasAbility(attackingUnit, 'marksmanship')) {
    modifier += 10;
  }
  return modifier;
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
const applyUnitEffect = (caster: Combatant, unitEffect: UnitEffect, affectedArmy: BattleStack[]) => {
  const casterMagic = caster.mage.magic;
  const casterSpellLevel = currentSpellLevel(caster.mage);

  Object.keys(unitEffect.attributeMap).forEach(attrKey => {
    const attr = unitEffect.attributeMap[attrKey];
    const fields = attrKey.split(',').map(d => d.trim());

    console.log(`processing ${fields}`);

    // Caster colour does not get this effect
    if (!attr.magic[casterMagic]) return;

    // Finally apply effects
    affectedArmy.forEach(stack => {
      const unit = stack.unit;
      const rule = attr.rule;
      let baseValue = attr.magic[casterMagic].value;
      let finalValue: any = null;

      fields.forEach(rawField => {
        // Resolve nesting
        let root = unit;
        let field = rawField;
        if (rawField.includes('.')) {
          const [t1, t2] = rawField.split('.'); 
          root = unit[t1];
          field = t2;
        }

        // Figure out the value to add
        if (rule === 'spellLevel') {
          finalValue = baseValue * casterSpellLevel;
        } else if (rule === 'spellLevelPercentage') {
          finalValue = baseValue * casterSpellLevel * root[field];
        } else if (rule === 'percentage') {
          finalValue = baseValue * root[field];
        } else { // add, remove
          finalValue = baseValue;
        }

        // Finally apply
        if (_.isArray(root[field])) {
          if (attr.has && root[field].includes(attr.has)) {
            root[field].push(finalValue);
          }
        } else {
          if (field === 'accuracy') {
            stack.accuracy += finalValue;
          } else if (field === 'efficiency') {
            stack.efficiency += finalValue;
          } else {
            root[field] += Math.floor(finalValue);
          }
        }
      });
    });
  });
};


/**
 * Apply direct damage to target stacks
 */
const applyDamageEffect = (caster: Combatant, damageEffect: DamageEffect, affectedArmy: BattleStack[]) => {
  const casterMagic = caster.mage.magic;
  const casterSpellLevel = currentSpellLevel(caster.mage);

  const damageType = damageEffect.damageType;
  let rawDamage = 0;

  if (!damageEffect.magic[casterMagic]) return;

  affectedArmy.forEach(stack => {
    const rule = damageEffect.rule;
    if (rule === 'spellLevel') {
      rawDamage = damageEffect.magic[casterMagic].value * casterSpellLevel;
    } else {
      rawDamage = damageEffect.magic[casterMagic].value;
    }

    const resistance = calcResistance(stack.unit, damageType);
    const damage = rawDamage * ((100 - resistance) / 100);
    const unitLoss = Math.floor(damage / stack.unit.hitPoints);
    
    console.log(`dealing rawDamage=${damage} actualDamage=${damage} units=${unitLoss}`);
  });
};


const applyHealEffect = (caster: Combatant, healEffect: HealEffect, affectedArmy: BattleStack[]) => {
  const casterMagic = caster.mage.magic;
  const casterSpellLevel = currentSpellLevel(caster.mage);
  const healType = healEffect.healType;
  const rule = healEffect.rule;

  let healBase = 0;
  if (rule === 'spellLevel') {
    healBase = healEffect.magic[casterMagic].value * casterSpellLevel;
  }

  affectedArmy.forEach(stack => {
    if (healType === 'points') {
      stack.healingPoints += stack.size * healBase;
    }
  });
};

/**
 * Entry point for casting battle spells. This ensures the correct caster and affected army
 * are in-place before handing off the actual calculation to helper effects functions.
 *
 * The stack attribute determines how the affected army is chosen, there are several options.
 * - random: If the spell has multiple effects, each effect targets a random stack
 * - randomSingle: A random stack is chosen and receives all effects. This is used to model 
 *   spells that have both UnitEffect and DamageEffect and wants to target the same unit.
 * - all: All stacks get all effects
 */
const battleSpell = (
  caster: Combatant,
  casterBattleStack: BattleStack[],
  defender: Combatant,
  defenderBattleStack: BattleStack[]) => {

  console.log('');
  console.group(`=== Spell ${caster.mage.name} : ${caster.spellId} ===`);

  const casterSpell = getSpellById(caster.spellId);

  casterSpell.effects.forEach(effect => {
    if (effect.effectType !== 'BattleEffect') return;

    const battleEffect = effect as BattleEffect;
    const army = battleEffect.target === 'self' ? casterBattleStack: defenderBattleStack;

    // TODO: filters
    const filteredArmy = army;
    const stackType = battleEffect.stack;

    let randomSingleIdx = -1;
    if (stackType === 'randomSingle') {
      randomSingleIdx = randomInt(filteredArmy.length);
    }

    for (let i = 0; i < battleEffect.effects.length; i++) {
      let affectedArmy: BattleStack[] = [];
      if (stackType === 'randomSingle') {
        affectedArmy = [filteredArmy[randomSingleIdx]];
      } else if (stackType === 'random') {
        let idx = randomInt(filteredArmy.length);
        affectedArmy = [filteredArmy[idx]];
      } else {
        affectedArmy = filteredArmy;
      }

      const eff = battleEffect.effects[i];
      console.log(`Applying effect ${i+1} (${eff.name}) to ${affectedArmy.map(d => d.unit.name)}`);

      if (eff.name === 'UnitEffect') {
        const unitEffect = eff as UnitEffect;
        applyUnitEffect(caster, unitEffect, affectedArmy);
      } else if (eff.name === 'DamageEffect') {
        const damageEffect = eff as DamageEffect;
        applyDamageEffect(caster, damageEffect, affectedArmy);
      } else if (eff.name === 'HealEffect') {
        const healEffect = eff as HealEffect;
        applyHealEffect(caster, healEffect, affectedArmy);
      }
    }
  });
  console.groupEnd();
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

  const casterItem = getItemById(caster.itemId);

  console.log('');
  console.group(`=== Item ${caster.mage.name} : ${caster.itemId} ===`);
  console.groupEnd();

  casterItem.effects.forEach(effect => {
    if (effect.effectType !== 'BattleEffect') return;

    const battleEffect = effect as BattleEffect;
    const army = battleEffect.target === 'self' ? casterBattleStack: defenderBattleStack;

    // TODO: filters
    const filteredArmy = army;
    const stackType = battleEffect.stack;

    let randomSingleIdx = -1;
    if (stackType === 'randomSingle') {
      randomSingleIdx = randomInt(filteredArmy.length);
    }

    for (let i = 0; i < battleEffect.effects.length; i++) {
      let affectedArmy: BattleStack[] = [];
      if (stackType === 'randomSingle') {
        affectedArmy = [filteredArmy[randomSingleIdx]];
      } else if (stackType === 'random') {
        let idx = randomInt(filteredArmy.length);
        affectedArmy = [filteredArmy[idx]];
      } else {
        affectedArmy = filteredArmy;
      }

      const eff = battleEffect.effects[i];
      console.log(`Applying effect ${i+1} (${eff.name}) to ${affectedArmy.map(d => d.unit.name)}`);

      if (eff.name === 'UnitEffect') {
        const unitEffect = eff as UnitEffect;
        applyUnitEffect(caster, unitEffect, affectedArmy);
      } else if (eff.name === 'DamageEffect') {
        const damageEffect = eff as DamageEffect;
        applyDamageEffect(caster, damageEffect, affectedArmy);
      }
    }
  });
}

// Debugging pretty print
const LPretty = (v: any, n: number = 20) => {
  const str = '' + v;
  return str + ' '.repeat(n - str.length);
};
const RPretty = (v: any, n: number = 10) => {
  const str = '' + v;
  return ' '.repeat(n - str.length) + str;
};


/**
 * Handles siege and regular battles. The battle phase goes as follows
 * - Prepare battle stacks from chosen armies from both sides, this is used to track progress
 * - Apply spells
 * - Apply items
 * - Calculate unit pairings
 * - Calculte battle order
**/
export const battle = (attackType: string, attacker: Combatant, defender: Combatant) => {
  console.log(`war ${attackType}`, attackType, attacker.army.length, defender.army.length);

  // Create mutable data for the battle
  const attackingArmy =  prepareBattleStack(attacker.army, 'attacker');
  const defendingArmy =  prepareBattleStack(defender.army, 'defender');

  ////////////////////////////////////////////////////////////////////////////////
  // TODO: 
  // 1. Enchantment modifiers
  // 2. Spell modifiers
  // 3. Item modifiers
  // 4. Hero effects
  ////////////////////////////////////////////////////////////////////////////////
  
  // Spells
  // TODO: check barriers and success
  if (attacker.spellId) {
    battleSpell(attacker, attackingArmy, defender, defendingArmy);
  }
  if (attacker.itemId) {
    battleItem(attacker, attackingArmy, defender, defendingArmy);
  }

  if (defender.spellId) {
    battleSpell(defender, defendingArmy, attacker, attackingArmy);
  }
  if (defender.itemId) {
    battleItem(defender, defendingArmy, attacker, attackingArmy);
  }

  // Find pairing
  calculateParing(attackingArmy, defendingArmy);
  calculateParing(defendingArmy, attackingArmy);

  // Sort out attacking order
  const battleOrders = calcBattleOrders(attackingArmy, defendingArmy);

  console.log('');
  console.log('=== Combat ===');
  console.log(`\tAttacker cast ${attacker.spellId}`);
  console.log(`\tAttacker use ${attacker.itemId}`);
  console.log(`\tDefender cast ${defender.spellId}`);
  console.log(`\tDefender use ${defender.itemId}`);

  console.log('=== Attacking army ===');
  console.log(
    LPretty('name'),
    RPretty('size'),
    RPretty('Attack'),
    RPretty('Extra'),
    RPretty('Counter'),
    RPretty('Hitpoints'),
    RPretty('Accuracy')
  );

  attackingArmy.forEach(stack => {
    console.log(
      LPretty(stack.unit.name),
      RPretty(stack.size),
      RPretty(stack.unit.primaryAttackPower),
      RPretty(stack.unit.secondaryAttackPower),
      RPretty(stack.unit.counterAttackPower),
      RPretty(stack.unit.hitPoints),
      RPretty(stack.accuracy)
    );
  });

  console.log('=== Defending army ===');
  console.log(
    LPretty('name'),
    RPretty('size'),
    RPretty('Attack'),
    RPretty('Extra'),
    RPretty('Counter'),
    RPretty('Hitpoints'),
    RPretty('Accuracy')
  );

  defendingArmy.forEach(stack => {
    console.log(
      LPretty(stack.unit.name),
      RPretty(stack.size),
      RPretty(stack.unit.primaryAttackPower),
      RPretty(stack.unit.secondaryAttackPower),
      RPretty(stack.unit.counterAttackPower),
      RPretty(stack.unit.hitPoints),
      RPretty(stack.accuracy)
    );
  });


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

    /////////// Primary //////////
    if (attackType === 'primary') {
      if (attackingStack.unit.primaryAttackInit < 1 || attackingStack.size <= 0) continue;

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

      // Accumulate or clear partial damage
      if (defenderUnitLoss > 0) { 
        defendingStack.sustainedDamage = 0;
      }
      defendingStack.sustainedDamage += (totalDamage % dUnit.hitPoints);
      defendingStack.size -= defenderUnitLoss;
      defendingStack.loss += defenderUnitLoss;

      // Counter attack
      if (aUnit.primaryAttackType.includes('paralyse')) {
        // Unit paralysed
      } else if (aUnit.primaryAttackType.includes('ranged')) {
        // Cannot counter ranged
      } else if (defendingStack.size > 0) {
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

        // Accumulate or clear partial damage
        if (attackerUnitLoss > 0) { 
          attackingStack.sustainedDamage = 0;
        }
        attackingStack.sustainedDamage += (totalDamage % aUnit.hitPoints);
        attackingStack.size -= attackerUnitLoss;
        attackingStack.loss += attackerUnitLoss;
      }
    }


    /////////// Secondary //////////
    if (attackType === 'secondary') {
      if (attackingStack.unit.secondaryAttackInit < 1 || attackingStack.size <= 0) continue;

      let accuracy = attackingStack.accuracy + calcAccuracyModifier(aUnit, dUnit);
      let resistance = calcResistance(dUnit, aUnit.primaryAttackType);
      let damageVariance = calcDamageVariance(aUnit.secondaryAttackType);
      let damageMultiplier = calcDamageMultiplier(aUnit, dUnit, aUnit.secondaryAttackType);

      let damage = aUnit.primaryAttackPower *
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
  console.log('');
  console.log('=== Post battle attacker ===');
  attackingArmy.forEach(stack => {
    if (stack.healingPoints > 0 && stack.loss > 0) {
      let unitsHealed = Math.floor(stack.healingPoints / stack.unit.hitPoints);
      if (unitsHealed >= stack.loss) {
        unitsHealed = stack.loss;
      }
      stack.loss -= unitsHealed;
      stack.size += unitsHealed;
      console.log(`healing ${stack.unit.name} = ${unitsHealed}`);
    }
    if (hasHealing(stack.unit)) {
      stack.healingBuffer.push(30);
    }
    if (hasRegeneration(stack.unit)) {
      stack.healingBuffer.push(20);
    }
    if (stack.healingBuffer.length > 0 && stack.loss > 0) {
      let heal = 1.0;
      stack.healingBuffer.forEach(hValue => {
        heal = heal * (100 - hValue) / 100;
      });
      heal = 1 - heal;

      let unitsHealed = Math.floor(heal * stack.loss);
      if (unitsHealed >= stack.loss) {
        unitsHealed = stack.loss;
      }
      stack.loss -= unitsHealed;
      stack.size += unitsHealed;
      console.log(`healing ${stack.unit.name} = ${unitsHealed}`);
    }
  });

  // Defender healing
  console.log('');
  console.log('=== Post battle defender ===');
  defendingArmy.forEach(stack => {
    if (stack.healingPoints > 0 && stack.loss > 0) {
      let unitsHealed = Math.floor(stack.healingPoints / stack.unit.hitPoints);
      if (unitsHealed >= stack.loss) {
        unitsHealed = stack.loss;
      }
      stack.loss -= unitsHealed;
      stack.size += unitsHealed;
      console.log(`healing ${stack.unit.name} = ${unitsHealed}`);
    }
    if (hasHealing(stack.unit)) {
      stack.healingBuffer.push(30);
    }
    if (hasRegeneration(stack.unit)) {
      stack.healingBuffer.push(20);
    }
    if (stack.healingBuffer.length > 0 && stack.loss > 0) {
      let heal = 1.0;
      stack.healingBuffer.forEach(hValue => {
        heal = heal * (100 - hValue) / 100;
      });
      heal = 1 - heal;

      let unitsHealed = Math.floor(heal * stack.loss);
      if (unitsHealed >= stack.loss) {
        unitsHealed = stack.loss;
      }
      stack.loss -= unitsHealed;
      stack.size += unitsHealed;
      console.log(`healing ${stack.unit.name} = ${unitsHealed}`);
    }
  });


  // Calculate combat result
  console.log('');
  console.log('=== Attacker summary ===');
  let attackerPowerLoss = 0;
  attackingArmy.forEach(stack => {
    const np = stack.unit.powerRank * stack.loss;
    attackerPowerLoss += np;
    console.log('\t', stack.unit.name, stack.loss, `(net power = ${np})`);
  });
  console.log('');
  console.log('Total loss', attackerPowerLoss);
  console.log('');

  console.log('=== Defender summary ===');
  let defenderPowerLoss = 0;
  defendingArmy.forEach(stack => {
    const np = stack.unit.powerRank * stack.loss;
    attackerPowerLoss += np;
    console.log('\t', stack.unit.name, stack.loss, `(net power = ${np})`);
  });
  console.log('');
  console.log('Total loss', attackerPowerLoss);
  console.log('');
}
