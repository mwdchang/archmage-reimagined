import type { BattleReport, BattleReportSummary } from 'shared/types/battle';
import { Mage } from 'shared/types/mage';
import { ChronicleTurn, MageRank } from 'shared/types/common';


export interface SearchOptions {
  mageId?: number,
  mageName?: string,
  startTime?: number,
  endTime?: number,
  
  // pagination
  limit?: number,
  from?: number,
}


// Models database/datastore CRUD operations
export abstract class DataAdapter {
  constructor() {}

  abstract initialize(): Promise<void>

  // Authentication
  abstract register(username: string, password: string): Promise<any> 
  abstract login(username: string, password: string): Promise<any>
  abstract logout(): Promise<any>

  // Mage CRUD
  abstract createMage(username: string, mage: Mage): Promise<void>
  abstract getMageByUser(username: string): Promise<Mage>
  abstract getAllMages(): Promise<Mage[]>;
  abstract updateMage(mage: Mage): Promise<void>
  abstract getMage(id: number): Promise<Mage>


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

  abstract nextTurn(): Promise<void>
}

