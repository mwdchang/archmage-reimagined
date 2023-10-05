import _ from 'lodash';
import { ArmyUnit, Mage } from "shared/types/mage";
import { Unit, UnitAbility } from "shared/types/unit";
import { UnitEffect, DamageEffect, HealEffect, BattleEffect } from 'shared/types/effects';
import { randomBM, randomInt } from './random';
import { isFlying, isRanged, hasAbility, hasHealing, hasRegeneration } from "./base/unit";
import { getSpellById, getItemById, getUnitById } from './base/references';
import { currentSpellLevel } from './magic';
import { LPretty, RPretty } from './util';
import { totalLand } from './base/mage';

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

export interface BattleReport {
  timestamp: number,
  attackType: string,
  attacker: {
    id: number,
    spellId: string | null,
    itemId: string | null,
    army: BattleStack[],

    startingNetPower: number,
    lossNetPower: number
  }
  defender: {
    id: number,
    spellId: string | null,
    itemId: string | null,
    army: BattleStack[]

    startingNetPower: number,
    lossNetPower: number
  },

  preBattleLogs: any[],
  battleLogs: any[],
  postBattleLogs: any[],
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

  // Temporary buffer to sort out conflicting effects from items/spells
  addedAbilities: UnitAbility[],
  removedAbilities: UnitAbility[],

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
          finalValue = baseValue * casterSpellLevel * originalRoot[field];
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

// TODO
export interface BattleOptions {
  useFortBonus: boolean,
  useEnchantments: boolean
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
  // - Enchantment modifiers
  // - Hero effects
  ////////////////////////////////////////////////////////////////////////////////
  

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
    timestamp: Date.now(),
    attackType: attackType,
    attacker: {
      id: attacker.mage.id,
      spellId: attacker.spellId,
      itemId: attacker.itemId,
      army: [],
      startingNetPower: 0,
      lossNetPower: 0
    },
    defender: {
      id: defender.mage.id,
      spellId: defender.spellId,
      itemId: defender.itemId,
      army: [],
      startingNetPower: 0,
      lossNetPower: 0
    },
    preBattleLogs: [],
    battleLogs: [],
    postBattleLogs: []
  };


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

  // TODO: Prebattle logs

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
      (stack.unit.abilities.map(d => d.name))
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
      (stack.unit.abilities.map(d => d.name))
    );
  });

  battleReport.attacker.army = _.clone(attackingArmy);
  battleReport.defender.army = _.clone(defendingArmy);


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
  let attackerStartingNP = 0;
  let defenderStartingNP = 0;
  attackingArmy.forEach(stack => attackerStartingNP += stack.netPower);
  defendingArmy.forEach(stack => defenderStartingNP += stack.netPower);

  battleReport.attacker.startingNetPower = attackerStartingNP;
  battleReport.defender.startingNetPower = defenderStartingNP;

  console.log('');
  console.log('=== Attacker summary ===');
  let attackerPowerLoss = 0;
  attackingArmy.forEach(stack => {
    const np = stack.unit.powerRank * stack.loss;
    attackerPowerLoss += np;
    console.log('\t', stack.unit.name, stack.loss, `(net power = ${np})`);
  });
  console.log('');
  console.log('Total loss', attackerPowerLoss, (100 * attackerPowerLoss/attackerStartingNP).toFixed(2));
  console.log('');

  console.log('=== Defender summary ===');
  let defenderPowerLoss = 0;
  defendingArmy.forEach(stack => {
    const np = stack.unit.powerRank * stack.loss;
    defenderPowerLoss += np;
    console.log('\t', stack.unit.name, stack.loss, `(net power = ${np})`);
  });
  console.log('');
  console.log('Total loss', defenderPowerLoss, (100 * defenderPowerLoss/defenderStartingNP).toFixed(2));
  console.log('');

  battleReport.attacker.lossNetPower = attackerPowerLoss;
  battleReport.defender.lossNetPower = defenderPowerLoss;

  // Calculate winner
  // if (attackerPowerLoss < defenderPowerLoss && defenderPowerLoss >= 0.1 * defenderStartingNP) {
  //   console.log(`Attacker ${attacker.mage.name} won the battle `);
  // } else {
  //   console.log(`Defener ${defender.mage.name} won the battle `);
  // }
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1');
  console.log(battleReport);

  return battleReport;
}

export const resolveBattleAftermath = (attackType: string, attacker: Mage, defender: Mage, battleReport: BattleReport) => {
  const attackerStartingNP = battleReport.attacker.startingNetPower;
  const attackerLossNP = battleReport.attacker.lossNetPower;

  const defenderStartingNP = battleReport.defender.startingNetPower;
  const defenderLossNP = battleReport.defender.lossNetPower;

  const landModifier = 0.1;

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

    let librariesLost = Math.floor(defender.libraries * landModifier);
    librariesLost = Math.min(librariesLost, landsToDestroy);
    landsToDestroy -= librariesLost;
    defender.libraries -= librariesLost;

    let nodesLost = Math.floor(defender.nodes * landModifier);
    nodesLost = Math.min(nodesLost, landsToDestroy);
    landsToDestroy -= nodesLost;
    defender.nodes -= librariesLost;

    // Resolve any spill overs
    while (landsToDestroy > 0 && defender.farms > 0) { defender.farms--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.towns > 0) { defender.towns--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.workshops > 0) { defender.workshops--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.barracks > 0) { defender.barracks--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.libraries > 0) { defender.libraries; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.nodes > 0) { defender.nodes--; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.barriers > 0) { defender.barriers; landsToDestroy--; }
    while (landsToDestroy > 0 && defender.wilderness > 0) { defender.wilderness; landsToDestroy--; }

    console.log('!! lost', landTaken);
    console.log('!! forts lost', fortsLost);
    console.log('!! wilderness lost', wildernessLost);
    console.log('!! ...', landsToDestroy);

  } else {
    console.log('defender defended');
  }
}
