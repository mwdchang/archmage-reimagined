import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { DataAdapter } from './data-adapter';
import { getToken } from 'shared/src/auth';
import type { Mage } from 'shared/types/mage';

interface User {
  username: string
  hash: string
  token: string
}

const DATA_DIR = 'game-data';
const REPORT_DIR = 'reports';

/**
 * This is a simple in-memory/file-based data adapter - not performant if there are hundreds of mages
**/
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

  async register(username: string, password: string) {
    const saltRounds = 5;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('new user', username, password, hash);

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

  async logout() { }

  createMage(username: string, mage: Mage) {
    this.userMageMap.set(username, mage.id);
    this.mageMap.set(mage.id, mage);
    this.saveState();
  }

  updateMage(mage: Mage) {
    this.mageMap.set(mage.id, mage);
  }

  getMage(id: number) {
    return this.mageMap.get(id);
  }

  getMageByUser(username: string) {
    const id = this.userMageMap.get(username);
    return this.mageMap.get(id);
  }

  getAllMages(): Mage[] {
    return [...this.mageMap.values()];
  }

  getMageBattles(id: number, options: any) {
    if (this.mageBattleMap.has(id)) {
      return this.mageBattleMap.get(id);
    }
    return []
  }

  getBattleReport(id: string) {
    if (existsSync(`${REPORT_DIR}/${id}`)) {
      let data = readFileSync(`${DATA_DIR}/${REPORT_DIR}/${id}`, { encoding: 'utf-8' });
      return data;
    }
    return null;
  }

  saveBattleReport(id: number, reportId: string, report: any, reportSummary: any) {
    if (!this.mageBattleMap.has(id)) {
      this.mageBattleMap.set(id, [])
    }
    this.mageBattleMap.get(id).push(reportSummary);
    writeFileSync(`${DATA_DIR}/${REPORT_DIR}/${reportId}`, JSON.stringify(report))
  }

  nextTurn() {
    this.mageMap.forEach((mage, _username) => {
      if (mage.currentTurn <= mage.maxTurn) {
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
