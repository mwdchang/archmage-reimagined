import _  from 'lodash';
import { 
  loadUnitData,
  loadSpellData,
  loadItemData,
  getSpellById,
  getItemById,
  initializeResearchTree, 
  magicTypes,
  getUnitById,
} from './base/references';
import { 
  createMage, 
  totalLand,
  totalNetPower
} from './base/mage';
import { DataAdapter } from 'data-adapter/src/data-adapter';
import { ArmyUnit, Assignment, Enchantment, Mage } from 'shared/types/mage';
import { BattleReport, BattleReportSummary } from 'shared/types/battle';
import { 
  BuildPayload,
  DestroyPayload
} from 'shared/types/api';
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
  recruitmentAmount
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
  enchantmentUpkeep
} from './magic';
import { battle, resolveBattleAftermath, Combatant } from './war';
import { UnitSummonEffect } from 'shared/types/effects';

import { randomInt } from './random';

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

  constructor(adapter: DataAdapter) {
    // Load dependencies
    this.adapter = adapter;
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

      if (!this.getMageByUser(name)) {
        console.log('creating test mage', name);
        const mage = createMage(name, magic);
        this.adapter.createMage(name, mage);
      }
    }

    this.updateRankList();

    // Start loop
    setTimeout(() => {
      this.updateLoop();
    }, TICK);
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

  // Use one turn for a mage
  useTurn(mage: Mage) {
    // 1. use turn
    mage.currentTurn --;

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
    

    // 5. calculate upkeep
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
  }

  async useItem(mage: Mage, itemId: string, num: number, target: number) {
    const item = getItemById(itemId);
    if (item.attributes.includes('summon')) {
      return this.summonByItem(mage, itemId, num);
    }
  }

  async castSpell(mage: Mage, spellId: string, num: number, target: number) {
    const spell = getSpellById(spellId);
    if (spell.attributes.includes('summon')) {
      return this.summon(mage, spellId, num);
    } else if (spell.attributes.includes('enchantment')) {
      return this.enchant(mage, spellId, target);
    }

    // TODO: offensive spells
  }

  async enchant(mage: Mage, spellId: string, target: number) {
    const spell = getSpellById(spellId);
    const castingTurn = spell.castingTurn;
    let cost = castingCost(mage, spellId);
    const result: GameMsg[] = [];
    const rate = successCastingRate(mage, spellId);

    // Insufficient mana
    if (mage.currentMana < cost) {
      result.push({
        type: 'error',
        message: `Spell costs ${cost} mana, you only have ${mage.currentMana}`
      });
      return result;
    }
    mage.currentMana -= cost;

    // Casting failed
    if (Math.random() * 100 > rate) {
      result.push({
        type: 'error',
        message: `You lost your concentration`
      });
      this.useTurns(mage, castingTurn);
      return result;
    }

    // Spell already exists and not from 0
    if (mage.enchantments.find(d => d.spellId === spellId && d.casterId !== 0)) {
      result.push({
        type: 'error',
        message: `The spell is alrady in effect, your attempt fizzled`
      });
      this.useTurns(mage, castingTurn);
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

      isPermanent: spell.life > 0 ? true : false,
      life: spell.life ? spell.life : 0
    }
    mage.enchantments.push(enchantment);
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
        const res = summonUnit(mage, effect);

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
    return result;
  }

  async summon(mage: Mage, spellId: string, num: number) {
    const spell = getSpellById(spellId);
    const castingTurn = spell.castingTurn;
    const cost = castingCost(mage, spellId);
    const result: GameMsg[] = [];

    for (let i = 0; i < num; i++) {
      if (mage.currentMana < cost) {
        result.push({
          type: 'error',
          message: `Spell costs ${cost} mana, you only have ${mage.currentMana}`
        });
        continue;
      }
      if (mage.currentTurn < castingTurn) {
        result.push({
          type: 'error',
          message: `Spell costs ${castingTurn} turns, you only have ${mage.currentTurn}`
        });
        continue;
      }

      // result.push(res);
      mage.currentMana -= cost;

      const rate = successCastingRate(mage, spellId);
      if (Math.random() * 100 > rate) {
        result.push({
          type: 'error',
          message: `You lost your concentration`
        });
      } else {
        const effects: UnitSummonEffect[] = spell.effects as UnitSummonEffect[];
        effects.forEach(effect => {
          const res = summonUnit(mage, effect);
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
      }
      this.useTurns(mage, castingTurn);
    }
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
  }

  async destroy(mage: Mage, payload: DestroyPayload) {
    buildingTypes.forEach(b => {
      const num = payload[b.id];
      mage[b.id] -= num;
      mage.wilderness += num;
    });
    this.useTurn(mage);
  }

  async setAssignment(mage: Mage, payload: Assignment) {
    mage.assignment = _.cloneDeep(payload);
  }

  async setRecruitments(mage: Mage, payload: ArmyUnit[]) {
    mage.recruitments = _.cloneDeep(payload);
  }

  async updateRankList() {
    const mages = this.adapter.getAllMages();
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
  }

  async rankList(_listingType: string) {
    const mages = this.adapter.getAllMages();

    const ranks = mages.map(mage => {
      return {
        id: mage.id,
        name: mage.name,
        magic: mage.magic,
        forts: mage.forts,
        land: totalLand(mage),
        netPower: totalNetPower(mage)
      }
    });
    return _.orderBy(ranks, d => -d.netPower);
  }


  async doBattle(mage: Mage, targetId: number, stackIds: string[], spellId: string, itemId: string) {
    const defenderMage = this.getMage(targetId);

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

    const battleReport = battle('siege', attacker, defender);
    resolveBattleAftermath('siege', mage, defenderMage, battleReport);

    const reportSummary: BattleReportSummary = {
      id: battleReport.id,
      timestamp: battleReport.timestamp,
      attackType: 'siege',
      attackerId: battleReport.attacker.id,
      defenderId: battleReport.defender.id,
      summaryLogs: battleReport.summaryLogs
    };

    this.adapter.saveBattleReport(mage.id, battleReport.id, battleReport, reportSummary);
    return battleReport;
  }

  async getBattleReport(mage: Mage, reportId: string) {
    // TODO: Obfuscate based on which side

    const report = this.adapter.getBattleReport(reportId);
    if (report) {
      return JSON.parse(report) as BattleReport;
    } else {
      return null;
    }
  }

  async getMageBattles(mage: Mage) {
    return this.adapter.getMageBattles(mage.id, {});
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

  async login(username: string, password: string) {
    // 1. check login
    const res = await this.adapter.login(username, password);
    if (!res) {
      return { user: null, mage: null }
    }

    // 2. return mage
    const mage = this.adapter.getMageByUser(username);
    if (!mage) {
      return { user: res.user, mage: null }
    }
    return { user: res.user, mage };
  }

  getMage(id: number) {
    return this.adapter.getMage(id);
  }

  getMageSummary(id: number) {
    const m = this.getMage(id);

    return {
      id: m.id,
      name: m.name,
      magic: m.magic,
      land: totalLand(m),
      netPower: totalNetPower(m),
      forts: m.forts
    };
  }

  getMageByUser(username: string) {
    return this.adapter.getMageByUser(username);
  }
}

export { Engine };
