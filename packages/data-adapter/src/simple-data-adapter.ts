import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { DataAdapter, SearchOptions, TurnOptions } from './data-adapter';
import { getToken } from 'shared/src/auth';
import type { Enchantment, Mage } from 'shared/types/mage';
import { BattleReport, BattleReportSummary } from 'shared/types/battle';
import { ChronicleTurn, MageRank, Mail, ServerClock } from 'shared/types/common';
import { NameError } from 'shared/src/errors';
import { MarketBid, MarketItem, MarketPrice } from 'shared/types/market';

interface User {
  username: string
  hash: string
  token: string
}

const DATA_DIR = 'game-data';
const REPORT_DIR = 'reports';

/**
 * This is a simple in-memory/file-based data adapter - mainly for testing and
 * one-off scripting needs
**/
export class SimpleDataAdapter extends DataAdapter {
  userTable: Map<string, User> = new Map();

  mageTable: Mage[] = [];

  battleReportTable: BattleReport[] = [];
  battleSummaryTable: BattleReportSummary[] = [];
  turnTable: ChronicleTurn[] = [];
  rankTable: MageRank[] = [];
  enchantmentTable: Enchantment[] = [];
  mailTable: Mail[] = [];

  marketPriceTable: MarketPrice[] = [];
  marketItemTable: MarketItem[] = [];
  marketBidTable: MarketBid[] = [];

  clock: ServerClock = {
    currentTurnTime: Date.now(),
    interval: 0,
    currentTurn: 0,
    endTurn: 0,
    startTime: 0
  }

  mageSeq:number = 0;

  constructor() { super(); }

  async resetData(): Promise<void> {}
  async initialize(): Promise<void> {}


  async register(username: string, password: string) {
    const saltRounds = 5;
    const hash = await bcrypt.hash(password, saltRounds);

    if (this.userTable.has(username)) {
      throw new NameError(`The name ${username} is already taken`);
    }

    const token = getToken(username);
    this.userTable.set(username, {
      username, hash , token
    });

    return { 
      user: this.userTable.get(username)
    };
  }

  async login(username: string, password: string) {
    const user = this.userTable.get(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.hash);
    if (!isValid) return null;
    const token = getToken(username);
    this.userTable.get(username).token = token;

    return {
      user: this.userTable.get(username)
    };
  }

  async logout() {}

  async nextTurn(options: TurnOptions) {
    for (const mage of this.mageTable) {
      if (mage.currentTurn < options.maxTurn) {
        mage.currentTurn ++;
      }
    }

    // Update clock
    this.clock.currentTurn ++;
    this.clock.currentTurnTime = Date.now();
  }

  async setServerClock(clock: ServerClock): Promise<void> {
    this.clock.currentTurn = clock.currentTurn;
    this.clock.endTurn = clock.endTurn;
    this.clock.currentTurnTime = clock.currentTurnTime;
    this.clock.interval = clock.interval;
    this.clock.startTime = clock.startTime;
  }

  async getServerClock(): Promise<ServerClock> {
    return this.clock;
  }

  async nextMageId(): Promise<number> {
    this.mageSeq++;
    return this.mageSeq;
  }

  async createMage(username: string, mage: Mage) {
    this.mageTable.push(mage);
    if (mage.enchantments) {
      await this.setEnchantments(mage.enchantments);
    }
    return mage;
  }

  async updateMage(mage: Mage) {
    const index = this.mageTable.findIndex(d => d.id === mage.id);
    this.mageTable[index] = mage;

    await this.setEnchantments(mage.enchantments);
    mage.enchantments = await this.getEnchantments(mage.id);
  }

  async getMage(id: number) {
    const index = this.mageTable.findIndex(d => d.id === id);
    return this.mageTable[index];
  }

  async getMageByUser(username: string) {
    const mage = this.mageTable.find(d => d.name === username);
    return mage;
  }

  async getAllMages() {
    return this.mageTable;
  }

  async setEnchantments(enchantments: Enchantment[]) {
    for (const enchant of enchantments) {
      const idx = this.enchantmentTable.findIndex(d => d.id === enchant.id);
      if (idx < 0) {
        this.enchantmentTable.push(enchant);
      } else {
        this.enchantmentTable[idx] = enchant;
      }
    }
  }

  async getEnchantments(mageId: number) {
    return this.enchantmentTable.filter(d => {
      return d.isActive === true && (d.casterId === mageId || d.targetId === mageId);
    });
  }

  async createRank(mr :Omit<MageRank, 'rank'>) {
    // @ts-ignore
    this.rankTable.push(mr);
  }

  async getRankList() {
    return this.rankTable.sort((a, b) => b.netPower - a.netPower);
  }

  async updateRank(mr :Omit<MageRank, 'rank'>) {
    const index = this.rankTable.findIndex(d => d.id === mr.id);
    // @ts-ignore
    this.rankTable[index] = mr;
  }

  async saveBattleReport(id: number, reportId: string, report: any, reportSummary: any) {
    if (report) {
      this.battleReportTable.push(report);
    }
    this.battleSummaryTable.push(reportSummary);
  }

  async getBattles(options: SearchOptions) {
    return this.battleSummaryTable.filter(s => {
      // if (['pillage', 'regular', 'siege'].includes(s.attackType)) {
      //   return false;
      // }

      if (options.endTime && options.endTime > s.timestamp) {
        return false;
      }
      if (options.startTime && options.startTime < s.timestamp) {
        return false;
      }
      if (options.mageId && options.mageId !== s.attackerId && options.mageId !== s.defenderId) {
        return false;
      }
      if (options.attackerId && options.attackerId !== s.attackerId) {
        return false;
      }
      if (options.defenderId && options.defenderId !== s.defenderId) {
        return false;
      }
      if (options.mageName && options.mageName !== s.attackerName && options.mageName !== s.defenderName) {
        return false;
      }
    }).sort((a, b) => b.timestamp - a.timestamp);
  }

  async getBattleReport(id: string) {
    const br = this.battleReportTable.find(d => d.id === id);
    return br;
  }

  async saveChronicles(data: ChronicleTurn[]) {
    for (const x of data) {
      this.turnTable.push(x);
    }
  }

  async getChronicles(options: SearchOptions) {
    return this.turnTable.filter(t => {
      if (options.endTime && options.endTime > t.timestamp) {
        return false;
      }
      if (options.startTime && options.startTime < t.timestamp) {
        return false;
      }
      if (options.mageId && options.mageId !== t.id) {
        return false;
      }
      if (options.mageName && options.mageName !== t.name) {
        return false;
      }
    }).sort((a, b) => b.turn - a.turn);
  }

  async createMarketPrice(id: string, type: string, price: number): Promise<void> {
    this.marketPriceTable.push({
      id, type, price
    });
  }

  async updateMarketPrice(id: string, price: number): Promise<void> {
    const mp = this.marketPriceTable.find(d => d.id === id);
    if (mp) {
      mp.price = price;
    }
  }

  async getMarketPrices(): Promise<MarketPrice[]> {
    return this.marketPriceTable;
  }


  async addMarketItem(marketItem: MarketItem): Promise<void> {
    this.marketItemTable.push(marketItem);
  }

  async getMarketItems(): Promise<MarketItem[]> {
    return this.marketItemTable;
  }

  async getMarketItem(id: string): Promise<MarketItem> {
    return this.marketItemTable.find(d => d.id === id);
  }

  async removeMarketItem(ids: string[]): Promise<void> {
    this.marketItemTable = this.marketItemTable.filter(d => {
      return ids.includes(d.id) === false;
    });
  }


  async addMarketBid(marketBid: MarketBid): Promise<void> {
    const item = await this.getMarketItem(marketBid.marketId);

    if (item.basePrice >= marketBid.bid) {
      throw new Error(`Cannot make bid on ${item.priceId}, check bidding price`);
    }

    this.marketBidTable.push(marketBid);
  }

  async getMarketBids(priceId: string): Promise<MarketBid[]> {
    const marketIds = this.marketItemTable.filter(d => d.priceId === priceId).map(d => d.id);
    return this.marketBidTable.filter(d => {
      return marketIds.includes(d.marketId);
    });
  }

  async removeMarketBids(ids: string[]): Promise<void> {
    this.marketBidTable = this.marketBidTable.filter(d => {
      return ids.includes(d.id) === false;
    });
    console.log('hihihihi', ids, this.marketBidTable);
  }

  async getWinningBids(turn: number): Promise<MarketBid[]> {
    const expired = this.marketItemTable.filter(d => d.expiration === turn);
    const expiredIds = expired.map(d => d.id);
    const bids = this.marketBidTable.filter(d => {
      return expiredIds.includes(d.marketId);
    });


    const tracker: Record<string, {
      marketId: string,
      mageIds: number[],
      bid: number
    }> = {};

    for (const bid of bids) {
      const entry = tracker[bid.marketId];
      if (entry) {
        if (bid.bid > entry.bid) {
          entry.bid = bid.bid;
          entry.mageIds = [bid.mageId];
        } else if (bid.bid === entry.bid) {
          entry.mageIds.push(bid.mageId);
        }
      } else {
        tracker[bid.marketId] = {
          marketId: bid.marketId,
          mageIds: [bid.mageId],
          bid: bid.bid
        }
      }
    }

    return bids.filter(d => { 
      const entry = tracker[d.marketId];

      return entry.mageIds.length === 1 && 
        entry.mageIds.includes(d.mageId);
    });
  }

  async cleanupMarket(turn: number): Promise<void> {
    const expired = this.marketItemTable.filter(d => d.expiration === turn);
    const expiredIds = expired.map(d => d.id);
    const bids = this.marketBidTable.filter(d => {
      return expiredIds.includes(d.marketId);
    });

    console.log('>>>>>>>>>>', turn, expiredIds, bids);
    console.log('');

    // Return bid
    for (const bid of bids) {
      const mage = await this.getMage(bid.mageId);
      mage.currentGeld += bid.bid;
      console.log('returning', mage.id, bid.bid);
      await this.updateMage(mage);
    }

    // Clean up
    await this.removeMarketBids(bids.map(d => d.id));
    await this.removeMarketItem(expired.map(d => d.id));
  }


  // Sending and receiving messages
  async saveMail(mail: Mail): Promise<void> {
    this.mailTable.push(mail);
  }

  async getMails(mageId: number): Promise<Mail[]> {
    const results = this.mailTable.filter(d => d.target === mageId);
    return results;
  }

  async deleteMails(mageId: number, ids: string[]): Promise<void> {
    this.mailTable = this.mailTable.filter(mail => {
      return !ids.includes(mail.id) && mail.target === mageId;
    });
  }

  async readMails(mageId: number, ids: string[]): Promise<void> {
    this.mailTable.forEach(mail => {
      if (ids.includes(mail.id) && mail.target === mageId) {
        mail.read = true;
      }
    });
  }
}

/*
export class SimpleDataAdapter extends DataAdapter {
  userAuthMap: Map<string, User> = new Map();

  // Mage data
  mageMap: Map<number, Mage> = new Map();
  userMageMap: Map<string, number> = new Map();

  // Battle reports datas
  mageBattleMap: Map<number, any[]> = new Map();

  constructor() {
    super();

    if (!existsSync(`${DATA_DIR}`)) {
      mkdirSync(`${DATA_DIR}`);
    }
    if (existsSync(`${DATA_DIR}/userAuth.sav`)) {
      let data = readFileSync(`${DATA_DIR}/userAuth.sav`, { encoding: 'utf-8' });
      this.userAuthMap.clear();
      this.userAuthMap = new Map<string, User>(JSON.parse(data));
    }
    if (existsSync(`${DATA_DIR}/mage.sav`)) {
      let data = readFileSync(`${DATA_DIR}/mage.sav`, { encoding: 'utf-8' });
      this.mageMap.clear();
      this.mageMap = new Map<number, Mage>(JSON.parse(data));
    }
    if (existsSync(`${DATA_DIR}/userMage.sav`)) {
      let data = readFileSync(`${DATA_DIR}/userMage.sav`, { encoding: 'utf-8' });
      this.userMageMap.clear();
      this.userMageMap = new Map<string, number>(JSON.parse(data));
    }
    if (existsSync(`${DATA_DIR}/mageBattle.sav`)) {
      let data = readFileSync(`${DATA_DIR}/mageBattle.sav`, { encoding: 'utf-8' });
      this.mageBattleMap.clear();
      this.mageBattleMap = new Map<number, any[]>(JSON.parse(data));
    }
    if (!existsSync(`${DATA_DIR}/${REPORT_DIR}`)) {
      console.log('Creating report directory', REPORT_DIR);
      mkdirSync(`${DATA_DIR}/${REPORT_DIR}`);
    }
  }

  async initialize() {}

  async register(username: string, password: string) {
    const saltRounds = 5;
    const hash = await bcrypt.hash(password, saltRounds);

    const token = getToken(username);
    this.userAuthMap.set(username, {
      username, hash , token
    });

    return { 
      user: this.userAuthMap.get(username)
    };
  }

  async login(username: string, password: string) {
    const user = this.userAuthMap.get(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.hash);
    if (!isValid) return null;
    const token = getToken(username);
    this.userAuthMap.get(username).token = token;

    return {
      user: this.userAuthMap.get(username)
    };
  }

  async getMageBattles(id: number, options: any) {
    if (this.mageBattleMap.has(id)) {
      return this.mageBattleMap.get(id);
    }
    return []
  }

  async getBattleReport(id: string) {
    if (existsSync(`${DATA_DIR}/${REPORT_DIR}/${id}`)) {
      let data = readFileSync(`${DATA_DIR}/${REPORT_DIR}/${id}`, { encoding: 'utf-8' });
      return JSON.parse(data);
    }
    return null;
  }

  async saveBattleReport(id: number, reportId: string, report: any, reportSummary: any) {
    if (!this.mageBattleMap.has(id)) {
      this.mageBattleMap.set(id, [])
    }
    this.mageBattleMap.get(id).push(reportSummary);
    writeFileSync(`${DATA_DIR}/${REPORT_DIR}/${reportId}`, JSON.stringify(report))
  }

  async nextTurn() {
    this.mageMap.forEach((mage, _username) => {
      if (mage.currentTurn < mage.maxTurn) {
        mage.currentTurn ++;
      }
    })
    this.saveState();
  }

  saveState() {
    // Write out to disk to save state
    console.log('saving state');
    writeFileSync(`${DATA_DIR}/userAuth.sav`, JSON.stringify(Array.from(this.userAuthMap.entries())));
    writeFileSync(`${DATA_DIR}/mage.sav`, JSON.stringify(Array.from(this.mageMap.entries())));
    writeFileSync(`${DATA_DIR}/userMage.sav`, JSON.stringify(Array.from(this.userMageMap.entries())));
    writeFileSync(`${DATA_DIR}/mageBattle.sav`, JSON.stringify(Array.from(this.mageBattleMap.entries())));
  }
}
*/
