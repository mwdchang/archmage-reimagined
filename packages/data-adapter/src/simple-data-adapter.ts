import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { DataAdapter, SearchOptions, TurnOptions } from './data-adapter';
import { getToken } from 'shared/src/auth';
import type { Enchantment, Mage } from 'shared/types/mage';
import { BattleReport, BattleReportSummary } from 'shared/types/battle';
import { ChronicleTurn, MageRank } from 'shared/types/common';
import { NameError } from 'shared/src/errors';

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

  constructor() { super(); }

  async initialize() {}

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
  }

  async createMage(username: string, mage: Mage) {
    this.mageTable.push(mage);
  }

  async updateMage(mage: Mage) {
    const index = this.mageTable.findIndex(d => d.id === mage.id);
    this.mageTable[index] = mage;
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
      }
        this.enchantmentTable[idx] = enchant;
    }
  }

  async getEnchantments(mageId: number) {
    return this.enchantmentTable.filter(d => {
      return d.casterId === mageId || d.targetId === mageId;
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
    this.battleReportTable.push(report);
    this.battleSummaryTable.push(reportSummary);
  }

  async getBattles(options: SearchOptions) {
    return this.battleSummaryTable.filter(s => {
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
