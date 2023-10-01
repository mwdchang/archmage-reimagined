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
  // abstract getBattleReport(id: string): any
  // abstract saveBattleReport(id: string, report: any): void

  abstract nextTurn(): void
}

