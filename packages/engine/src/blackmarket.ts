import { v4 as uuidv4 } from 'uuid';
import { DataAdapter } from "data-adapter/src/data-adapter";
import { gameTable } from "./base/config"
import { getAllSpells, getAllUnits, getRandomItem, getSpellById } from "./base/references";
import { betweenInt, randomBM, randomInt } from "./random";
import { MarketBid, MarketItem, MarketPrice } from 'shared/types/market';
import { Mage } from 'shared/types/mage';
import { nextResearch } from './magic';
import { BlackMarketId } from 'shared/src/common';
import { createLogger } from './logger';

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
  const logger = createLogger('BM');
  logger(`Resolving market for turn ${currentTurn}`);

  const mageMap: Map<number, Mage> = new Map();

  // Data structure to buffer up messages
  const winningMessageMap: Map<number, string[]> = new Map();
  const losingMessageMap: Map<number, MarketBid[]> = new Map();
  const sellerMessageMap: Map<number, string[]> = new Map();

  // id => [price1, price2, ... ]
  const soldTable: Map<string, number[]> = new Map();

  // === Resolve winning bids and add auction item to winning mage ===
  for (const bid of winningBids) {
    const marketItem = itemMap.get(bid.marketId);
    const marketPrice = priceMap.get(marketItem.priceId);

    if (!mageMap.has(bid.mageId)) {
      const m = await adapter.getMage(bid.mageId);
      mageMap.set(bid.mageId, m);
      winningMessageMap.set(bid.mageId, []);
    }
    const mage = mageMap.get(bid.mageId);
    winningMessageMap.get(mage.id).push(`You won ${marketPrice.id} for ${bid.bid}`);

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

    if (soldTable.has(marketPrice.id)) {
      soldTable.get(marketPrice.id).push(bid.bid);
    } else {
      soldTable.set(marketPrice.id, [bid.bid]);
    }

    // Remove entry here so we can calculate adjustments below
    itemMap.delete(bid.marketId)
  }
  logger(`${winningBids.length} winning bids`);


  let expiredCounter = 0;
  for (const [_, marketItem] of itemMap.entries()) {
    if (marketItem.expiration <= currentTurn) {
      if (soldTable.has(marketItem.id)) {
        soldTable.get(marketItem.priceId).push(marketItem.basePrice);
      } else {
        soldTable.set(marketItem.priceId, [marketItem.basePrice]);
      }
      expiredCounter ++;
    }
  }
  logger(`${expiredCounter} expired items without bids`);



  // === Send geld to human sellers, if applicable ===
  // Note: This only applies for items, you cannot sell units or spells
  let itemsSold = 0;
  for (const [_, marketItem] of itemMap.entries()) {
    if (marketItem.mageId && marketItem.expiration <= currentTurn) {
      if (!sellerMessageMap.has(marketItem.mageId)) {
        sellerMessageMap.set(marketItem.mageId, []);
      }
      if (!mageMap.has(marketItem.mageId)) {
        const m = await adapter.getMage(marketItem.mageId);
        mageMap.set(m.id, m);
      }

      itemsSold ++;

      const winningBid = winningBids.find(d => d.marketId === marketItem.id); 
      if (winningBid) {
        mageMap.get(marketItem.mageId).currentGeld += marketItem.basePrice;
        sellerMessageMap.get(marketItem.mageId).push(`${marketItem.basePrice} for ${marketItem.priceId}`);
      } else {
        mageMap.get(marketItem.mageId).currentGeld += marketItem.basePrice;
        sellerMessageMap.get(marketItem.mageId).push(`${marketItem.basePrice} for ${marketItem.priceId}`);
      }
    }
  }
  logger(`${itemsSold} items with human sellers`);


  // Delete winning market bids
  await adapter.removeMarketBids(winningBids.map(d => d.id));

  // === Process losing bid === 
  const lostBids = await adapter.getExpiredBids(currentTurn);
  for (const lostBid of lostBids) {
    const mageId = lostBid.mageId;
    if (losingMessageMap.has(mageId)) {
      losingMessageMap.get(mageId).push(lostBid);
    } else {
      losingMessageMap.set(mageId, [lostBid]);
    }
  }
  logger(`${lostBids.length} bids returned`);


  // clean up database for this server turn
  await adapter.cleanupMarket(currentTurn);

  // update item prices and mage status
  for (const key of soldTable.keys()) {
    const num = soldTable.get(key).length;
    const avgSellPrice = soldTable.get(key).reduce((acc, p) => acc + p, 0) / num;
    const currentPrice = priceMap.get(key).price;

    let newPrice = avgSellPrice > currentPrice ? 
      currentPrice + Math.abs((avgSellPrice - currentPrice) * 0.33) :
      currentPrice * 0.95;
    newPrice = Math.ceil(newPrice);

    logger(`${key} ${currentPrice} => ${newPrice}`);
    await adapter.updateMarketPrice(key, newPrice);
  }
  
  // Update mage
  for (const m of mageMap.values()) {
    await adapter.updateMage(m);
  }


  for (const mageId of losingMessageMap.keys()) {
    const lostBids = losingMessageMap.get(mageId);
    const buffer: string[] = [];

    lostBids.forEach(lostBid => {
      const marketItem = itemMap.get(lostBid.marketId);
      buffer.push(`${marketItem.priceId} bid at ${lostBid.bid}`);
    });

    adapter.saveMail({
      id: uuidv4(),
      read: false,
      timestamp: Date.now(),
      type: 'market',
      priority: 100,
      source: BlackMarketId,
      target: mageId,
      subject: `[Blackmarket] losing bids for turn - ${currentTurn}`,
      content: `You lost the following bids, your gelds have been returned to you:\n ${buffer.join("\n")}`
    });
  }

  for (const mageId of winningMessageMap.keys()) {
    adapter.saveMail({
      id: uuidv4(),
      read: false,
      timestamp: Date.now(),
      type: 'market',
      priority: 100,
      source: BlackMarketId,
      target: mageId,
      subject: `[Blackmarket] winning bids for turn - ${currentTurn}`,
      content: `You have won the following auctions:\n${winningMessageMap.get(mageId).join('\n')}`
    });
  }

  for (const mageId of sellerMessageMap.keys()) {
    adapter.saveMail({
      id: uuidv4(),
      read: false,
      timestamp: Date.now(),
      type: 'market',
      priority: 100,
      source: BlackMarketId,
      target: mageId,
      subject: `[Blackmarket] proceeds for turn - ${currentTurn}`,
      content: `The following items have been sold:\n\n${sellerMessageMap.get(mageId).join('\n')}`
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
