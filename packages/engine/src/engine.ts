import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import {
  loadUnitData,
  loadSpellData,
  loadItemData,
  getSpellById,
  getItemById,
  initializeResearchTree,
  getUnitById,
  getAllItems,
  getRandomItem
} from './base/references';
import {
  createMage,
  totalLand,
  totalNetPower,
  currentSpellLevel,
  totalUnits
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
  recruitUpkeep
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
  enchantmentUpkeep,
  dispelEnchantment,
  calcKingdomResistance
} from './magic';
import { applyKingdomBuildingsEffect } from './effects/apply-kingdom-buildings';
import { applyKingdomResourcesEffect } from './effects/apply-kingdom-resources';
import { battle, resolveBattle, successPillage } from './war';
import {
  UnitSummonEffect,
  KingdomBuildingsEffect,
  KingdomResourcesEffect,
  EffectOrigin,
  KingdomArmyEffect
} from 'shared/types/effects';
import { GameMsg } from 'shared/types/common';

import { betweenInt, randomInt } from './random';

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
import { prepareBattleStack } from './battle/prepare-battle-stack';
import { applyKingdomArmyEffect } from './effects/apply-kingdom-army-effect';
import { applyWishEffect } from './effects/apply-wish-effect';
import { applyStealEffect } from './effects/apply-steal-effect';
import { calcPillageProbability } from './battle/calc-pillage-probability';
import { mageName, readableStr } from './util';
import { 
  fromKingdomArmyEffectResult,
  fromKingdomBuildingsEffectResult,
  fromKingdomResourcesEffectResult,
  fromRemoveEnchantmentEffectResult,
  fromStealEffectResult,
  fromWishEffectResult 
} from './game-message';
import { Item, Spell } from 'shared/types/magic';
import { allowedMagicList } from 'shared/src/common';
import { gameTable } from './base/config';
import { createBot, getBotAssignment } from './bot';
import { applyRemoveEnchantmentEffect } from './effects/apply-remove-enchantment-effect';
import { Bid, MarketItem, MarketPrice } from 'shared/types/market';
import { priceIncrease } from './blackmarket';
import { newBattleReport } from './battle/new-battle-report';

const EPIDEMIC_RATE = 0.5;


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
  currentTurn: number = 0;

  constructor(adapter: DataAdapter, debug: boolean = false) {
    // Load dependencies
    this.adapter = adapter;
    this.debug = debug;
  }

  async initialize(resetData: boolean) {
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


    // Reset server data and defaults
    if (resetData === true) {
      console.log('Restarting from scratch ...');
      await this.adapter.resetData();
      await this.adapter.initialize();

      // Start server clock
      await this.adapter.setServerClock({
        currentTurn: 0,
        currentTurnTime: Date.now(),
        endTurn: 25000,
        interval: gameTable.turnRate * 1000 
      });

      // Setart market
      await this.initializeMarket();
    } else {
      console.log('Resume from previous DB state ...');
      this.adapter.initialize();
    }


    // Create a several dummy mages for testing
    for (let i = 0; i < 10; i++) {
      const magic = allowedMagicList[randomInt(allowedMagicList.length)];
      const name = `Robot${i}`;

      const mage = await this.getMageByUser(name);
      if (!mage) {
        console.log('creating test mage', name);

        const newId = await this.adapter.nextMageId();
        const bot = createBot(newId, name, magic);
        await this.adapter.createMage(name, bot);
        await this.adapter.createRank({
          id: bot.id,
          name: bot.name,
          magic: bot.magic,
          forts: bot.forts,
          land: totalLand(bot),
          status: '',
          netPower: totalNetPower(bot)
        });
      }
    }

    // Start loop
    if (this.debug === false) {
      setTimeout(() => {
        this.updateLoop();
      }, gameTable.turnRate * 1000);
    }
  }

  async getServerClock() {
    const clock = await this.adapter.getServerClock();
    return clock;
  }

  /**
   * Next server turn cycle
  **/
  async serverTurn() {
    await this.adapter.nextTurn({ maxTurn: gameTable.maxTurns });
  }

  /**
   * Main update logic goes here
   * - black market and other things
   * - increment server clock and mage turns
  **/
  async updateLoop() {
    // Update server state and mage turns
    await this.serverTurn();
    const c = await this.getServerClock();
    this.currentTurn = c.currentTurn;

    if (this.currentTurn > c.endTurn) {
      console.log('=== Reset finished ===');
      return;
    }
    console.log('');
    console.log(`=== Server turn [${this.currentTurn}]===`);

    /**
     * Resolve bids
     * - Find winning bids
     * - Add items to buyer
     * - Add geld to sellers
     * - Update pricing
     * - Remove all expired items
    **/
    const marketItems = await this.adapter.getMarketItems();
    const marketPrices = await this.adapter.getMarketPrices();

    const priceMap: Map<string, MarketPrice> = new Map();
    const itemMap: Map<string, MarketItem> = new Map();

    const mageMap: Map<number, Mage> = new Map();
    const priceUpdate: Map<string, MarketPrice> = new Map();

    for (const marketItem of marketItems) {
      itemMap.set(marketItem.id, marketItem);
    }
    for (const marketPrice of marketPrices) {
      priceMap.set(marketPrice.id, marketPrice);
    }

    const winningBids = await this.adapter.getWinningBids(c.currentTurn);
    for (const bid of winningBids) {
      const marketItem = itemMap.get(bid.marketId);
      const marketPrice = priceMap.get(marketItem.priceId);

      if (!mageMap.has(bid.mageId)) {
        const m = await this.adapter.getMage(bid.mageId);
        mageMap.set(bid.mageId, m);
      }
      const mage = mageMap.get(bid.mageId);

      // Resolve item
      if (marketPrice.type === 'item') {
        if (mage.items[marketPrice.id]) {
          mage.items[marketPrice.id] ++;
        } else {
          mage.items[marketPrice.id] = 1;
        }
      }

      // Resolve if item came from a mage instead of generated
      if (marketItem.mageId) {
        if (!mageMap.has(marketItem.mageId)) {
          const m = await this.adapter.getMage(bid.mageId);
          mageMap.set(bid.mageId, m);
        }
        const mage2 = mageMap.get(bid.mageId);
        mage2.currentGeld += marketItem.basePrice;
      }

      marketPrice.price = priceIncrease(marketPrice.price, bid.bid);
      priceUpdate.set(marketPrice.id, marketPrice);
    }

    // delete market bids and delete market items
    await this.adapter.removeMarketBids(winningBids.map(d => d.id));
    await this.adapter.cleanupMarket(c.currentTurn);

    // update prices and mages
    for (const p of priceUpdate.values()) {
      await this.adapter.updateMarketPrice(p.id, p.price);
    }
    for (const m of mageMap.values()) {
      await this.adapter.updateMage(m);
    }

    // generate new items
    for (let i = 0; i < 5; i++) {
      if (Math.random() > 0.7) {
        const item = getRandomItem();

        if (priceMap.has(item.id) === false) {
          continue;
        }

        await this.adapter.addMarketItem({
          id: uuidv4(),
          priceId: item.id,
          basePrice: priceMap.get(item.id).price,
          mageId: null,
          expiration: this.currentTurn + betweenInt(20, 50)
        });
      }
    }

    if (this.debug === false) {
      setTimeout(async () => {
        await this.updateLoop()
      }, gameTable.turnRate * 1000);
    }
  }

  async useTurns(mage: Mage, turns: number) {
    for (let i = 0; i < turns; i++) {
      await this.useTurn(mage);
    }
  }

  processTurnEnchantmentSummon(mage: Mage, enchantments: Enchantment[]): GameMsg[] {
    const logs: GameMsg[] = [];
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
          logs.push({
            type: 'log',
            message: `${res[key]} ${readableStr(key)} joined your army`
          });
        });
      }
    }
    return logs;
  }

  processTurnEnchantmentDamage(mage: Mage, enchantments: Enchantment[]): GameMsg[] {
    const logs: GameMsg[] = [];
    const mageLand = totalLand(mage);

    // handle buildings
    for (const enchantment of enchantments) {
      const spell = getSpellById(enchantment.spellId);
      const effects = spell.effects
        .filter(d => d.effectType === 'KingdomBuildingsEffect') as KingdomBuildingsEffect[];

      if (effects.length === 0) continue;

      for (const effect of effects) {
        const result = applyKingdomBuildingsEffect(mage, effect, {
          id: enchantment.casterId,
          magic: enchantment.casterMagic,
          spellLevel: enchantment.spellLevel,
          targetId: enchantment.targetId
        });
        logs.push(...fromKingdomBuildingsEffectResult(result));
      }
    }

    // handle resources
    for (const enchantment of enchantments) {
      const spell = getSpellById(enchantment.spellId);
      const effects = spell.effects
        .filter(d => d.effectType === 'KingdomResourcesEffect') as KingdomResourcesEffect[];
      if (effects.length === 0) continue;

      for (const effect of effects) {
        const result = applyKingdomResourcesEffect(mage, effect, {
          id: enchantment.casterId,
          magic: enchantment.casterMagic,
          spellLevel: enchantment.spellLevel,
          targetId: enchantment.targetId
        });
        logs.push(...fromKingdomResourcesEffectResult(result));
      }
    }

    // handle army effect
    for (const enchantment of enchantments) {
      const spell = getSpellById(enchantment.spellId);
      const effects = spell.effects
        .filter(d => d.effectType === 'KingdomArmyEffect') as KingdomArmyEffect[];
      if (effects.length === 0) continue;

      for (const effect of effects) {
        const result = applyKingdomArmyEffect(mage, effect, {
          id: enchantment.casterId,
          magic: enchantment.casterMagic,
          spellLevel: enchantment.spellLevel,
          targetId: enchantment.targetId
        });
        logs.push(...fromKingdomArmyEffectResult(result));
      }
    }
    return logs;
  }

  /**
   * Use one turn for a mage
   *
   * Note the only async/await part is for updating enchantments from other mages
  **/
  async useTurn(mage: Mage) {
    const turnLogs: GameMsg[] = [];

    // 1. use turn
    mage.currentTurn --;
    mage.turnsUsed ++;

    // 2. calculate income
    const beforeGeld = mage.currentGeld;
    const beforeMana = mage.currentMana;
    const beforePopuplation = mage.currentPopulation;

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
    const doRecruit = (id: string, size: number) => {
      if (mage.army.find(d => d.id === id)) {
        mage.army.find(d => d.id === id).size += size;
      } else {
        mage.army.push({ id, size });
      }
    };

    const recruitCost = recruitUpkeep(mage);
    const recruits = recruitCost.recruits;

    for (let i = 0; i < recruits.length; i++) {
      doRecruit(recruits[i].id, recruits[i].size);
      mage.recruitments[i].size -= recruits[i].size;
      turnLogs.push({
        type: 'log',
        message: `You recruited ${recruits[i].size} units of ${readableStr(recruits[i].id)}`
      });
    }
    mage.recruitments = mage.recruitments.filter(d => d.size > 0);

    // 5. enchantment
    // - summoning effects
    // - damage effects
    const enchantments = mage.enchantments;
    const enchant1 = this.processTurnEnchantmentSummon(mage, enchantments);
    const enchant2 = this.processTurnEnchantmentDamage(mage, enchantments);
    turnLogs.push(...enchant1);
    turnLogs.push(...enchant2);


    // Enchantment life and upkeep
    // FIXME: when mana = 0
    for (const enchant of mage.enchantments) {
      if (enchant.casterId !== mage.id && enchant.casterId !== 0) {
        const spell = getSpellById(enchant.spellId);
        const upkeep = spell.upkeep;
        if (!upkeep) continue;

        const casterMage = await this.getMage(enchant.casterId);
        casterMage.currentGeld -= upkeep.geld;
        casterMage.currentMana -= upkeep.mana;
        casterMage.currentPopulation -= upkeep.population;
        if (casterMage.currentGeld <= 0 && upkeep.geld) {
          casterMage.currentGeld = 0;
          enchant.life = 0;
          enchant.isActive = false;
        }
        if (casterMage.currentMana <= 0 && upkeep.mana) {
          casterMage.currentMana = 0;
          enchant.life = 0;
          enchant.isActive = false;
        }
        if (casterMage.currentPopulation <= 0 && upkeep.population) {
          casterMage.currentPopulation = 0;
          enchant.life = 0;
          enchant.isActive = false;
        }
        await this.adapter.updateMage(casterMage);
      }

      // If enchantment has life, update
      if (enchant.life && enchant.life > 0) {
        enchant.life --;
      }
      if (enchant.life <= 0 && enchant.isPermanent === false) {
        enchant.isActive = false;
      }
    }


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

    mage.currentGeld -= recruitCost.geld;
    mage.currentMana -= recruitCost.mana;
    mage.currentPopulation -= recruitCost.population

    // Check geld, mana, and population implosion
    const implosions = [
      { type: 'army', data: armyCost },
      { type: 'building', data: buildingCost },
      { type: 'enchantment', data: spellCost }
    ]

    const implodeArmy = ( compareFn: (a: ArmyUnit, b: ArmyUnit) => number) => {
      const army = mage.army;
      army.sort(compareFn);
      army.shift();
      mage.army = army;
      turnLogs.push({
        type: 'log',
        message: 'Insufficient resources, you have lost some units'
      });
    };

    const implodeEnchantments = ( checkFn: (s: Spell) => boolean ) => {
      mage.enchantments = mage.enchantments.filter(enchant => {
        if (enchant.casterId !== mage.id) {
          return true;
        }
        const spell = getSpellById(enchant.spellId);
        if (checkFn(spell)) {
          return false;
        }
        return true;
      });
      turnLogs.push({
        type: 'log',
        message: 'Insufficient resources, you have lost some enchantments'
      });
    };

    if (mage.currentGeld < 0) { 
      console.log('insufficient geld'); 
      mage.currentGeld = 0;
      implosions.sort((a, b) => b.data.geld - a.data.geld);
      const target = implosions[0];
      if (target.type === 'army') {
        implodeArmy((a, b) => {
          const aUnit = getUnitById(a.id);
          const bUnit = getUnitById(b.id);
          return bUnit.upkeepCost.geld * b.size - aUnit.upkeepCost.geld * a.size;
        });
      } else if (target.type === 'building') {
        ['farms', 'towns', 'workshops', 'barracks', 'guilds'].forEach(bType => {
          const bLost = Math.floor(0.2 * mage[bType]);
          mage[bType] -= bLost;
          mage.wilderness += bLost;
        });
        const fortsLost = Math.min(
          Math.floor(0.2 * mage.forts) + 4,
          mage.forts
        );
        mage.forts -= fortsLost;
        mage.wilderness += fortsLost;
        turnLogs.push({
          type: 'log',
          message: 'Insufficient resources, you have lost some buildings'
        });
      } else if (target.type === 'enchantment') {
        implodeEnchantments((s) => {
          return s.upkeep.geld > 0 ? true : false
        });
      }
    }

    if (mage.currentMana < 0) {
      console.log('insufficient mana'); 
      mage.currentMana = 0;
      implosions.sort((a, b) => b.data.mana - a.data.mana);
      const target = implosions[0];
      if (target.type === 'army') {
        implodeArmy((a, b) => {
          const aUnit = getUnitById(a.id);
          const bUnit = getUnitById(b.id);
          return bUnit.upkeepCost.mana * b.size - aUnit.upkeepCost.mana * a.size;
        });
      } else if (target.type === 'building') {
        const barriersLost = Math.min(
          Math.floor(0.2 * mage.barriers) + 8,
          mage.barriers
        );
        mage.barriers -= barriersLost;
        mage.wilderness += barriersLost;
        turnLogs.push({
          type: 'log',
          message: 'Insufficient resources, you have lost some buildings'
        });
      } else if (target.type === 'enchantment') {
        implodeEnchantments((s) => {
          return s.upkeep.mana > 0 ? true : false
        });
      }
    }

    if (mage.currentPopulation < 0) {
      console.log('insufficient population'); 
      mage.currentPopulation = 0;
      implosions.sort((a, b) => b.data.population - a.data.population);
      const target = implosions[0];
      if (target.type === 'army') {
        implodeArmy((a, b) => {
          const aUnit = getUnitById(a.id);
          const bUnit = getUnitById(b.id);
          return bUnit.upkeepCost.population * b.size - aUnit.upkeepCost.population* a.size;
        });
      } else if (target.type === 'building') {
        ['farms', 'towns', 'workshops', 'barracks', 'guilds'].forEach(bType => {
          const bLost = Math.floor(0.2 * mage[bType]);
          mage[bType] -= bLost;
          mage.wilderness += bLost;
        });
        const fortsLost = Math.min(
          Math.floor(0.2 * mage.forts) + 4,
          mage.forts
        );
        mage.forts -= fortsLost;
        mage.wilderness += fortsLost;
        turnLogs.push({
          type: 'log',
          message: 'Insufficient resources, you have lost some buildings'
        });
      } else if (target.type === 'enchantment') {
        implodeEnchantments((s) => {
          return s.upkeep.population > 0 ? true : false
        });
      }
    }

    const deltaGeld = mage.currentGeld - beforeGeld;
    const deltaMana = mage.currentMana - beforeMana;
    const deltaPopulation = mage.currentPopulation - beforePopuplation;

    const researchItem = Object.values(mage.currentResearch).find(d => {
      if (!d) return false;
      return d.active === true;
    });
    if (researchItem) {
      turnLogs.push({
        type: 'log',
        message: `You are researching ${readableStr(researchItem.id)}`
      });
    }
    if (mage.enchantments.length > 0) {
      turnLogs.push({
        type: 'log',
        message: `You are under the power of ${mage.enchantments.map(d => readableStr(d.spellId)).join(', ')}`
      });
    }
    turnLogs.push({
      type: 'log',
      message: `You gained ${deltaGeld} geld, ${deltaMana} mana, and ${deltaPopulation} population`
    });

    // Save turn chronicle to DB 
    this.adapter.saveChronicles([
      {
        id: mage.id,
        name: mage.name,
        turn: mage.turnsUsed,
        timestamp: Date.now(),
        data: turnLogs 
      }
    ]);
    this.adapter.updateRank({
      id: mage.id,
      name: mage.name,
      magic: mage.magic,
      forts: mage.forts,
      land: totalLand(mage),
      status: '',
      netPower: totalNetPower(mage)
    });

    return turnLogs;
  }

  /**
   * Explore new land (increase in wilderness) 
   * for a number of turns
  **/
  async exploreLand(mage: Mage, num: number) {
    if (num > mage.currentTurn) {
      throw new Error('Insufficient number of turns to perform action');
    }
    let landGained = 0;
    for (let i = 0; i < num; i++) {
      const rate = explorationRate(mage);
      const exploredLand = explore(rate);
      mage.wilderness += exploredLand;
      landGained += exploredLand;
      await this.useTurn(mage);
    }
    await this.adapter.updateMage(mage);
    return landGained
  }

  /**
   * Gelding for num turns
  **/
  async gelding(mage: Mage, num: number) {
    if (num <= 0) {
      throw new Error('Turn usage must be positive');
    }
    if (num > mage.currentTurn) {
      throw new Error('Not enough turns');
    }

    let geldGained = 0;
    for (let i = 0; i < num; i++) {
      const gain = geldIncome(mage);
      geldGained += gain;
      mage.currentGeld += gain;
      await this.useTurn(mage);
    }
    await this.adapter.updateMage(mage);
    return geldGained;
  }

  /**
   * Mana change for a number of turns
  **/
  async manaCharge(mage: Mage, num: number) {
    if (num <= 0) {
      throw new Error('Turn usage must be positive');
    }
    if (num > mage.currentTurn) {
      throw new Error('Not enough turns');
    }

    let manaGained = 0;
    for (let i = 0; i < num; i++) {
      const gain = manaIncome(mage);
      manaGained += gain;
      mage.currentMana += gain;
      if (mage.currentMana > maxMana(mage)) {
        mage.currentMana = maxMana(mage);
      }
      await this.useTurn(mage);
    }
    await this.adapter.updateMage(mage);
    return manaGained;
  }


  async research(mage: Mage, magic: string, focus: boolean, turns: number) {
    if (turns <= 0) {
      throw new Error('Turn usage must be positive');
    }

    allowedMagicList.forEach(m => {
      if (mage.currentResearch[m]) {
        mage.currentResearch[m].active = false;
      }
    });

    mage.currentResearch[magic].active = true;
    mage.focusResearch = focus;

    const before = _.cloneDeep(mage.spellbook);
    if (turns && turns > 0) {
      for (let i = 0; i < turns; i++) {
        doResearch(mage, researchPoints(mage));
        await this.useTurn(mage);
      }
    }
    const after = _.cloneDeep(mage.spellbook);

    // Calculate new spells gained, if any
    const learnedSpells: { [key: string]: string[]} = {};
    const keys = Object.keys(after);
    for (const key of keys) {
      if (before[key]) {
        learnedSpells[key] = _.difference(after[key], before[key]);
      } else {
        learnedSpells[key] = after[key];
      }
    }

    await this.adapter.updateMage(mage);
    return learnedSpells;
  }


  async useItem(mage: Mage, itemId: string, num: number, target: number) {
    const logs: GameMsg[] = [];

    const item = getItemById(itemId);
    if (target) {
      const targetMage = await this.getMage(target);
      for (let i = 0; i < num; i++) {
        if (!mage.items[itemId] || mage.items[itemId] <= 0) {
          logs.push({
            type: 'error',
            message: `No ${itemId} left in your inventory`
          });
          continue;
        } else {
          mage.items[itemId] --;
          if (mage.items[itemId] <= 0) {
            delete mage.items[itemId];
          }
        }

        logs.push(...await this.useItemOpponent(mage, item, targetMage));
        await this.useTurn(mage);
      }
      await this.adapter.updateMage(targetMage);
    } else {
      for (let i = 0; i < num; i++) {
        if (!mage.items[itemId] || mage.items[itemId] <= 0) {
          logs.push({
            type: 'error',
            message: `No ${itemId} left in your inventory`
          });
          continue;
        } else {
          mage.items[itemId] --;
          if (mage.items[itemId] <= 0) {
            delete mage.items[itemId];
          }
        }

        logs.push(...await this.useItemSelf(mage, item));
        await this.useTurn(mage);
      }
    }

    await this.adapter.updateMage(mage);
    return logs;
  }

  async useItemSelf(mage: Mage, item: Item) {
    const logs: GameMsg[] = [];

    // Origin is generaily not used for items
    const origin: EffectOrigin = {
      id: mage.id,
      spellLevel: currentSpellLevel(mage),
      magic: mage.magic,
      targetId: mage.id
    };

    for (const effect of item.effects) {
      if (effect.effectType === 'WishEffect') {
        const result = applyWishEffect(mage, effect as any, origin);
        logs.push(...fromWishEffectResult(result));
      } else if (effect.effectType === 'KingdomResourcesEffect') {
        const result = applyKingdomResourcesEffect(mage, effect as any, origin);
        logs.push(...fromKingdomResourcesEffectResult(result));
      } else if (effect.effectType === 'KingdomBuildingsEffect') {
        const result = applyKingdomBuildingsEffect(mage, effect as any, origin);
        logs.push(...fromKingdomBuildingsEffectResult(result));
      } else if (effect.effectType === 'UnitSummonEffect') {
        const result = this.summonByItem(mage, effect as any, origin);
        logs.push(...result);
      }
    }
    return logs
  }

  async useItemOpponent(mage: Mage, item: Item, targetMage: Mage) {
    const logs: GameMsg[] = [];

    // Origin is generaily not used for items
    const origin: EffectOrigin = {
      id: mage.id,
      spellLevel: currentSpellLevel(mage),
      magic: mage.magic,
      targetId: targetMage.id
    };

    const kingdomResistances = calcKingdomResistance(targetMage);
    if (Math.random() * 100 <= kingdomResistances['barriers']) {
      logs.push({
        type: 'error',
        message: `You item hit the barriers and fizzled.`
      });
      return logs;
    }

    for (const effect of item.effects) {
      if (effect.effectType === 'KingdomResourcesEffect') {
        const result = applyKingdomResourcesEffect(targetMage, effect as any, origin);
        logs.push(...fromKingdomResourcesEffectResult(result));
      } else if (effect.effectType === 'KingdomBuildingsEffect') {
        const result = applyKingdomBuildingsEffect(targetMage, effect as any, origin);
        logs.push(...fromKingdomBuildingsEffectResult(result));
      } else if (effect.effectType === 'StealEffect') {
        const stealResult = applyStealEffect(mage, effect as any, origin, targetMage);
        logs.push(...fromStealEffectResult(stealResult));
      }
    }
    return logs;
  }

  async dispel(mage:Mage, enchantId: string, mana: number) {
    const enchantment = mage.enchantments.find(d => d.id === enchantId);
    let success = false;

    if (mana < 0) {
      throw new Error('Mana for dispel cannot be negative');
    }
    if (!enchantment) {
      throw new Error('No enchantment selected');
    }

    if (enchantment) {
      await this.useTurn(mage);

      mage.currentMana -= mana;
      if (mage.currentMana < 0) {
        mage.currentMana = 0;
      }

      const probability = dispelEnchantment(mage, enchantment, mana);
      if (Math.random() <= probability || enchantment.casterId === mage.id) {
        enchantment.isActive = false;
        success = true;
      }
    }
    await this.adapter.updateMage(mage);
    return success;
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
        continue;
      }
      if (mage.currentTurn < castingTurn) {
        logs.push({
          type: 'error',
          message: `Spell costs ${castingTurn} turns, you only have ${mage.currentTurn}`
        });
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
        castingSuccessful = false;
      }

      // Check if spell past barriers
      if (target) {
        // FIXME: target barriers if applicable
        const targetMage = await this.getMage(target);
        const kingdomResistances = calcKingdomResistance(targetMage);
        if (
          Math.random() * 100 <= kingdomResistances['barriers'] ||
          Math.random() * 100 <= kingdomResistances[spell.magic]
        ) {
          logs.push({
            type: 'error',
            message: `You spell hit the barriers and fizzled.`
          });
          castingSuccessful = false;
        } 
      }

      mage.currentMana -= cost;
      await this.useTurns(mage, spell.castingTurn);

      if (castingSuccessful === false) {
        continue;
      }

      if (attributes.includes('selfOnly')) {
        if (attributes.includes('summon')) {
          const r = await this.summon(mage, spellId);
          if (r.length) logs.push(...r);
        } else if (spell.attributes.includes('enchantment')) {
          const r = await this.enchant(mage, spellId, null);
          if (r.length) logs.push(...r);
        } else if (spell.attributes.includes('instant')) {
          const r = await this.instant(mage, spellId, null);
          if (r.length) logs.push(...r);
        } else {
          throw new Error(`cannot process attributes ${attributes}`);
        }
        await this.adapter.updateMage(mage);
      } else {
        if (target === null) {
          throw new Error(`No target found for casting ${spellId}`);
        }

        const targetMage = await this.getMage(target);
        if (attributes.includes('enchantment')) {
          const r = await this.enchant(mage, spellId, targetMage);
          if (r.length) logs.push(...r);
        } else if (attributes.includes('instant')) {
          const r = await this.instant(mage, spellId, targetMage);
          if (r.length) logs.push(...r);
        }
        await this.adapter.updateMage(mage);
        await this.adapter.updateMage(targetMage);

        const timestamp = Date.now();

        // Target gets notification in log
        this.adapter.saveChronicles([
          {
            id: targetMage.id,
            name: targetMage.name,
            turn: targetMage.turnsUsed,
            timestamp: timestamp,
            data: [
              {
                type: 'log',
                message: `${mage.name} (# ${mage.id}) casted ${readableStr(spellId)} on your kingdom`
              }
            ]
          }
        ]);

        // The caster gives a counter, we will use a dummy report
        const reportId = uuidv4();
        const reportSummary: BattleReportSummary = {
          id: reportId,
          timestamp: timestamp,
          attackType: spellId,

          attackerId: mage.id,
          attackerName: mage.name,
          attackerStartingUnits: 0,
          attackerUnitsLoss: 0,
          attackerPowerLoss: 0,
          attackerPowerLossPercentage: 0,

          defenderId: targetMage.id,
          defenderName: targetMage.name,
          defenderStartingUnits: 0,
          defenderUnitsLoss: 0,
          defenderPowerLoss: 0,
          defenderPowerLossPercentage: 0.02,

          isSuccessful: true,
          isDefenderDefeated: targetMage.forts > 0 ? false : true,
          landGain: 0,
          landLoss: 0
        };
        await this.adapter.saveBattleReport(mage.id, reportId, null, reportSummary);
      }
    }
    return logs;
  }

  /**
   * instant harmful or beneficial effects
  **/
  async instant(mage: Mage, spellId: string, targetMage: Mage | null) {
    const spell = getSpellById(spellId);
    const origin: EffectOrigin = {
      id: mage.id,
      spellLevel: currentSpellLevel(mage),
      magic: mage.magic,
      targetId: targetMage ? targetMage.id : mage.id
    };
    const logs: GameMsg[] = [];

    if (targetMage === null) {
      for (const effect of spell.effects) {
        if (effect.effectType === 'KingdomResourcesEffect') {
          const result = applyKingdomResourcesEffect(mage, effect as any, origin);
          logs.push(...fromKingdomResourcesEffectResult(result));
        } else if (effect.effectType === 'KingdomBuildingsEffect') {
          const result = applyKingdomBuildingsEffect(mage, effect as any, origin);
          logs.push(...fromKingdomBuildingsEffectResult(result));
        } else if (effect.effectType === 'WishEffect') {
          const wishResult = applyWishEffect(mage, effect as any, origin);
          logs.push(...fromWishEffectResult(wishResult));
        } else if (effect.effectType === 'RemoveEnchantmentEffect') {
          const result = applyRemoveEnchantmentEffect(mage, effect as any, origin, null);
          logs.push(...fromRemoveEnchantmentEffectResult(result));
        }
      }
    } else {
      for (const effect of spell.effects) {
        if (effect.effectType === 'KingdomResourcesEffect') {
          const result = applyKingdomResourcesEffect(targetMage, effect as any, origin);
          logs.push(...fromKingdomResourcesEffectResult(result));
        } else if (effect.effectType === 'KingdomBuildingsEffect') {
          const result = applyKingdomBuildingsEffect(targetMage, effect as any, origin);
          logs.push(...fromKingdomBuildingsEffectResult(result));
        } else if (effect.effectType === 'StealEffect') {
          const stealResult = applyStealEffect(mage, effect as any, origin, targetMage);
          logs.push(...fromStealEffectResult(stealResult));
        } else if (effect.effectType === 'RemoveEnchantmentEffect') {
          const result = applyRemoveEnchantmentEffect(mage, effect as any, origin, targetMage);
          logs.push(...fromRemoveEnchantmentEffectResult(result));
        }
      }
    }
    return logs;
  }

  async enchant(mage: Mage, spellId: string, targetMage: Mage | null) {
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
      id: uuidv4(),
      casterId: mage.id,
      casterMagic: mage.magic,
      targetId: mage.id,

      spellId: spell.id,
      // spellMagic: spell.magic,
      spellLevel: currentSpellLevel(mage),

      isActive: true,
      isEpidemic: spell.attributes.includes('epidemic'),
      isPermanent: spell.life > 0 ? false : true,
      life: spell.life ? spell.life : 0
    }

    if (targetMage === null) {
      mage.enchantments.push(enchantment);
      console.log('cast enchantment', enchantment);
      await this.adapter.updateMage(mage);
      result.push({
        type: 'log',
        message: `You cast ${spell.name} on yourself`
      });
      return result;
    } else {
      targetMage.enchantments.push(enchantment);
      console.log('cast enchantment', enchantment);
      await this.adapter.updateMage(targetMage);
      result.push({
        type: 'log',
        message: `You cast ${spell.name} on ${targetMage.id}`
      });
      return result;
    }
  }

  summonByItem(mage: Mage, effect: UnitSummonEffect, origin: EffectOrigin) {
    const logs: GameMsg[] = [];
    const res = summonUnit(effect, origin);
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

      logs.push({
        type: 'log',
        message: `Summoned ${res[key]} ${key} into your army`
      });
    });
    return logs;
  }

  async summon(mage: Mage, spellId: string) {
    const spell = getSpellById(spellId);
    const result: GameMsg[] = [];

    const effects: UnitSummonEffect[] = spell.effects as UnitSummonEffect[];
    effects.forEach(effect => {
      const res = summonUnit(effect, {
        id: mage.id,
        magic: mage.magic,
        spellLevel: currentSpellLevel(mage),
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
      if (payload[b.id] < 0) {
        throw new Error(`Building ${b.id} amount cannot be negative`);
      }
      landUsed += payload[b.id];
      turnsUsed += payload[b.id] /  buildingRate(mage, b.id);
    });
    turnsUsed = Math.ceil(turnsUsed);
    landUsed = Math.ceil(landUsed);

    if (landUsed > mage.wilderness) {
      throw new Error(`Not enough wilderness to construct buildings`);
    }
    if (turnsUsed > mage.currentTurn) {
      throw new Error('Insufficient number of turns to perform action');
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
      await this.useTurn(mage);
    }
    await this.adapter.updateMage(mage);
  }

  async destroy(mage: Mage, payload: DestroyPayload) {
    buildingTypes.forEach(b => {
      const num = payload[b.id];
      if (num < 0) {
        throw new Error(`Building ${num} amount cannot be negative`);
      }
      if (num > mage[b.id]) {
        throw new Error(`Cannot destroy more buildings than you have`);
      }
      if (b.id === 'forts' && num >= mage[b.id]) {
        throw new Error(`Cannot destroy forts down to 0`);
      }

      mage[b.id] -= num;
      mage.wilderness += num;
    });
    await this.useTurn(mage);
    await this.adapter.updateMage(mage);
  }

  async setAssignment(mage: Mage, payload: Assignment) {
    mage.assignment = _.cloneDeep(payload);
    await this.adapter.updateMage(mage);
  }

  async setRecruitments(mage: Mage, payload: ArmyUnit[]) {
    for (const au of payload) {
      if (au.size < 0) {
        throw new Error('Cannot recruit negative amount of units');
      }
      const unit = getUnitById(au.id);

      if (unit.attributes.includes('special') === false) {
        throw new Error(`Cannot recruit ${unit.id}`);
      }

      if (unit.magic !== mage.magic && unit.magic !== 'plain') { 
        throw new Error(`Cannot recruit ${unit.id}`);
      }
    }
    
    mage.recruitments = _.cloneDeep(payload);
    await this.adapter.updateMage(mage);
  }

  async disbandUnits(mage: Mage, payload: { [key: string]: ArmyUnit }) {
    Object.values(payload).forEach(au => {
      if (au.size < 0) {
        throw new Error('Cannot disband negative amount of units');
      }

      const existingArmyUnit = mage.army.find(d => d.id === au.id);
      if (!existingArmyUnit) {
        throw new Error(`Cannot disband non-existing unit ${au.id}`);
      }
      if (existingArmyUnit.size < au.size) {
        throw new Error('Cannot disband more units than you have');
      }
    });

    mage.army.forEach(armyUnit => {
      const u = payload[armyUnit.id];
      if (!u) return;

      const unit = getUnitById(u.id);

      if (u && unit.attributes.includes('undisbandable') === false) {
        armyUnit.size -= u.size;
        armyUnit.size = Math.max(0, armyUnit.size);
      }
    });
    mage.army = mage.army.filter(d => d.size > 0);
    await this.adapter.updateMage(mage);
  }

  async rankList(_listingType: string): Promise<MageRank[]> {
    return this.adapter.getRankList();
  }

  /**
   * Check if
   * - attacker has enough turns
   * - defender mage is not defeated
   * - defender mage is not damaged
   * - in attack range
  **/
  async preBattleCheck(
    mage: Mage, 
    targetId: number, 
    battleType: 'siege' | 'regular' | 'pillage' 
  ): Promise<string[]>  {
    const errors = [];
    const defenderMage = await this.getMage(targetId);

    if (mage.currentTurn < 2) {
      errors.push('Need at least 2 turns to make an attack');
    }
    if (defenderMage.status === 'defeated') {
      errors.push('Target mage is already defeated');
    }

    // now check for counter status, which negates the next checks
    const end = Date.now();
    const start = end - 86400000;
    const prevAttacks = await this.adapter.getBattles({
      attackerId: mage.id,
      defenderId: defenderMage.id,
      startTime: start,
      endTime: end
    });

    const prevDefends = await this.adapter.getBattles({
      attackerId: defenderMage.id,
      defenderId: mage.id,
      startTime: start,
      endTime: end
    });

    const percentDamageDealt = prevAttacks.reduce((acc, battle) => {
      return battle.defenderPowerLossPercentage + acc;
    }, 0);

    const percentDamageReceived = prevDefends.reduce((acc, battle) => {
      return battle.defenderPowerLossPercentage + acc;
    }, 0);

    // Damage owed, no need to proceed with status or range check
    if (percentDamageDealt < percentDamageReceived) {
      return errors;
    }

    if (defenderMage.status === 'damaged') {
      errors.push('Target mage is in damaged status');
    }

    // Check if opponent is in allowable range
    const attackerNP = totalNetPower(mage);
    const defenderNP = totalNetPower(defenderMage);

    if (
      (attackerNP * gameTable.war.range.max) < defenderNP ||
      (attackerNP * gameTable.war.range.min) > defenderNP
    ) {
      console.warn(`${defenderMage.id} not in range of ${mage.id}`);
      errors.push(`${mageName(defenderMage)} is not in your attack range`);
    }
    return errors;
  }


  async doBattle(
    mage: Mage, 
    targetId: number, 
    battleType: 'siege' | 'regular' | 'pillage', 
    stackIds: string[], 
    spellId: string, 
    itemId: string
  ) {
    const defenderMage = await this.getMage(targetId);
    const MAX_STACKS = 10;


    // For attacker, the army is formed by selected ids
    const aBattleStackIds = stackIds.slice(0, MAX_STACKS);
    const attackerArmy = mage.army.filter(s => aBattleStackIds.includes(s.id));
    const attacker: Combatant =  {
      mage: mage,
      spellId: spellId,
      itemId: itemId,
      army: attackerArmy
    };

    // For defender, the army is formed by up to 10 stacks sorted by modified power rank
    //  FIXME: For pillage order by stack size instead of stack power
    const dBattleStackIds = prepareBattleStack(defenderMage.army, 'defender')
      .map(d => { return d.unit.id; })
      .slice(0, MAX_STACKS);
    const defenderArmy = defenderMage.army.filter(s => dBattleStackIds.includes(s.id));
    const defender: Combatant = {
      mage: defenderMage,
      spellId: '',
      itemId: '',
      army: defenderArmy
    };


    // Check if pillage is successful
    if (battleType === 'pillage') {
    } else {
      // Check if defense assignment is triggered
      const attackerArmyNP = totalArmyPower(attacker.army);
      const defenderArmyNP = totalArmyPower(defender.army);

      if (defender.mage.type === 'bot') {
        const botAssignment = getBotAssignment(defender.mage.magic as any);
        defender.spellId = botAssignment.spellId;
        defender.itemId = botAssignment.itemId;
      } else {
        const ratio = 100 * (attackerArmyNP / defenderArmyNP);
        const assignment = defender.mage.assignment;
        if (assignment.spellCondition > -1 && ratio >= assignment.spellCondition) {
          defender.spellId = assignment.spellId;
        }
        if (assignment.itemCondition > -1 && ratio >= assignment.itemCondition) {
          defender.itemId = assignment.itemId;
        }
      }
    }

    let isPillageSuccess = false;
    if (battleType === 'pillage') {
      const defenderLand = totalLand(defenderMage)
      const defenderArmySize = totalUnits(defenderMage);
      const attackerAmrySize = attackerArmy[0].size;
      const rate = calcPillageProbability(
        attackerAmrySize,
        defenderArmySize,
        defenderLand
      )
      isPillageSuccess = Math.random() <= rate;
    }


    // Right now we simulate battle as follows
    // - it ake one turn to go attack, and 
    // - it takes one turn to return home
    //
    // Bots do not take turns
    if (mage.type !== 'bot') {
      await this.useTurn(mage);
    }

    const battleReport = isPillageSuccess === false? 
      battle(battleType, attacker, defender):
      successPillage(attacker, defender);
    resolveBattle(mage, defenderMage, battleReport);

    if (mage.type !== 'bot') {
      await this.useTurn(mage);
    }

    const reportSummary: BattleReportSummary = {
      id: battleReport.id,
 
      timestamp: battleReport.timestamp,
      attackType: battleReport.attackType,

      attackerId: battleReport.attacker.id,
      attackerName: battleReport.attacker.name,
      attackerStartingUnits: battleReport.result.attacker.startingUnits,
      attackerUnitsLoss: battleReport.result.attacker.unitsLoss,
      attackerPowerLoss: 0,
      attackerPowerLossPercentage: 0,

      defenderId: battleReport.defender.id,
      defenderName: battleReport.defender.name,
      defenderStartingUnits: battleReport.result.defender.startingUnits,
      defenderUnitsLoss: battleReport.result.defender.unitsLoss,
      defenderPowerLoss: 0,
      defenderPowerLossPercentage: 0,

      isSuccessful: battleReport.result.isSuccessful,
      isDefenderDefeated: battleReport.result.isDefenderDefeated,

      landGain: battleReport.result.landGain,
      landLoss: battleReport.result.landLoss
    };

    const result = battleReport.result;
    reportSummary.attackerPowerLoss = Math.max(0, (result.attacker.startNetPower - result.attacker.endNetPower));
    reportSummary.defenderPowerLoss = Math.max(0, (result.defender.startNetPower - result.defender.endNetPower));
    reportSummary.attackerPowerLossPercentage = reportSummary.attackerPowerLoss / result.attacker.startNetPower;
    reportSummary.defenderPowerLossPercentage = reportSummary.defenderPowerLoss / result.defender.startNetPower;

    // Log 2% for every pillage
    if (battleType === 'pillage' && isPillageSuccess === true) {
      reportSummary.defenderPowerLossPercentage = 0.02;
    }

    // epidemic: attacker to defender
    mage.enchantments.forEach(enchantment => {
      if (enchantment.isEpidemic && Math.random() < EPIDEMIC_RATE) {
        const existingEnchantment = defenderMage.enchantments.find(d => {
          return d.spellId === enchantment.spellId;
        });
        if (!existingEnchantment) {
          defenderMage.enchantments.push(_.cloneDeep(enchantment));
        }
      }
    });

    // epidemic: defender to attacker
    defenderMage.enchantments.forEach(enchantment => {
      if (enchantment.isEpidemic && Math.random() < EPIDEMIC_RATE) {
        const existingEnchantment = mage.enchantments.find(d => {
          return d.spellId === enchantment.spellId;
        });
        if (!existingEnchantment) {
          mage.enchantments.push(_.cloneDeep(enchantment));
        }
      }
    });

    await this.adapter.saveBattleReport(mage.id, battleReport.id, battleReport, reportSummary);

    await this.adapter.updateMage(mage);

    await this.adapter.updateMage(defenderMage);


    this.adapter.updateRank({
      id: defenderMage.id,
      name: defenderMage.name,
      magic: defenderMage.magic,
      forts: defenderMage.forts,
      land: totalLand(defenderMage),
      status: '',
      netPower: totalNetPower(defenderMage)
    });


    let verb = 'sieged';
    if (battleType === 'regular') {
      verb = 'attacked';
    } else if (battleType === 'pillage') {
      verb = 'pillaged';
    }

    // FIXME: Update turn chronicles for participting mages,
    // unless the mage is a bot
    if (mage.type !== 'bot') {
      this.adapter.saveChronicles([{
        id: mage.id,
        name: mage.name,
        turn: mage.turnsUsed,
        timestamp: battleReport.timestamp,
        data: [
          {
            type: 'battleLog', 
            id: battleReport.id,
            message: `You ${verb} ${defenderMage.name} (#${defenderMage.id})'s kingdom`
          }
        ]
      }]);
    }
    if (defenderMage.type !== 'bot') {
      this.adapter.saveChronicles([{
        id: defenderMage.id,
        name: defenderMage.name,
        turn: defenderMage.turnsUsed,
        timestamp: battleReport.timestamp,
        data: [
          {
            type: 'battleLog',
            id: battleReport.id,
            message: `${mage.name} (#${mage.id}) ${verb} your kingdom`
          }
        ]
      }])
    }
    return battleReport;
  }

  async getBattleReport(mage: Mage, reportId: string) {
    const report = await this.adapter.getBattleReport(reportId);

    if (gameTable.war.obfuscateReport === false) {
      return report
    }

    // Obfuscate defender army
    if (mage.id === report.attacker.id) {
      report.defender.army.forEach(d => {
        d.size = null;
      });
    }

    // Obfuscate attacker army
    if (mage.id === report.defender.id) {
      report.attacker.army.forEach(d => {
        d.size = null;
      })
    }
    return report;

    /*
    if (report) {

      if (typeof report === 'string') {
        return JSON.parse(report) as BattleReport;
      } else {
        return report;
      }
    } else {
      return null;
    }
    */
  }

  async getMageBattles(mage: Mage) {
    return await this.adapter.getBattles({ 
      mageId: mage.id,
      endTime: Date.now(),
      startTime: Date.now() - (24 * 60 * 60 * 1000),
      limit: 100
    });
  }

  async getChronicles(mage: Mage) {
    return await this.adapter.getChronicles({ 
      mageId: mage.id,
      limit: 30
    });
  }

  async register(username: string, password: string, magic: string, override?: Partial<Mage>) {
    // 1. register player
    const res = await this.adapter.register(username, password);

    // 2. return mage
    const newId = await this.adapter.nextMageId();
    let mage = createMage(newId, username, magic, override);

    // 3. Write to data store
    mage = await this.adapter.createMage(username, mage);
    
    await this.adapter.createRank({
      id: mage.id,
      name: mage.name,
      magic: mage.magic,
      forts: mage.forts,
      land: totalLand(mage),
      status: '',
      netPower: totalNetPower(mage)
    });
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
      rank: m.rank,
      status: m.status,
      land: totalLand(m),
      netPower: totalNetPower(m),
      forts: m.forts
    };
  }

  async getMages(ids: number[]) {
    const results:{ [key: number]: any } = {};
    // FIXME: replace with rank_view lookup
    for (const id of ids) {
      const m = await this.getMage(id);
      results[m.id] = {
        id: m.id,
        name: m.name,
        magic: m.magic,
        land: totalLand(m),
        netPower: totalNetPower(m),
        forts: m.forts
      };
    }
    return results;
  }

  async getMageByUser(username: string) {
    return this.adapter.getMageByUser(username);
  }

  async getGameTable() {
    return _.clone(gameTable);
  }

  async initializeMarket() {
    const mp = await this.adapter.getMarketPrices();
    if (mp.length > 0) return;

    const defaultPrice = 1000000;
    console.log('initialize market pricing');
    const items = getAllItems();
    for (const item of items) {
      await this.adapter.createMarketPrice(
        item.id,
        'item',
        defaultPrice
      )
    }

    console.log('seeding market items');
    for (let i = 0; i < 10; i++) {
      const item = getRandomItem();
      await this.adapter.addMarketItem({
        id: uuidv4(),
        priceId: item.id,
        basePrice: defaultPrice,
        mageId: null,
        expiration: this.currentTurn + betweenInt(20, 50)
      });
    }
  }

  async getMarketItems(): Promise<MarketItem[]> {
    return this.adapter.getMarketItems();
  }

  // FIXME: error messages
  async makeMarketBids(mageId: number, bids: Bid[]): Promise<Mage> {
    const mage = await this.adapter.getMage(mageId);

    for (const bid of bids) {
      const item = await this.adapter.getMarketItem(bid.marketId);

      if (!item) {
        continue;
      }

      if (bid.bid > mage.currentGeld) {
        continue;
      }
      if (bid.bid <= item.basePrice || bid.bid <= 0) {
        continue;
      }

      await this.adapter.addMarketBid({
        id: uuidv4(),
        marketId: bid.marketId,
        mageId: mageId,
        bid: bid.bid
      });
      mage.currentGeld -= bid.bid;
    }

    await this.useTurn(mage);
    await this.adapter.updateMage(mage);
    return mage;
  }

  async getMarketBids(priceId: string) {
    return this.adapter.getMarketBids(priceId);
  }
}

export { Engine };
