import _ from 'lodash';
import { ArmyUnit, Mage } from "shared/types/mage";
import { Unit } from "shared/types/unit";
import { UnitEffect, DamageEffect, BattleEffect } from 'shared/types/effects';
import { randomBM, randomInt } from './random';
import { getUnitById, isFlying, isRanged, hasAbility } from "./army";
import { getSpellById } from './magic';

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


// Returns the stacks in ranking order
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
  a.forEach((aStack, _aIdx) => {
    log(`calculating by power`, aStack.unit.name);
    b.forEach((bStack, bIdx) => {
      if (aStack.targetIdx > -1 ) return;

      log('\tchecking target', bStack.unit.name);
      if ((bStack.netPower / aStack.netPower) <= 4.0) {
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

// Calculate the order of attacks
const calcBattleOrders = (attackingArmy: BattleStack[], defendingArmy: BattleStack[]) => {
  let battleOrders: BattleOrder[] = [];

  const extractAttacks = (army: BattleStack[], side: string) => {
    for (let i = 0; i < army.length; i++) {
      const u = army[i];
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



const battleSpell = (
  caster: Combatant,
  casterBattleStack: BattleStack[],
  defender: Combatant,
  defenderBattleStack: BattleStack[]) => {

  console.log('');
  console.group(`=== Spell ${caster.mage.name} : ${caster.spellId} ===`);

  const casterSpell = getSpellById(caster.spellId);
  const casterMagic = caster.mage.magic;

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

            fields.forEach(field => {
              // Figure out the value to add
              if (rule === 'spellLevel') {
                finalValue = baseValue * caster.mage.currentSpellLevel;
              } else if (rule === 'spellLevelPercentage') {
                // TODO: compound
                finalValue = baseValue * caster.mage.currentSpellLevel * unit[field];
              } else { // add, remove
                finalValue = baseValue;
              }

              // Finally apply
              if (_.isArray(unit[field])) {
                if (attr.has && unit[field].includes(attr.has)) {
                  unit[field].push(finalValue);
                }
              } else {
                if (field === 'accuracy') {
                  stack.accuracy += finalValue;
                } else if (field === 'efficiency') {
                  stack.efficiency += finalValue;
                } else {
                  unit[field] += finalValue;
                }
              }
            });
          });
        });
      } else if (eff.name === 'DamageEffect') {
        const damageEffect = eff as DamageEffect;
        const damageType = damageEffect.damageType;
        let rawDamage = 0;

        if (!damageEffect.magic[casterMagic]) return;

        affectedArmy.forEach(stack => {
          const rule = damageEffect.rule;
          if (rule === 'spellLevel') {
            rawDamage = damageEffect.magic[casterMagic].value * caster.mage.currentSpellLevel;
          } else {
            rawDamage = damageEffect.magic[casterMagic].value;
          }

          const resistance = calcResistance(stack.unit, damageType);
          const damage = rawDamage * ((100 - resistance) / 100);
          console.log(`dealing rawDamage=${damage} actualDamage=${damage}`);
        });
      }
    }
  });

  /*
  casterSpell.effects.forEach(effect => {
    if (effect.effectType === 'UnitEffect') {
      const eff = effect as UnitEffect;
      const army = eff.target === 'self' ? casterBattleStack: defenderBattleStack;

      // TODO: filters
      const filteredArmy = army;

      const armyToRecieveEffect = eff.stack === 'random' ? 
        [filteredArmy[randomInt(filteredArmy.length)]] :
        filteredArmy;

      // Loop through each affected attributes
      Object.keys(eff.attributeMap).forEach(attrKey => {
        const attr = eff.attributeMap[attrKey];

        // Magic colour does not get this effect
        if (!attr.magic[casterMagic]) return;

        let effectValue: any;
        if (attr.rule === 'spellLevel') {
          effectValue = attr.magic[casterMagic].value * caster.mage.currentSpellLevel;
        } else {
          effectValue = attr.magic[casterMagic].value; 
        }

        // Finally apply effects
        armyToRecieveEffect.forEach(stack => {
          if (attrKey === 'accuracy') {
            stack.accuracy += effectValue;
          } else {
            const fields = attrKey.split(',').map(d => d.trim());
            fields.forEach(field => {
              if (_.isArray(stack.unit[field]) && attr.has && stack.unit[field].includes(attr.has)) {
                stack.unit[field].push(effectValue);
              } else {
                stack.unit[field] += effectValue;
              }
            });
          }
        });
      });
    } else if (effect.effectType === 'BattleDamageEffect') {
      const eff = effect as BattleDamageEffect;
      const army = eff.target === 'self' ? casterBattleStack: defenderBattleStack;
      const armyToRecieveEffect = eff.stack === 'random' ? 
        [army[randomInt(army.length)]] :
        army;

      if (!eff.magic[casterMagic]) return;

      armyToRecieveEffect.forEach(stack => {
        if (eff.rule === 'spellLevel') {
          const damage = caster.mage.currentSpellLevel * eff.magic[casterMagic].value;
          console.log(`damage against ${stack.unit.name} = `, damage);
        }
      })
    }
  });
  */
  console.groupEnd();
}


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
  if (defender.spellId) {
    battleSpell(defender, defendingArmy, attacker, attackingArmy);
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
  attackingArmy.forEach(stack => {
    console.log('\t', stack.unit.name, stack.size, stack.netPower, stack.targetIdx);
  });

  console.log('=== Defending army ===');
  defendingArmy.forEach(stack => {
    console.log('\t', stack.unit.name, stack.size, stack.netPower, stack.targetIdx);
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


  // Calculate combat result
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
