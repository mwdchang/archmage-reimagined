import bcrypt from 'bcryptjs';
import { DataAdapter } from './data-adapter';
import { PGlite } from "@electric-sql/pglite";
import { getToken } from 'shared/src/auth';
import type { Mage } from 'shared/types/mage';
import type { BattleReport, BattleReportSummary } from 'shared/types/battle';

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

interface BattleReportTableEntry {
  defenderId: number;
  attackerId: number;
  report: BattleReport;
  summary: BattleReportSummary;
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
CREATE TABLE IF NOT EXISTS archmage_user (
  username VARCHAR(64), 
  hash VARCHAR(200),
  token VARCHAR(200)
);
COMMIT;

DROP TABLE IF EXISTS mage;
CREATE TABLE IF NOT EXISTS mage (
  username varchar(64),
  id integer,
  mage json 
);
COMMIT;

DROP TABLE IF EXISTS battle_report;
CREATE TABLE IF NOT EXISTS battle_report(
  id varchar(64),
  time bigint,
  attackerId integer,
  defenderId integer,
  report json,
  summary json
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

    await this.db.exec(`
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
    await this.db.exec(`
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

  async getMageBattles(id: number, options: any) {
    const result = await this.db.query<BattleReportTableEntry>(`
SELECT * from battle_report
WHERE (attackerId = ${id} OR defenderId = ${id})
    `);
    return result.rows.map(d => d.summary);
  }

  async getBattleReport(id: string) {
    const result = await this.db.query<BattleReportTableEntry>(`
SELECT * from battle_report
WHERE id = '${id}'
    `)
    if (result.rows.length > 0) {
      return result.rows[0].report;
    }
    return null;
  }

  async saveBattleReport(id: number, reportId: string, report: BattleReport, reportSummary: BattleReportSummary) {
    await this.db.exec(`
INSERT INTO battle_report(id, time, attackerId, defenderId, report, summary)
values('${reportId}', 0, ${report.attacker.id}, ${report.defender.id}, '${JSON.stringify(report)}', '${JSON.stringify(reportSummary)}')
    `);
  }

  async nextTurn() {
  }
}
