import bcrypt from 'bcryptjs';
import { DataAdapter } from './data-adapter';
import { PGlite } from "@electric-sql/pglite";
import { getToken } from 'shared/src/auth';
import type { Mage } from 'shared/types/mage';

interface User {
  username: string;
  token: string;
  hash: string;
}

interface MageTableEntry {
  username: string,
  id: number,
  mage: Mage
}

export class PGliteDataAdapter extends DataAdapter {
  db: PGlite;
  
  constructor() {
    super();
    this.db = new PGlite('./archmage-db');
  }

  async initialize() {
    try {
      console.log('initialize database...');
      await this.db.exec(`
DROP TABLE IF EXISTS archmage_user;
COMMIT;
CREATE TABLE IF NOT EXISTS archmage_user (
  username VARCHAR(64), 
  hash VARCHAR(200),
  token VARCHAR(200)
);
COMMIT;

DROP TABLE IF EXISTS mage;
COMMIT;
CREATE TABLE IF NOT EXISTS mage (
  username varchar(64),
  id integer,
  mage json 
);
COMMIT;
      `);
    } catch (err) {
      console.log(err);
    }
  }

  async getUser(username: string) {
    console.log('pglite getUser');
    const result = await this.db.query<User>(`
SELECT * from archmage_user where username = "${username}"
    `);
    return result.rows[0];
  }

  async updateUser(user: User) {
    console.log('pglite updateUser');
    const result = await this.db.exec(`
UPDATE archmage_user 
SET token = '${user.token}'
WHERE username = '${user.username}'
    `);
  }

  async register(username: string, password: string) {
    const saltRounds = 5;
    const hash = await bcrypt.hash(password, saltRounds);
    const token = getToken(username);

    this.db.exec(`
INSERT INTO archmage_user values('${username}', '${hash}', '${token}');
    `);

    return {
      user: { username, hash, token }
    }
  }

  async login(username: string, password: string) {
    const user = await this.getUser(username);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.hash);
    if (!isValid) return null;
    const token = getToken(username);
    user.token = token;
    await this.updateUser(user);
    return { user }
  }

  async logout() { }

  async createMage(username: string, mage: Mage) {
    console.log('pglite: createMage');
    const sql = `
INSERT INTO mage values('${username}', '${mage.id}', '${JSON.stringify(mage)}');
    `;

    try {
      await this.db.exec(sql);
    } catch (err) {
      console.error(err);
    }
  }

  async updateMage(mage: Mage) {
    console.log('pglite: updateMage');
    this.db.exec(`
UPDATE mage 
SET mage = '${JSON.stringify(mage)}'
WHERE id = ${mage.id}
    `);
  }

  async getMage(id: number) {
    console.log('pglite: getMage');
    const result = await this.db.query<MageTableEntry>(`
SELECT mage from mage where id = ${id}
    `);
    return result.rows[0].mage;
  }

  async getMageByUser(username: string) {
    console.log('pglite: getMageByUser');

    const result = await this.db.query<MageTableEntry>(`
SELECT mage from mage where username = '${username}'
    `);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0].mage;
  }

  async getAllMages()  {
    console.log('pglite: getAllMages');
    const result = await this.db.query<MageTableEntry>(`
SELECT mage from mage
    `);
    return result.rows.map(d => d.mage);
  }

  getMageBattles(id: number, options: any) {
  }

  getBattleReport(id: string) {
  }

  saveBattleReport(id: number, reportId: string, report: any, reportSummary: any) {
  }

  nextTurn() {
  }
}
