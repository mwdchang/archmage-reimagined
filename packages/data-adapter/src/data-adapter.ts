import { Mage } from 'shared/types/mage';

// Models database/datastore CRUD operations
export abstract class DataAdapter {
  constructor() {}

  // Authentication
  abstract register(username: string, password: string): Promise<any> 
  abstract login(username: string, password: string): Promise<any>
  abstract logout(): Promise<any>

  // Mage CRUD
  abstract createMage(username: string, mage: Mage): void
  abstract updateMage(mage: Mage): void
  abstract getMage(id: number): Mage
  abstract getMageByUser(username: string): Mage 
  abstract getAllMages(): Mage[];

  // Battle reports
  abstract getMageBattles(id: number, options: any): any
  abstract getBattleReport(id: string): any
  abstract saveBattleReport(id: number, reportId: string, report: any, reportSummary: any): void

  abstract nextTurn(): void
}

