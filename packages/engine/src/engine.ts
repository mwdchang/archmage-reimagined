import _ from 'lodash';
import {
  loadUnitData,
  loadSpellData,
  loadItemData,
  getSpellById,
  getItemById,
  initializeResearchTree,
  magicTypes,
  getUnitById,
  getMaxSpellLevels,
  getRandomItem,
} from './base/references';
import {
  createMage,
  createMageTest,
  totalLand,
  totalNetPower
} from './base/mage';
import { DataAdapter } from 'data-adapter/src/data-adapter';
import type { ArmyUnit, Assignment, Enchantment, Mage, Combatant } from 'shared/types/mage';
import type { BattleReport, BattleReportSummary } from 'shared/types/battle';
import type { BuildPayload, DestroyPayload } from 'shared/types/api';
import type { MageRank } from 'shared/types/common';
import {
  explore,
  explorationRate,
  buildingTypes,
  buildingRate,
  populationIncome,
  geldIncome,
  armyUpkeep,
  buildingUpkeep,
  realMaxPopulation,
  recruitmentAmount,
  getBuildingTypes
} from './interior';
import {
  doResearch,
  summonUnit,
  researchPoints,
  manaIncome,
  manaStorage,
  doItemGeneration,
  maxMana,
  castingCost,
  successCastingRate,
  currentSpellLevel,
  enchantmentUpkeep,
  maxSpellLevel
} from './magic';
import { applyKingdomBuildingsEffect } from './effects/apply-kingdom-buildings';
import { applyKingdomResourcesEffect } from './effects/apply-kingdom-resources';
import { battle, resolveBattle } from './war';
import {
  UnitSummonEffect,
  KingdomBuildingsEffect,
  KingdomResourcesEffect,
  EffectOrigin
} from 'shared/types/effects';

import { randomInt, between, randomBM } from './random';

import plainUnits from 'data/src/units/plain-units.json';
import ascendantUnits from 'data/src/units/ascendant-units.json';
import verdantUnits from 'data/src/units/verdant-units.json';
import eradicationUnits from 'data/src/units/eradication-units.json';
import netherUnits from 'data/src/units/nether-units.json';
import phantasmUnits from 'data/src/units/phantasm-units.json';

import ascendantSpells from 'data/src/spells/ascendant-spells.json';
import verdantSpells from 'data/src/spells/verdant-spells.json';
import eradicationSpells from 'data/src/spells/eradication-spells.json';
import netherSpells from 'data/src/spells/nether-spells.json';
import phantasmSpells from 'data/src/spells/phantasm-spells.json';

import lesserItems from 'data/src/items/lesser.json';

const TICK = 1000 * 60 * 2; // Every two minute

interface GameMsg {
  type: string,
  message: string,
}

const totalArmyPower = (army: ArmyUnit[]) => {
  let netpower = 0;
  army.forEach(stack => {
    const u = getUnitById(stack.id);
    netpower += u.powerRank + stack.size;
  });
  return netpower;
}

class Engine {
  adapter: DataAdapter;
  debug: boolean = false;

  constructor(adapter: DataAdapter, debug: boolean = false) {
    // Load dependencies
    this.adapter = adapter;
    this.debug = debug;
  }

  async initialize() {
    loadUnitData(plainUnits);
    loadUnitData(ascendantUnits);
    loadUnitData(verdantUnits);
    loadUnitData(eradicationUnits);
    loadUnitData(netherUnits);
    loadUnitData(phantasmUnits);

    loadSpellData(ascendantSpells);
    loadSpellData(verdantSpells);
    loadSpellData(eradicationSpells);
    loadSpellData(netherSpells);
    loadSpellData(phantasmSpells);
    initializeResearchTree();

    loadItemData(lesserItems);


    // Create a several dummy mages for testing
    for (let i = 0; i < 10; i++) {
      const magic = magicTypes[randomInt(5)];
      const name = `TestMage_${i}`;

      const mage = await this.getMageByUser(name);
      if (!mage) {
        console.log('creating test mage', name);
        const mage = createMage(name, magic);
        await this.adapter.createMage(name, mage);
      }
    }

    this.updateRankList();

    // Start loop
    setTimeout(() => {
      this.updateLoop();
    }, TICK);
    console.log('engine constructor done');
  }

  updateLoop() {
    /**
     * Main update logic goes here
     * - update server state
     * - increment mage turns
     * - black market and other things
     */
    console.log(`=== Server turn ===`);
    this.adapter.nextTurn();
    this.updateRankList();

    setTimeout(() => {
      this.updateLoop()
    }, TICK);
  }

  useTurns(mage: Mage, turns: number) {
    for (let i = 0; i < turns; i++) {
      this.useTurn(mage);
    }
  }

  useTurnEnchantmentSummon(mage: Mage, enchantments: Enchantment[]) {
    for (const enchantment of enchantments) {
      const spell = getSpellById(enchantment.spellId);
      const summonEffects = spell.effects.filter(d => d.effectType === 'UnitSummonEffect') as UnitSummonEffect[];
      if (summonEffects.length === 0) continue;

      for (const summonEffect of summonEffects) {
        const res = summonUnit(summonEffect, {
          id: enchantment.casterId,
          magic: enchantment.casterMagic,
          spellLevel: enchantment.spellLevel,
          targetId: mage.id
        });
        Object.keys(res).forEach(key => {
          const stack = mage.army.find(d => d.id === key);
          if (stack) {
            stack.size += res[key];
          } else {
            mage.army.push({
              id: key,
              size: res[key]
            });
          }
        });
      }
    }
  }

  useTurnEnchantmentDamage(mage: Mage, enchantments: Enchantment[]) {
    const mageLand = totalLand(mage);

    // handle buildings
    for (const enchantment of enchantments) {
      const spell = getSpellById(enchantment.spellId);
      const effects = spell.effects
        .filter(d => d.effectType === 'KingdomBuildingsEffect') as KingdomBuildingsEffect[];

      if (effects.length === 0) continue;

      for (const effect of effects) {
        applyKingdomBuildingsEffect(mage, effect, {
          id: enchantment.casterId,
          magic: enchantment.casterMagic,
          spellLevel: enchantment.spellLevel,
          targetId: enchantment.targetId
        });
      }
    }

    // handle resources
    for (const enchantment of enchantments) {
      const spell = getSpellById(enchantment.spellId);
      const effects = spell.effects
        .filter(d => d.effectType === 'KingdomResourcesEffect') as KingdomResourcesEffect[];

      if (effects.length === 0) continue;

      for (const effect of effects) {
        applyKingdomResourcesEffect(mage, effect, {
          id: enchantment.casterId,
          magic: enchantment.casterMagic,
          spellLevel: enchantment.spellLevel,
          targetId: enchantment.targetId
        });
      }
    }
  }

  // Use one turn for a mage
  useTurn(mage: Mage) {
    console.log('[Turn]');
    // 1. use turn
    mage.currentTurn --;
    mage.turnsUsed ++;

    // 2. calculate income
    mage.currentGeld += geldIncome(mage);
    mage.currentPopulation += populationIncome(mage);
    mage.currentMana += manaIncome(mage);

    const maxPop = realMaxPopulation(mage);
    if (mage.currentPopulation >= maxPop) {
      mage.currentPopulation = maxPop;
    }
    if (mage.currentMana > manaStorage(mage)) {
      mage.currentMana = manaStorage(mage);
    }

    // 3. calculate research, if applicable
    doResearch(mage, researchPoints(mage));
    doItemGeneration(mage);


    // 4. recruiting barrack units
    const speed = 1.0;
    const doRecruit = (id: string, size: number) => {
      if (mage.army.find(d => d.id === id)) {
        mage.army.find(d => d.id === id).size += size;
      } else {
        mage.army.push({ id, size });
      }
    };

    let recruitGeldCapacity = 100 * mage.barracks * speed;

    for (let i = 0; i < mage.recruitments.length; i++) {
      const au = mage.recruitments[i];
      const unitMax = recruitmentAmount(mage, au.id);

      // consumes all capacity
      if (unitMax <= au.size) {
        doRecruit(au.id, unitMax);
        au.size -= unitMax;
        console.log(`\trecruited ${unitMax} ${au.id}`);
        break;
      }

      // partially consumes, need to rollover to next recruitment
      if (unitMax > au.size) {
        const recruitGeld = au.size * getUnitById(au.id).recruitCost.geld;
        if (recruitGeldCapacity < recruitGeld) break;

        recruitGeldCapacity -= recruitGeld;
        doRecruit(au.id, au.size);
        au.size = 0;
        console.log(`\trecruited ${au.size} ${au.id}`);
      }
    }
    // Clean up
    mage.recruitments = mage.recruitments.filter(d => d.size > 0);


    // 5. enchantment
    // - summoning effects
    // - damage effects
    const enchantments = mage.enchantments;
    this.useTurnEnchantmentSummon(mage, enchantments);
    this.useTurnEnchantmentDamage(mage, enchantments);


    // Enchantment life and upkeep
    mage.enchantments = mage.enchantments.filter(d => {
      // If enchantment has life, update
      if (d.life && d.life > 0) {
        d.life --;
      }
      if (d.life === 0) {
        console.log(`${d.casterId} ${d.spellId} expired`)
      }

      if (d.isPermanent === false) {
        return d.life > 0;
      }
      return true;
    });

    // 6. calculate upkeep
    const armyCost = armyUpkeep(mage);
    mage.currentGeld -= armyCost.geld;
    mage.currentMana -= armyCost.mana;
    mage.currentPopulation -= armyCost.population;

    const buildingCost = buildingUpkeep(mage);
    mage.currentGeld -= buildingCost.geld;
    mage.currentMana -= buildingCost.mana;
    mage.currentPopulation -= buildingCost.population;

    const spellCost = enchantmentUpkeep(mage);
    mage.currentGeld -= spellCost.geld;
    mage.currentMana -= spellCost.mana;
    mage.currentPopulation -= spellCost.population;

    if (mage.currentGeld < 0) mage.currentGeld = 0;
    if (mage.currentMana < 0) mage.currentMana = 0;
    if (mage.currentPopulation < 0) mage.currentPopulation = 0;
  }

  async exploreLand(mage: Mage, num: number) {
    if (num > mage.currentTurn) {
      return;
    }
    let landGained = 0;
    for (let i = 0; i < num; i++) {
      const rate = explorationRate(mage);
      const exploredLand = explore(rate);
      mage.wilderness += exploredLand;
      landGained += exploredLand;
      this.useTurn(mage);
    }
    await this.adapter.updateMage(mage);
    return landGained
  }

  // geld for num turns
  async gelding(mage: Mage, num: number) {
    if (num > mage.currentTurn) {
      return;
    }

    let geldGained = 0;
    for (let i = 0; i < num; i++) {
      const gain = geldIncome(mage);
      geldGained += gain;
      mage.currentGeld += gain;
      this.useTurn(mage);
    }
    await this.adapter.updateMage(mage);
    return geldGained;
  }

  async manaCharge(mage: Mage, num: number) {
    if (num > mage.currentTurn) {
      return;
    }

    let manaGained = 0;
    for (let i = 0; i < num; i++) {
      const gain = manaIncome(mage);
      manaGained += gain;
      mage.currentMana += gain;
      if (mage.currentMana > maxMana(mage)) {
        mage.currentMana = maxMana(mage);
      }
      this.useTurn(mage);
    }
    await this.adapter.updateMage(mage);
    return manaGained;
  }

  async research(mage: Mage, magic: string, focus: boolean, turns: number) {
    magicTypes.forEach(m => {
      if (mage.currentResearch[m]) {
        mage.currentResearch[m].active = false;
      }
    });

    mage.currentResearch[magic].active = true;
    mage.focusResearch = focus;

    if (turns && turns > 0) {
      for (let i = 0; i < turns; i++) {
        doResearch(mage, researchPoints(mage));
        this.useTurn(mage);
      }
    }
    await this.adapter.updateMage(mage);
  }

  async useItem(mage: Mage, itemId: string, num: number, target: number) {
    const item = getItemById(itemId);
    if (item.attributes.includes('summon')) {
      return this.summonByItem(mage, itemId, num);
    }
  }

  // - factor out spell success/fail
  // - logs
  async castSpell(mage: Mage, spellId: string, num: number, target: number) {
    const spell = getSpellById(spellId);
    const attributes = spell.attributes;
    const castingTurn = spell.castingTurn;
    const cost = castingCost(mage, spellId);
    const logs: GameMsg[] = [];

    for (let i = 0; i < num; i++) {
      // Check if we meet turn/cost prerequisite
      if (mage.currentMana < cost) {
        logs.push({
          type: 'error',
          message: `Spell costs ${cost} mana, you only have ${mage.currentMana}`
        });
        console.log('============ no mana');
        continue;
      }
      if (mage.currentTurn < castingTurn) {
        logs.push({
          type: 'error',
          message: `Spell costs ${castingTurn} turns, you only have ${mage.currentTurn}`
        });
        console.log('============ no turn');
        continue;
      }
      
      // Spend mana and check if casting is successful
      const rate = successCastingRate(mage, spellId);
      let castingSuccessful = true;
      if (Math.random() * 100 > rate) {
        logs.push({
          type: 'error',
          message: `You lost your concentration`
        });
        console.log('============ no concentration');
        castingSuccessful = false;
      }


      if (target) {
        // FIXME: target barriers if applicable
      }

      mage.currentMana -= cost;
      this.useTurns(mage, spell.castingTurn);

      if (castingSuccessful === false) {
        continue;
      }

      if (attributes.includes('selfOnly')) {
        if (attributes.includes('summon')) {
          this.summon(mage, spellId);
        } else if (spell.attributes.includes('enchantment')) {
          this.enchant(mage, spellId);
        } else if (spell.attributes.includes('instant')) {
          this.instantSelf(mage, spellId);
        } else {
          throw new Error(`cannot process attributes ${attributes}`);
        }
      } else {
        // FIXME
      }
    }
    return logs;
  }

  /**
   * instant harmful or beneficial effects
  **/
  async instantSelf(mage: Mage, spellId: string) {
    const spell = getSpellById(spellId);
    const origin: EffectOrigin = {
      id: mage.id,
      spellLevel: mage.currentSpellLevel,
      magic: mage.magic,
      targetId: mage.id
    };

    for (const effect of spell.effects) {
      if (effect.effectType === 'KingdomResourcesEffect') {
        applyKingdomResourcesEffect(mage, effect as any, origin);
      } else if (effect.effectType === 'KingdomBuildingsEffect') {
        applyKingdomBuildingsEffect(mage, effect as any, origin);
      }
    }
  }

  async enchant(mage: Mage, spellId: string) {
    const spell = getSpellById(spellId);
    const result: GameMsg[] = [];

    // Spell already exists and not from 0
    if (mage.enchantments.find(d => d.spellId === spellId && d.casterId !== 0)) {
      result.push({
        type: 'error',
        message: `The spell is alrady in effect, your attempt fizzled`
      });
      return result;
    }

    // Success
    const enchantment: Enchantment = {
      casterId: mage.id,
      casterMagic: mage.magic,
      targetId: mage.id,

      spellId: spell.id,
      spellMagic: spell.magic,
      spellLevel: currentSpellLevel(mage),

      isPermanent: spell.life > 0 ? false : true,
      life: spell.life ? spell.life : 0
    }
    mage.enchantments.push(enchantment);
    console.log('cast enchantment', enchantment);
    await this.adapter.updateMage(mage);

    result.push({
      type: 'log',
      message: `You cast ${spell.name} on yourself`
    });

    return result;
  }

  async summonByItem(mage: Mage, itemId: string, num: number) {
    const item = getItemById(itemId);

    const result: GameMsg[] = [];
    for (let i = 0; i < num; i++) {
      // Check if items are availble for use
      if (mage.items[itemId] && mage.items[itemId] > 0) {
        mage.items[itemId] --;
        result.push({
          type: 'log',
          message: `You used ${item.name}, it is destroyed after use`
        });
      } else {
        result.push({
          type: 'log',
          message: `You do not have ${item.name} in your inventory`
        });
        break;
      }

      const effects: UnitSummonEffect[] = item.effects as UnitSummonEffect[];
      effects.forEach(effect => {
        const res = summonUnit(effect, {
          id: mage.id,
          magic: mage.magic,
          spellLevel: mage.currentSpellLevel,
          targetId: mage.id
        });

        // Add to existing army
        Object.keys(res).forEach(key => {
          const stack = mage.army.find(d => d.id === key);
          if (stack) {
            stack.size += res[key];
          } else {
            mage.army.push({
              id: key,
              size: res[key]
            });
          }
          result.push({
            type: 'log',
            message: `Summoned ${res[key]} ${key} into your army`
          });
        });
      });
      this.useTurn(mage);
    }
    await this.adapter.updateMage(mage);
    return result;
  }

  async summon(mage: Mage, spellId: string) {
    const spell = getSpellById(spellId);
    const result: GameMsg[] = [];

    const effects: UnitSummonEffect[] = spell.effects as UnitSummonEffect[];
    effects.forEach(effect => {
      const res = summonUnit(effect, {
        id: mage.id,
        magic: mage.magic,
        spellLevel: mage.currentSpellLevel,
        targetId: mage.id
      });
      // Add to existing army
      Object.keys(res).forEach(key => {
        const stack = mage.army.find(d => d.id === key);
        if (stack) {
          stack.size += res[key];
        } else {
          mage.army.push({
            id: key,
            size: res[key]
          });
        }
        result.push({
          type: 'log',
          message: `Summoned ${res[key]} ${key} into your army`
        });
      });
    });
    
    await this.adapter.updateMage(mage);
    return result;
  }

  async build(mage: Mage, payload: BuildPayload) {
    let landUsed = 0;
    let turnsUsed = 0;

    buildingTypes.forEach(b => {
      landUsed += payload[b.id];
      turnsUsed += payload[b.id] /  buildingRate(mage, b.id);
    });
    turnsUsed = Math.ceil(turnsUsed);
    landUsed = Math.ceil(landUsed);

    if (landUsed > mage.wilderness) {
      return;
    }
    if (turnsUsed > mage.currentTurn) {
      return;
    }

    // 1. Build first using the current rates
    buildingTypes.forEach(b => {
      const num = payload[b.id];
      mage[b.id] += num;
      mage.wilderness -= num;
      mage.currentGeld -= b.geldCost * num;
      mage.currentMana -= b.manaCost * num;
    });

    // 2. Calculate cost and spend turns
    for (let i = 0; i < turnsUsed; i++) {
      this.useTurn(mage);
    }
    await this.adapter.updateMage(mage);
  }

  async destroy(mage: Mage, payload: DestroyPayload) {
    buildingTypes.forEach(b => {
      const num = payload[b.id];
      mage[b.id] -= num;
      mage.wilderness += num;
    });
    this.useTurn(mage);
    await this.adapter.updateMage(mage);
  }

  async setAssignment(mage: Mage, payload: Assignment) {
    mage.assignment = _.cloneDeep(payload);
    await this.adapter.updateMage(mage);
  }

  async setRecruitments(mage: Mage, payload: ArmyUnit[]) {
    mage.recruitments = _.cloneDeep(payload);
    await this.adapter.updateMage(mage);
  }

  async disbandUnits(mage: Mage, payload: { [key: string]: ArmyUnit }) {
    mage.army.forEach(armyUnit => {
      const u = payload[armyUnit.id];
      // FIXME: need to check undisbandable
      if (u) {
        armyUnit.size -= u.size;
      }
    });
    mage.army = mage.army.filter(d => d.size > 0);
    await this.adapter.updateMage(mage);
  }

  async updateRankList() {
    console.log('engine: updateRankList');
    /* FIXME
    const mages = await this.adapter.getAllMages();
    const ranks = mages.map(mage => {
      return {
        id: mage.id,
        name: mage.name,
        netPower: totalNetPower(mage)
      };
    });

    const orderedRanks = _.orderBy(ranks, d => -d.netPower);
    orderedRanks.forEach((d, rankIdx) => {
      this.getMage(d.id).rank = (1 + rankIdx);
    });
    */
  }

  async rankList(_listingType: string): Promise<MageRank[]> {
    const mages = await this.adapter.getAllMages();

    const ranks = mages.map(mage => {
      return {
        id: mage.id,
        name: mage.name,
        magic: mage.magic,
        forts: mage.forts,
        land: totalLand(mage),
        status: mage.status,
        netPower: totalNetPower(mage)
      }
    });
    return _.orderBy(ranks, d => -d.netPower);
  }

  async preBattleCheck(mage: Mage, targetId: number): Promise<string[]>  {
    const errors = [];
    const defenderMage = await this.getMage(targetId);

    if (mage.currentTurn < 2) {
      errors.push('Need at least 2 turns to make an attack');
    }
    if (defenderMage.status === 'defeated') {
      errors.push('Target mage is already defeated');
    }
    // TODO: Check damaged status
    return errors;
  }

  async doBattle(mage: Mage, targetId: number, stackIds: string[], spellId: string, itemId: string) {
    const defenderMage = await this.getMage(targetId);

    // Make battle stacks
    const attacker: Combatant =  {
      mage: mage,
      spellId: spellId,
      itemId: itemId,
      army: mage.army.filter(s => stackIds.includes(s.id))
    };

    const defender: Combatant = {
      mage: defenderMage,
      spellId: '',
      itemId: '',
      army: defenderMage.army
    };

    // Check if defense assignment is triggered
    const attackerArmyNP = totalArmyPower(attacker.army);
    const defenderArmyNP = totalArmyPower(defender.army);
    const ratio = 100 * (attackerArmyNP / defenderArmyNP);

    console.log('Attacker to defender army ratio', ratio.toFixed(4));

    const assignment = defender.mage.assignment;

    if (assignment.spellCondition > -1 && ratio >= assignment.spellCondition) {
      defender.spellId = assignment.spellId;
    }
    if (assignment.itemCondition > -1 && ratio >= assignment.itemCondition) {
      defender.itemId = assignment.itemId;
    }

    // FIXME: need to model order, right now
    // we take one turn to go attack, and one turn to return home ???
    this.useTurn(mage);
    const battleReport = battle('siege', attacker, defender);
    resolveBattle(mage, defenderMage, battleReport);
    this.useTurn(mage);

    const reportSummary: BattleReportSummary = {
      id: battleReport.id,
      timestamp: battleReport.timestamp,
      attackType: 'siege',
      attackerId: battleReport.attacker.id,
      defenderId: battleReport.defender.id,
      summary: battleReport.summary
    };

    await this.adapter.saveBattleReport(mage.id, battleReport.id, battleReport, reportSummary);
    await this.adapter.updateMage(mage);
    await this.adapter.updateMage(defenderMage);
    return battleReport;
  }

  async getBattleReport(mage: Mage, reportId: string) {
    // TODO: Obfuscate based on which side

    const report = await this.adapter.getBattleReport(reportId);
    if (report) {
      if (typeof report === 'string') {
        return JSON.parse(report) as BattleReport;
      } else {
        return report;
      }
    } else {
      return null;
    }
  }

  async getMageBattles(mage: Mage) {
    return await this.adapter.getMageBattles(mage.id, {});
  }

  async register(username: string, password: string, magic: string) {
    // 1. register player
    const res = await this.adapter.register(username, password);

    // 2. return mage
    const mage = createMage(username, magic);

    // 3. Write to data store
    this.adapter.createMage(username, mage);
    return { user: res.user, mage };
  }

  /* For ease of testing */
  async registerTestMage(username: string, password: string, magic: string, partial: Partial<Mage>) {
    // 1. register player
    const res = await this.adapter.register(username, password);

    // 2. return mage
    const mage = createMageTest(username, magic, partial);

    // 3. Write to data store
    this.adapter.createMage(username, mage);
    return { user: res.user, mage };
  }

  async login(username: string, password: string) {
    // 1. check login
    const res = await this.adapter.login(username, password);
    if (!res) {
      return { user: null, mage: null }
    }

    // 2. return mage
    const mage = await this.adapter.getMageByUser(username);
    if (!mage) {
      return { user: res.user, mage: null }
    }
    return { user: res.user, mage };
  }

  async getMage(id: number) {
    return this.adapter.getMage(id);
  }

  async getMageSummary(id: number) {
    const m = await this.getMage(id);

    return {
      id: m.id,
      name: m.name,
      magic: m.magic,
      land: totalLand(m),
      netPower: totalNetPower(m),
      forts: m.forts
    };
  }

  async getMageByUser(username: string) {
    return this.adapter.getMageByUser(username);
  }
}

export { Engine };
