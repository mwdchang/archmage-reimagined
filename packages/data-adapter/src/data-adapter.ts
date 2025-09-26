import type { BattleReport, BattleReportSummary } from 'shared/types/battle';
import { Enchantment, Mage } from 'shared/types/mage';
import { ChronicleTurn, MageRank, ServerClock } from 'shared/types/common';
import { MarketBid, MarketItem, MarketPrice } from 'shared/types/market';


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

  abstract initialize(): Promise<void>

  // Authentication
  abstract register(username: string, password: string): Promise<any> 
  abstract login(username: string, password: string): Promise<any>
  abstract logout(): Promise<any>

  // server clock
  abstract setServerClock(currentTurn: number, endTurn: number): Promise<void>
  abstract getServerClock(): Promise<ServerClock>

  // Mage CRUD
  abstract createMage(username: string, mage: Mage): Promise<void>
  abstract getMageByUser(username: string): Promise<Mage>
  abstract getAllMages(): Promise<Mage[]>;
  abstract updateMage(mage: Mage): Promise<void>
  abstract getMage(id: number): Promise<Mage>

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
  abstract getMarketItem(id: string): Promise<MarketItem>
  abstract removeMarketItem(id: string): Promise<void>

  // Market bids
  abstract addMarketBid(marketBid: MarketBid): Promise<void>
  abstract getMarketBids(id: string): Promise<MarketBid[]>
  abstract removeMarketBids(id: string): Promise<void>
  abstract getWinningBids(turn: number): Promise<MarketBid[]>


  abstract nextTurn(options: TurnOptions): Promise<void>
}

