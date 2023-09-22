import _  from 'lodash';
import { 
  loadUnitData,
  loadSpellData,
  loadItemData,
  getSpellById,
  initializeResearchTree, 
  magicTypes
} from './base/references';
import { 
  createMage, 
  totalLand,
  totalNetPower,
} from './base/mage';
import { DataAdapter } from 'data-adapter/src/data-adapter';
import { Mage } from 'shared/types/mage';
import { 
  BuildPayload,
  DestroyPayload
} from 'shared/types/api';
import { 
  explore,
  explorationRate,
  maxPopulation,
  buildingTypes,
  buildingRate,
  populationIncome,
  geldIncome
} from './interior';
import { 
  doResearch,
  summonUnit,
  researchPoints,
  manaIncome,
  manaStorage,
  doItemGeneration,
maxMana
} from './magic';
import { battle, Combatant } from './war';

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
      const mage = createMage(name, magic);
      this.adapter.createMage(name, mage);
    }

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
    setTimeout(() => {
      this.updateLoop()
    }, TICK);
  }

  // Use one turn for a mage
  useTurn(mage: Mage) {
    // 1. use turn
    mage.currentTurn --;

    // 2. calculate income
    mage.currentGeld += geldIncome(mage);
    mage.currentPopulation += populationIncome(mage);
    mage.currentMana += manaIncome(mage);
    if (mage.currentPopulation >= maxPopulation(mage)) {
      mage.currentPopulation = maxPopulation(mage);
    }
    if (mage.currentMana > manaStorage(mage)) {
      mage.currentMana = manaStorage(mage);
    }

    // 3. calculate research, if applicable
    doResearch(mage, researchPoints(mage));
    doItemGeneration(mage);

    // 4. calculate upkeep
    
    // 5. enchantmentR
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

  async summon(mage: Mage, spellId: string, num: number) {
    const spell = getSpellById(spellId);
    const castingTurn = spell.castingTurn;
    const castingCost = spell.castingCost;

    const result = [];
    for (let i = 0; i < num; i++) {
      const res = summonUnit(mage, spellId);
      result.push(res);
      mage.currentMana -= castingCost; // TODO: magic modifiers
      mage.currentTurn -= castingTurn;

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
      });

      for (let j = 0; j < castingTurn; j++) {
        this.useTurn(mage);
      }
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

  async rankList(_listingType: string) {
    const mages = this.adapter.getAllMages();

    const ranks = mages.map(mage => {
      return {
        id: mage.id,
        name: mage.name,
        magic: mage.magic,
        fortresses: mage.fortresses,
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

    // FIXME: do assignment
    const defender: Combatant = {
      mage: defenderMage,
      spellId: '',
      itemId: '',
      army: defenderMage.army
    };
    battle('siege', attacker, defender);
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
      fortresses: m.fortresses
    };
  }

  getMageByUser(username: string) {
    return this.adapter.getMageByUser(username);
  }
}

export { Engine };
