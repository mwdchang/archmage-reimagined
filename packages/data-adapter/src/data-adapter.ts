import { Mage } from 'shared/types/mage';

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

  // Battle reports
  abstract getMageBattles(id: number, options: any): any
  abstract getBattleReport(id: string): any
  abstract saveBattleReport(id: number, reportId: string, report: any, reportSummary: any): void

  abstract nextTurn(): void
}

