import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ArmyUnit, Enchantment, Mage } from "shared/types/mage";
import { Unit } from "shared/types/unit";
import { UnitEffect, DamageEffect, HealEffect, BattleEffect } from 'shared/types/effects';
import { randomBM, randomInt } from './random';
import { isFlying, isRanged, hasAbility, hasHealing, hasRegeneration } from "./base/unit";
import { getSpellById, getItemById, getUnitById, getMaxSpellLevels } from './base/references';
import { currentSpellLevel } from './magic';
import { LPretty, RPretty } from './util';
import { totalLand } from './base/mage';
import { BattleReport, BattleStack } from 'shared/types/battle';

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const DEBUG = true;
const NONE = -1;

export interface Combatant {
  mage: Mage,
  spellId: string,
  itemId: string,

  // Army sent into battle, this is different than mage.army as you don't send all stacks
  army: ArmyUnit[], 
}

export interface EffectOrigin {
  id: number,
  magic: string,
  spellLevel: number
}

enum StackType {
  NORMAL,
  REINFORCEMENT,
  TEMPORARY
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

      addedAbilities: [],
      removedAbilities: [],

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

  if (hasAbility(u, 'largeShield') && attackTypes.includes('ranged')) {
    resist += 50;
  }

  if (hasAbility(u, 'piercing')) {
    resist -= 10;
  }
  return Math.min(100, resist);
}

const calcDamageMultiplier = (attackingUnit: Unit, defendingUnit: Unit, attackType: string[]) => {
  let multiplier = 1.0;


  // TODO: racial enemy

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
const applyUnitEffect = (
  // caster: Combatant, 
  origin: EffectOrigin,
  unitEffect: UnitEffect, 
  affectedArmy: BattleStack[]
) => {
  const casterMagic = origin.magic;
  const casterSpellLevel = origin.spellLevel;
  const casterMaxSpellLevel = getMaxSpellLevels()[casterMagic];

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
        if (rule === 'spellLevel') {
          finalValue = baseValue * casterSpellLevel;
        } else if (rule === 'spellLevelPercentage') {
          const ratio = casterSpellLevel / casterMaxSpellLevel;
          finalValue = baseValue * ratio * originalRoot[field];
        } else if (rule === 'percentage') {
          finalValue = baseValue * originalRoot[field];
        } else {
          finalValue = baseValue;
        }

        // Finally apply
        if (_.isArray(root[field])) {
          // Resolve this later
          if (field === 'abilities') {
            if (rule === 'add') {
              stack.addedAbilities.push(finalValue);
            } else {
              stack.removedAbilities.push(finalValue);
            }
          } else {
            if (attr.has && root[field].includes(attr.has)) {
              root[field].push(finalValue);
            }
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
const applyDamageEffect = (
  origin: EffectOrigin,
  damageEffect: DamageEffect, 
  affectedArmy: BattleStack[]
) => {
  const casterMagic = origin.magic;
  const casterSpellLevel = origin.spellLevel;

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


const applyHealEffect = (
  origin: EffectOrigin,
  healEffect: HealEffect, 
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
 * - randomSingle: A random stack is chosen and receives all effects. This is used to model 
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
  const casterSpell = enchantment ? 
    getSpellById(enchantment.spellId) :
    getSpellById(caster.spellId);

  console.log('');
  console.group(`=== Spell ${caster.mage.name} : ${caster.spellId} ===`);

  let effectOrigin: EffectOrigin = {
    id: caster.mage.id,
    magic: caster.mage.magic,
    spellLevel: currentSpellLevel(caster.mage)
  };

  // Override default if calculating enchantment
  if (enchantment) {
    effectOrigin.id = enchantment.casterId;
    effectOrigin.magic = enchantment.casterMagic;
    effectOrigin.spellLevel = enchantment.spellLevel;
  }

  casterSpell.effects.forEach(effect => {
    if (effect.effectType !== 'BattleEffect') return;

    const battleEffect = effect as BattleEffect;
    const army = battleEffect.target === 'self' ? casterBattleStack: defenderBattleStack;

    const filterKeys = Object.keys(battleEffect.filter || {});
    const filteredArmy = army.filter(stack => {
      let match = true;
      const unit = stack.unit;

      for (const key of filterKeys) {
        if (match === false) break;
        const matchValues = battleEffect.filter[key];

        if (key === 'abilities') {
          const len = matchValues.filter((val: any) => {
            return unit.abilities.find(d => d.name === val);
          }).length;
          if (len === 0) match = false;
        } else if (key.includes('.')) {
          // TODO: filters
        } else {
          console.log('hihihi', key, matchValues);
          const len = matchValues.filter((val: any) => {
            return unit[key].includes(val);
          }).length;
          if (len === 0) match = false;
        }
      }
      return match;
    });


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

      if (battleEffect.target !== 'self') {
        affectedArmy = affectedArmy.filter(stack => {
          const roll = Math.random() * 100;
          if (roll > stack.unit.spellResistances[casterSpell.magic]) {
            return true;
          }
          console.log(`${stack.unit.name} resisted ${stack.unit.spellResistances[casterSpell.magic]}`);
          return false;
        });
      }

      const eff = battleEffect.effects[i];
      console.log(`Applying effect ${i+1} (${eff.name}) to ${affectedArmy.map(d => d.unit.name)}`);

      if (eff.name === 'UnitEffect') {
        const unitEffect = eff as UnitEffect;
        applyUnitEffect(effectOrigin, unitEffect, affectedArmy);
      } else if (eff.name === 'DamageEffect') {
        const damageEffect = eff as DamageEffect;
        applyDamageEffect(effectOrigin, damageEffect, affectedArmy);
      } else if (eff.name === 'HealEffect') {
        const healEffect = eff as HealEffect;
        applyHealEffect(effectOrigin, healEffect, affectedArmy);
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

  const effectOrigin: EffectOrigin = {
    id: caster.mage.id,
    magic: caster.mage.magic,
    spellLevel: currentSpellLevel(caster.mage)
  };

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
        applyUnitEffect(effectOrigin, unitEffect, affectedArmy);
      } else if (eff.name === 'DamageEffect') {
        const damageEffect = eff as DamageEffect;
        applyDamageEffect(effectOrigin, damageEffect, affectedArmy);
      }
    }
  });
}


/**
 * Resolve conflicting abilities, e.g. a unit can gain flying and lose flying. Any negative
 * cancels out all positive.
 */
const resolveUnitAbilities = (stack: BattleStack[]) => {
  stack.forEach(stack => {
    const addedAbilities = stack.addedAbilities;
    const removedAbilities = stack.removedAbilities;

    // 1. jdd first, so negatives can cancel
    for (let i = 0; i < addedAbilities.length; i++) {
      const ability = addedAbilities[i];
      if (!stack.unit.abilities.find(d => d.name === ability.name)) {
        stack.unit.abilities.push(ability);
      }
    }
    
    // 2. then remove if there are conflicts
    for (let i = 0; i < removedAbilities.length; i++) {
      const ability = removedAbilities[i];
      if (stack.unit.abilities.find(d => d.name === ability.name)) {
        stack.unit.abilities = _.remove(stack.unit.abilities, d => d.name === ability.name);
      }
    }
  });
}

// For debugging different scenarios
export interface BattleOptions {
  useFortBonus: boolean,
  useEnchantments: boolean,
  useUnlimitedResources: boolean,
}

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
  attacker.mage.enchantments.forEach(enchant => {
    battleSpell(
      attacker,
      attackingArmy,
      defender,
      defendingArmy,
      enchant);
  });
  defender.mage.enchantments.forEach(enchant => {
    battleSpell(
      defender,
      defendingArmy,
      attacker,
      attackingArmy,
      enchant);
  });


  // Apply fort bonus to defender
  const defenderLand = totalLand(defender.mage);
  const defenderForts = defender.mage.forts;
  const fortsMin = 0.0067;
  const fortsMax = 0.0250;
  const fortsRatio = Math.min((defenderForts / defenderLand), fortsMax);

  let base = attackType === 'regular' ? 10 : 20;
  if (attackType === 'regular' && fortsRatio > fortsMin) {
    const additionalBonus = 27.5 * (fortsRatio - fortsMin) / (fortsMax - fortsMin);
    base += additionalBonus;
  } 

  if (attackType === 'siege' && fortsRatio > fortsMin) {
    const additionalBonus = 55 * (fortsRatio - fortsMin) / (fortsMax - fortsMin);
    base += additionalBonus;
  }
  defendingArmy.forEach(stack => {
    stack.unit.hitPoints += Math.floor((base / 100) * stack.unit.hitPoints);
  });

  const battleReport: BattleReport = {
    id: uuidv4(),
    timestamp: Date.now(),
    attackType: attackType,
    attacker: {
      id: attacker.mage.id,
      spellId: attacker.spellId,
      itemId: attacker.itemId,
      army: [],
      armyLosses: [],
      startingNetPower: 0,
      lossNetPower: 0
    },
    defender: {
      id: defender.mage.id,
      spellId: defender.spellId,
      itemId: defender.itemId,
      army: [],
      armyLosses: [],
      startingNetPower: 0,
      lossNetPower: 0
    },

    // Tracking spells, heros, ... etc
    preBattleLogs: [],

    // Tracking engagement
    battleLogs: [],

    // Units lost/gained
    postBattleLogs: [],

    // Summary
    summaryLogs: []
  };


  // Spells
  // TODO: check barriers and success
  if (attacker.spellId) {
    battleSpell(attacker, attackingArmy, defender, defendingArmy, null);
    battleReport.preBattleLogs.push(`${attacker.mage.name}(#${attacker.mage.id}) cast ${attacker.spellId}`);
  }
  if (attacker.itemId) {
    if (attacker.mage.items[attacker.itemId] > 0) {
      attacker.mage.items[attacker.itemId] --;
      battleItem(attacker, attackingArmy, defender, defendingArmy);
      battleReport.preBattleLogs.push(`${attacker.mage.name}(#${attacker.mage.id}) use ${attacker.itemId}`);
    }
  }

  if (defender.spellId) {
    battleSpell(defender, defendingArmy, attacker, attackingArmy, null);
    battleReport.preBattleLogs.push(`${defender.mage.name}(#${defender.mage.id}) cast ${defender.spellId}`);
  }
  if (defender.itemId) {
    if (defender.mage.items[defender.itemId] > 0) {
      defender.mage.items[defender.itemId] --;
      battleItem(defender, defendingArmy, attacker, attackingArmy);
      battleReport.preBattleLogs.push(`${defender.mage.name}(#${defender.mage.id}) use ${defender.itemId}`);
    }
  }

  // Resolving contradicting ability states
  resolveUnitAbilities(attackingArmy);
  resolveUnitAbilities(defendingArmy);

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
    RPretty('Accuracy'),
    LPretty('Abilities'),
  );

  attackingArmy.forEach(stack => {
    console.log(
      LPretty(stack.unit.name),
      RPretty(stack.size),
      RPretty(stack.unit.primaryAttackPower),
      RPretty(stack.unit.secondaryAttackPower),
      RPretty(stack.unit.counterAttackPower),
      RPretty(stack.unit.hitPoints),
      RPretty(stack.accuracy),
      JSON.stringify((stack.unit.abilities.map(d => d.name)))
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
    RPretty('Accuracy'),
    LPretty('Abilities'),
  );

  defendingArmy.forEach(stack => {
    console.log(
      LPretty(stack.unit.name),
      RPretty(stack.size),
      RPretty(stack.unit.primaryAttackPower),
      RPretty(stack.unit.secondaryAttackPower),
      RPretty(stack.unit.counterAttackPower),
      RPretty(stack.unit.hitPoints),
      RPretty(stack.accuracy),
      JSON.stringify((stack.unit.abilities.map(d => d.name)))
    );
  });

  // Snapshot the army for reporting before engagement starts
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
      battleReport.battleLogs.push(`${attackingMage.name}(#${attackingMage.id})'s ${attackingStack.unit.name} attaced ${defendingMage.name}(#${defendingMage.id})'s ${defendingStack.unit.name}`)
      battleReport.battleLogs.push(`${attackingMage.name}(#${attackingMage.id})'s ${attackingStack.unit.name} slew ${defendingMage.name}(#${defendingMage.id})'s ${defenderUnitLoss} ${defendingStack.unit.name}`)

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
        battleReport.battleLogs.push(`${attackingMage.name}(#${attackingMage.id})'s ${attackingStack.unit.name} attaced ${defendingMage.name}(#${defendingMage.id})'s ${defendingStack.unit.name} again`)
        battleReport.battleLogs.push(`${attackingMage.name}(#${attackingMage.id})'s ${attackingStack.unit.name} slew ${defendingMage.name}(#${defendingMage.id})'s ${defenderUnitLoss} ${defendingStack.unit.name}`)

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

        battleReport.battleLogs.push(`${defendingMage.name}(#${defendingMage.id})'s ${defendingStack.unit.name} struck back ${attackingMage.name}(#${attackingMage.id})'s ${attackingStack.unit.name}`)
        battleReport.battleLogs.push(`${defendingMage.name}(#${defendingMage.id})'s ${defendingStack.unit.name} slew ${attackingMage.name}(#${attackingMage.id})'s ${attackerUnitLoss} ${attackingStack.unit.name}`)


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
      battleReport.battleLogs.push(`${attackingMage.name}(#${attackingMage.id})'s ${attackingStack.unit.name} attaced ${defendingMage.name}(#${defendingMage.id})'s ${defendingStack.unit.name}`)
      battleReport.battleLogs.push(`${attackingMage.name}(#${attackingMage.id})'s ${attackingStack.unit.name} slew ${defendingMage.name}(#${defendingMage.id})'s ${defenderUnitLoss} ${defendingStack.unit.name}`)

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
    battleReport.postBattleLogs.push(`${attacker.mage.name}(#${attacker.mage.id})'s ${stack.loss} ${stack.unit.name} were slain during battle`);

    if (stack.size <= 0) return;

    if (stack.healingPoints > 0 && stack.loss > 0) {
      let unitsHealed = Math.floor(stack.healingPoints / stack.unit.hitPoints);
      if (unitsHealed >= stack.loss) {
        unitsHealed = stack.loss;
      }
      stack.loss -= unitsHealed;
      stack.size += unitsHealed;
      console.log(`healing ${stack.unit.name} = ${unitsHealed}`);
      battleReport.postBattleLogs.push(`${attacker.mage.name}(#${attacker.mage.id})'s ${unitsHealed} ${stack.unit.name} are resurrected from death`);
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
      battleReport.postBattleLogs.push(`${attacker.mage.name}(#${attacker.mage.id})'s ${unitsHealed} ${stack.unit.name} are resurrected from death`);
    }
  });

  // Defender healing
  console.log('');
  console.log('=== Post battle defender ===');
  defendingArmy.forEach(stack => {
    battleReport.postBattleLogs.push(`${defender.mage.name}(#${defender.mage.id})'s ${stack.loss} ${stack.unit.name} were slain during battle`);

    if (stack.size <= 0) return;

    if (stack.healingPoints > 0 && stack.loss > 0) {
      let unitsHealed = Math.floor(stack.healingPoints / stack.unit.hitPoints);
      if (unitsHealed >= stack.loss) {
        unitsHealed = stack.loss;
      }
      stack.loss -= unitsHealed;
      stack.size += unitsHealed;
      console.log(`healing ${stack.unit.name} = ${unitsHealed}`);
      battleReport.postBattleLogs.push(`${defender.mage.name}(#${defender.mage.id})'s ${unitsHealed} ${stack.unit.name} are resurrected from death`);
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
      battleReport.postBattleLogs.push(`${defender.mage.name}(#${defender.mage.id})'s ${unitsHealed} ${stack.unit.name} are resurrected from death`);
    }
  });

  // Calculate combat result
  let attackerStartingNP = 0;
  let defenderStartingNP = 0;
  attackingArmy.forEach(stack => attackerStartingNP += stack.netPower);
  defendingArmy.forEach(stack => defenderStartingNP += stack.netPower);

  battleReport.attacker.startingNetPower = attackerStartingNP;
  battleReport.defender.startingNetPower = defenderStartingNP;

  console.log('');
  console.log('=== Attacker summary ===');
  let attackerPowerLoss = 0;
  let attackerUnitLoss = 0;
  attackingArmy.forEach(stack => {
    const np = stack.unit.powerRank * stack.loss;
    attackerPowerLoss += np;
    attackerUnitLoss += stack.loss;
    console.log('\t', stack.unit.name, stack.loss, `(net power = ${np})`);
  });
  console.log('');
  console.log('Total loss', attackerPowerLoss, (100 * attackerPowerLoss/attackerStartingNP).toFixed(2));
  console.log('');

  console.log('=== Defender summary ===');
  let defenderPowerLoss = 0;
  let defenderUnitLoss = 0;
  defendingArmy.forEach(stack => {
    const np = stack.unit.powerRank * stack.loss;
    defenderPowerLoss += np;
    defenderUnitLoss += stack.loss;
    console.log('\t', stack.unit.name, stack.loss, `(net power = ${np})`);
  });
  console.log('');
  console.log('Total loss', defenderPowerLoss, (100 * defenderPowerLoss/defenderStartingNP).toFixed(2));
  console.log('');

  battleReport.attacker.lossNetPower = attackerPowerLoss;
  battleReport.defender.lossNetPower = defenderPowerLoss;


  battleReport.summaryLogs.push(`${attacker.mage.name}(#${attacker.mage.id}) lost ${attackerUnitLoss} units`);
  battleReport.summaryLogs.push(`${attacker.mage.name}(#${attacker.mage.id}) lost ${attackerPowerLoss} power`);

  battleReport.summaryLogs.push(`${defender.mage.name}(#${defender.mage.id}) lost ${defenderUnitLoss} units`);
  battleReport.summaryLogs.push(`${defender.mage.name}(#${defender.mage.id}) lost ${defenderPowerLoss} power`);

  battleReport.attacker.armyLosses = attackingArmy.map(d => ({id: d.unit.id, size: d.size}));
  battleReport.defender.armyLosses = defendingArmy.map(d => ({id: d.unit.id, size: d.size}));

  return battleReport;
}


/**
 * Resolves the battle aftermath
 *
 * - update land lost and gained
 * - update army compositions
 */
export const resolveBattleAftermath = (attackType: string, attacker: Mage, defender: Mage, battleReport: BattleReport) => {
  const attackerStartingNP = battleReport.attacker.startingNetPower;
  const attackerLossNP = battleReport.attacker.lossNetPower;

  const defenderStartingNP = battleReport.defender.startingNetPower;
  const defenderLossNP = battleReport.defender.lossNetPower;

  const landModifier = 0.1;
  const attackerGain = 0.33;

  if (attackerLossNP < defenderLossNP && defenderLossNP >= 0.1 * defenderStartingNP) {
    console.log(`Attacker ${attacker.name} won the battle `);

    // Get total number of unit remaining
    let defenderLand = totalLand(defender);
    let unitsRemaining = 0;
    battleReport.attacker.army.forEach(stack => {
      if (stack.size > 0) unitsRemaining += stack.size;
    });

    // Need 50 units to take an acre, up to max of 10%
    let landTaken = Math.ceil(Math.min(landModifier * defenderLand, unitsRemaining / 50));
    let landsToDestroy = landTaken; 

    // Forts, say 1500 units to take a fort 
    let maxFortTaken = Math.floor(unitsRemaining / 1500);
    const fortsLost = Math.floor(Math.min(1 + 0.1 * defender.forts, maxFortTaken));
    landsToDestroy -= fortsLost;
    defender.forts -= fortsLost;

    let wildernessLost = Math.floor(defender.wilderness * landModifier);
    wildernessLost = Math.min(wildernessLost, landsToDestroy);
    landsToDestroy -= wildernessLost;
    defender.wilderness -= wildernessLost;

    let farmsLost = Math.floor(defender.farms * landModifier);
    farmsLost = Math.min(farmsLost, landsToDestroy);
    landsToDestroy -= farmsLost;
    defender.farms -= farmsLost;

    let townsLost = Math.floor(defender.towns * landModifier);
    townsLost = Math.min(townsLost, landsToDestroy);
    landsToDestroy -= townsLost;
    defender.farms -= townsLost;

    let workshopsLost = Math.floor(defender.workshops * landModifier);
    workshopsLost = Math.min(workshopsLost, landsToDestroy);
    landsToDestroy -= workshopsLost;
    defender.workshops -= workshopsLost;

    let barracksLost = Math.floor(defender.barracks * landModifier);
    barracksLost = Math.min(barracksLost, landsToDestroy);
    landsToDestroy -= barracksLost;
    defender.barracks -= barracksLost;

    let barriersLost = Math.floor(defender.barriers * landModifier);
    barriersLost = Math.min(barriersLost, landsToDestroy);
    landsToDestroy -= barriersLost;
    defender.barriers -= barriersLost;

    let guildsLost = Math.floor(defender.guilds * landModifier);
    guildsLost = Math.min(guildsLost, landsToDestroy);
    landsToDestroy -= guildsLost;
    defender.guilds -= guildsLost;

    let nodesLost = Math.floor(defender.nodes * landModifier);
    nodesLost = Math.min(nodesLost, landsToDestroy);
    landsToDestroy -= nodesLost;
    defender.nodes -= guildsLost;

    // Resolve any spill overs
    while (landsToDestroy > 0 && defender.farms > 0) { defender.farms--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.towns > 0) { defender.towns--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.workshops > 0) { defender.workshops--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.barracks > 0) { defender.barracks--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.guilds > 0) { defender.guilds; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.nodes > 0) { defender.nodes--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.barriers > 0) { defender.barriers; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.wilderness > 0) { defender.wilderness; landsToDestroy--; }

    // Land transfer to attacker
    let winnerLand = Math.ceil(landTaken * attackerGain);
    let reportLandGain = winnerLand;
    console.log('attacker gets', winnerLand);

    let fortsGained = Math.ceil(fortsLost * attackerGain * 0.5);
    attacker.forts += fortsGained;
    winnerLand -= fortsGained;

    let farmsGained = Math.ceil(farmsLost * attackerGain * Math.random() * 0.5);
    attacker.farms += farmsGained;
    winnerLand -= farmsGained;

    let townsGained = Math.ceil(townsLost * attackerGain * Math.random() * 0.5);
    attacker.towns += townsGained;
    winnerLand -= townsGained;

    let workshopsGained = Math.ceil(workshopsLost * attackerGain * Math.random() * 0.5);
    attacker.workshops += workshopsGained;
    winnerLand -= workshopsGained;

    let barracksGained = Math.ceil(barracksLost * attackerGain * Math.random() * 0.5);
    attacker.barracks += barracksGained;
    winnerLand -= barracksGained;

    let nodesGained = Math.ceil(nodesLost * attackerGain * Math.random() * 0.5);
    attacker.nodes += nodesGained;
    winnerLand -= nodesGained;

    let guildsGained = Math.ceil(guildsLost * attackerGain * Math.random() * 0.5);
    attacker.guilds += guildsGained;
    winnerLand -= guildsGained;

    let barriersGaiend = Math.ceil(barriersLost * attackerGain * Math.random() * 0.25);
    attacker.barriers += barriersGaiend;
    winnerLand -= barriersGaiend;

    attacker.wilderness += winnerLand;


    const t = attackType === 'siege' ? 'sieged' : 'attacked'; 
    battleReport.summaryLogs.push(`${attacker.name} (#${attacker.id}) ${t} ${defender.name} (#${defender.id})'s kingdom`);
    battleReport.summaryLogs.push(`The attack was successful and ${attacker.name} (#${attacker.id}) gained ${reportLandGain} land.`);
  } else {
    console.log('defender defended');
    const t = attackType === 'siege' ? 'sieged' : 'attacked'; 
    battleReport.summaryLogs.push(`${attacker.name} (#${attacker.id}) ${t} ${defender.name} (#${defender.id})'s kingdom`);
    battleReport.summaryLogs.push(`The attack failed and achieved nothing`);
  }

  console.log('updating armies');

  // Handle units
  const attackerLosses = battleReport.attacker.armyLosses;
  attackerLosses.forEach(stack => {
    const f = attacker.army.find(d => {
      return d.id === stack.id
    })
    if (f) {
      f.size = stack.size;
    }
  });
  attacker.army = attacker.army.filter(d => d.size > 0);

  const defenderLosses = battleReport.defender.armyLosses;
  defenderLosses.forEach(stack => {
    defender.army.find(d => d.id === stack.id).size = stack.size;
  });
  defender.army = defender.army.filter(d => d.size > 0);
}


