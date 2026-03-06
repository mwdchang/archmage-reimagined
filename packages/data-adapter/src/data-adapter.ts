import type { BattleReport, BattleReportSummary } from 'shared/types/battle';
import { Enchantment, Mage } from 'shared/types/mage';
import { ChronicleTurn, MageRank, Mail, ServerClock, GameTable } from 'shared/types/common';
import { MarketBid, MarketItem, MarketPrice } from 'shared/types/market';
import { Item } from 'shared/types/magic';


export interface SearchOptions {
  mageId?: number,
  attackerId?: number,
  defenderId?: number,

  mageName?: string,
  startTime?: number,
  endTime?: number,
  
  // pagination
  limit?: number,
  from?: number,
}

export interface TurnOptions {
  maxTurn: number
}


// Models database/datastore CRUD operations
export abstract class DataAdapter {
  constructor() {}

  abstract resetData(): Promise<void>;
  abstract initialize(gameTable: GameTable): Promise<void>

  // Authentication
  abstract register(username: string, password: string): Promise<any> 
  abstract login(username: string, password: string): Promise<any>
  abstract logout(): Promise<any>

  // server clock
  abstract setServerClock(clock: ServerClock): Promise<void>
  abstract getServerClock(): Promise<ServerClock>

  // Mage CRUD
  abstract nextMageId(): Promise<number>
  abstract createMage(username: string, mage: Mage): Promise<Mage>
  abstract getMageByUser(username: string): Promise<Mage>
  abstract getAllMages(): Promise<Mage[]>;
  abstract updateMage(mage: Mage): Promise<void>
  abstract getMage(id: number): Promise<Mage>
  abstract removeMage(id: number): Promise<void>
  abstract findMages(searchStr: string): Promise<MageRank[]>

  // Enchants
  abstract setEnchantments(enchantments: Enchantment[]): Promise<void>
  abstract getEnchantments(mageId: number): Promise<Enchantment[]>

  abstract createRank(mr :Omit<MageRank, 'rank'>): Promise<void>
  abstract getRankList(): Promise<MageRank[]>
  abstract updateRank(mr :Omit<MageRank, 'rank'>): Promise<void>

  // Battle reports
  abstract getBattles(options: SearchOptions): Promise<BattleReportSummary[]>
  abstract getBattleReport(id: string): Promise<BattleReport>
  abstract saveBattleReport(id: number, reportId: string, report: any, reportSummary: any): Promise<void>

  // Chronicles
  abstract saveChronicles(data: ChronicleTurn[]): Promise<void>
  abstract getChronicles(options: SearchOptions): Promise<any[]>

  // Market price
  abstract createMarketPrice(id: string, type: string, price: number): Promise<void>
  abstract updateMarketPrice(id: string, price: number): Promise<void>
  abstract getMarketPrices(): Promise<MarketPrice[]>

  // Market
  abstract addMarketItem(marketItem: MarketItem): Promise<void>
  abstract getMarketItems(): Promise<MarketItem[]>
  abstract removeMarketItem(ids: string[]): Promise<void>
  abstract getMarketItem(id: string): Promise<MarketItem>

  // Market bids
  abstract addMarketBid(marketBid: MarketBid): Promise<void>
  abstract getMarketBids(priceId: string): Promise<MarketBid[]>
  abstract removeMarketBids(id: string[]): Promise<void>

  abstract getWinningBids(turn: number): Promise<MarketBid[]>
  abstract getExpiredBids(turn: number): Promise<MarketBid[]>
  abstract cleanupMarket(turn: number): Promise<void>


  // Messaging
  abstract saveMail(mail: Mail): Promise<void>

  abstract getMails(mageId: number): Promise<Mail[]>
  abstract deleteMails(mageId: number, ids: string[]): Promise<void>
  abstract readMails(mageId: number, ids: string[]): Promise<void>

  // Handling unique items
  abstract registerUniqueItems(items: Item[]): Promise<void>
  abstract getAvailableUniqueItems(): Promise<string[]>
  abstract assignUniqueItem(id: string, mageId: number): Promise<void> 


  abstract nextTurn(options: TurnOptions): Promise<void>
}

