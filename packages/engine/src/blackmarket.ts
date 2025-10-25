import { v4 as uuidv4 } from 'uuid';
import { DataAdapter } from "data-adapter/src/data-adapter";
import { gameTable } from "./base/config"
import { getAllSpells, getRandomItem, getSpellById } from "./base/references";
import { betweenInt, randomInt } from "./random";
import { MarketBid, MarketItem, MarketPrice } from 'shared/types/market';
import { Mage } from 'shared/types/mage';
import { nextResearch } from './magic';

export const priceIncrease = (base: number, winningBid: number) => {
  return base + gameTable.blackmarket.priceIncreaseFactor * (winningBid - base);
}

export const priceDecrease = (base: number) => {
  return base * (1 - gameTable.blackmarket.priceDecreaseFactor);
}

export const getMarketableSpells = () => {
  const candidateSpells = getAllSpells().filter(spell => {
    // return spell.rank !== 'ultimate' && spell.rank !== 'simple';
    return spell.rank !== 'ultimate'; 
  });
  return candidateSpells;
}

export const getRandomMarketableSpell = () => {
  const candidateSpells = getMarketableSpells();
  return candidateSpells[randomInt(candidateSpells.length)];
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
  const priceUpdate: Map<string, MarketPrice> = new Map();

  for (const bid of winningBids) {
    const marketItem = itemMap.get(bid.marketId);
    const marketPrice = priceMap.get(marketItem.priceId);

    if (!mageMap.has(bid.mageId)) {
      const m = await adapter.getMage(bid.mageId);
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
  await adapter.cleanupMarket(currentTurn);

  // update prices and mages
  for (const p of priceUpdate.values()) {
    await adapter.updateMarketPrice(p.id, p.price);
  }
  for (const m of mageMap.values()) {
    await adapter.updateMage(m);
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
  for (let i = 0; i < 5; i++) {
    if (Math.random() > 0.7) {
      const item = getRandomItem();

      if (priceMap.has(item.id) === false) {
        continue;
      }

      await adapter.addMarketItem({
        id: uuidv4(),
        priceId: item.id,
        basePrice: priceMap.get(item.id).price,
        mageId: null,
        expiration: currentTurn + betweenInt(20, 50)
      });
    }
  }

  // Generate new spellbooks
  for (let i = 0; i < 2; i++) {
    if (Math.random() > 0.9) {
      const spell = getRandomMarketableSpell();
      if (priceMap.has(spell.id) === false) {
        continue;
      }
      await adapter.addMarketItem({
        id: uuidv4(),
        priceId: spell.id,
        basePrice: priceMap.get(spell.id).price,
        mageId: null,
        expiration: currentTurn + betweenInt(20, 50)
      });
    }
  }
}
