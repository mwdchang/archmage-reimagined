import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { DataAdapter } from './data-adapter';
import { getToken } from 'shared/src/auth';
import type { Mage } from 'shared/types/mage';

interface User {
  username: string
  hash: string
  token: string
}

export class SimpleDataAdapter extends DataAdapter {
  userAuthMap: Map<string, User> = new Map();
  mageMap: Map<number, Mage> = new Map();
  userMageMap: Map<string, number> = new Map();
  brMap: Map<string, any> = new Map();

  constructor() {
    super();

    if (existsSync('userAuth.sav')) {
      let data = readFileSync('userAuth.sav', { encoding: 'utf-8' });
      this.userAuthMap.clear();
      this.userAuthMap = new Map<string, User>(JSON.parse(data));
    }
    if (existsSync('mage.sav')) {
      let data = readFileSync('mage.sav', { encoding: 'utf-8' });
      this.mageMap.clear();
      this.mageMap = new Map<number, Mage>(JSON.parse(data));
    }
    if (existsSync('userMage.sav')) {
      let data = readFileSync('userMage.sav', { encoding: 'utf-8' });
      this.userMageMap.clear();
      this.userMageMap = new Map<string, number>(JSON.parse(data));
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

  // getBattleReport(id: string) {
  // }

  // saveBattleReport(id: string, report: any) {
  // }

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
    writeFileSync('userAuth.sav', JSON.stringify(Array.from(this.userAuthMap.entries())));
    writeFileSync('mage.sav', JSON.stringify(Array.from(this.mageMap.entries())));
    writeFileSync('userMage.sav', JSON.stringify(Array.from(this.userMageMap.entries())));
  }
}
