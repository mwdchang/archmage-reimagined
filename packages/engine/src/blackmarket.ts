import { v4 as uuidv4 } from 'uuid';
import { DataAdapter } from "data-adapter/src/data-adapter";
import { gameTable } from "./base/config"
import { getAllSpells, getAllUnits, getRandomItem, getSpellById } from "./base/references";
import { betweenInt, randomBM, randomInt } from "./random";
import { MarketBid, MarketItem, MarketPrice } from 'shared/types/market';
import { Mage } from 'shared/types/mage';
import { nextResearch } from './magic';

export const priceIncrease = (base: number, winningBid: number) => {
  return base + gameTable.blackmarket.priceIncreaseFactor * (winningBid - base);
}

export const priceDecrease = (base: number) => {
  return base * (1 - gameTable.blackmarket.priceDecreaseFactor);
}

// Spellbooks
export const getMarketableSpells = () => {
  const candidateSpells = getAllSpells().filter(spell => {
    return spell.rank !== 'ultimate'; 
  });
  return candidateSpells;
}

export const getRandomMarketableSpell = () => {
  const candidateSpells = getMarketableSpells();
  return candidateSpells[randomInt(candidateSpells.length)];
}

// Units
export const getMarketableUnits = () => {
  const candidateUnits = getAllUnits().filter(unit => {
    const attrs = unit.attributes;
    if (attrs.includes('special') || attrs.includes('noMarket')) {
      return false;
    }
    return true;
  });
  return candidateUnits;
}

export const getRandomMarketableUnit = () => {
  const candidateUnits = getMarketableUnits();
  return candidateUnits[randomInt(candidateUnits.length)];
}

/**
 * Resolve market winning bids
 * - Find winning bids
 * - Add items to buyer
 * - Add geld to sellers
 * - Update pricing
 * - Remove all expired items
**/
export const resolveWinningBids = async (
  currentTurn: number, 
  winningBids: MarketBid[],
  priceMap: Map<string, MarketPrice>,
  itemMap: Map<string, MarketItem>,
  adapter: DataAdapter
) => {
  const mageMap: Map<number, Mage> = new Map();
  const mageMessageMap: Map<number, string[]> = new Map();

  const priceUpdate: Map<string, MarketPrice> = new Map();

  for (const bid of winningBids) {
    const marketItem = itemMap.get(bid.marketId);
    const marketPrice = priceMap.get(marketItem.priceId);

    if (!mageMap.has(bid.mageId)) {
      const m = await adapter.getMage(bid.mageId);
      mageMap.set(bid.mageId, m);
      mageMessageMap.set(bid.mageId, []);
    }
    const mage = mageMap.get(bid.mageId);
    mageMessageMap.get(mage.id).push(`You won ${marketPrice.id} for ${bid.bid}`);

    // Resolve item
    if (marketPrice.type === 'item') {
      if (mage.items[marketPrice.id]) {
        mage.items[marketPrice.id] ++;
      } else {
        mage.items[marketPrice.id] = 1;
      }
    } else if (marketPrice.type === 'spell') {
      const spell = getSpellById(marketPrice.id);

      // Add to spell book
      if (!mage.spellbook[spell.magic].includes(spell.id)) {
        mage.spellbook[spell.magic].push(spell.id);
      }

      // If spell bought is the current research, we need to roll over to
      // the next spell if applicable
      if (mage.currentResearch[spell.magic] && mage.currentResearch[spell.magic].id === spell.id) {
        mage.currentResearch[spell.magic] = null;
        nextResearch(mage, spell.magic);
      }
    } else if (marketPrice.type === 'unit') {
      const size = marketItem.extra?.size;
      const unitId = marketPrice.id;

      const stack = mage.army.find(d => d.id === unitId);
      if (stack) {
        stack.size += size;
      } else {
        mage.army.push({
          id: unitId,
          size: size
        });
      }
    }

    // Resolve if the item sold came from a mage instead of generated
    if (marketItem.mageId) {
      if (!mageMap.has(marketItem.mageId)) {
        const m = await adapter.getMage(bid.mageId);
        mageMap.set(bid.mageId, m);
      }
      const mage2 = mageMap.get(bid.mageId);
      mage2.currentGeld += marketItem.basePrice;
    }

    marketPrice.price = priceIncrease(marketPrice.price, bid.bid);
    priceUpdate.set(marketPrice.id, marketPrice);
  }

  // delete market bids and delete market items
  await adapter.removeMarketBids(winningBids.map(d => d.id));

  // TODO: Send messages to mages
  const lostBids = await adapter.getExpiredBids(currentTurn);

  await adapter.cleanupMarket(currentTurn);

  // update prices and mages
  for (const p of priceUpdate.values()) {
    await adapter.updateMarketPrice(p.id, p.price);
  }
  for (const m of mageMap.values()) {
    await adapter.updateMage(m);
    adapter.saveMail({
      id: uuidv4(),
      read: false,
      timestamp: Date.now(),
      type: 'market',
      priority: 100,
      source: -1,
      target: m.id,
      subject: `[Blackmarket] winning bids for turn - ${currentTurn}`,
      content: mageMessageMap.get(m.id).join('\n')
    });
  }
}


/**
 * Generate new market items for the next turn
**/
export const generateMarketItems = async (
  currentTurn: number, 
  priceMap: Map<string, MarketPrice>,
  adapter: DataAdapter
) => {
  // Generate new items
  for (let i = 0; i < 4; i++) {
    if (Math.random() > 0.75) {
      const item = getRandomItem();
      if (priceMap.has(item.id) === false) {
        continue;
      }

      await adapter.addMarketItem({
        id: uuidv4(),
        priceId: item.id,
        basePrice: priceMap.get(item.id).price,
        mageId: null,
        expiration: currentTurn + betweenInt(30, 60)
      });
    }
  }

  // Generate new spellbooks
  if (Math.random() > 0.95) {
    const spell = getRandomMarketableSpell();
    if (priceMap.has(spell.id) === true) {
      await adapter.addMarketItem({
        id: uuidv4(),
        priceId: spell.id,
        basePrice: priceMap.get(spell.id).price,
        mageId: null,
        expiration: currentTurn + betweenInt(30, 60)
      });
    }
  }

  // Generate new unit
  if (Math.random() > 0.80) {
    const unit = getRandomMarketableUnit();
    if (priceMap.has(unit.id) === true) {
      const np = 40000 + Math.floor(60000 * randomBM());
      const size = Math.ceil(np / unit.powerRank);

      await adapter.addMarketItem({
        id: uuidv4(),
        priceId: unit.id,
        basePrice: priceMap.get(unit.id).price,
        extra: { size },
        mageId: null,
        expiration: currentTurn + betweenInt(30, 60)
      });
    }
  }
}
