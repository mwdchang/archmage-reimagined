import bcrypt from 'bcryptjs';
import { DataAdapter, SearchOptions } from './data-adapter';
import { PGlite } from "@electric-sql/pglite";
import { getToken } from 'shared/src/auth';
import type { Mage } from 'shared/types/mage';
import type { BattleReport, BattleReportSummary } from 'shared/types/battle';
import { ChronicleTurn } from 'shared/types/common';

interface UserTable {
  username: string;
  token: string;
  hash: string;
}

interface MageTable {
  username: string,
  id: number,
  mage: Mage
}

interface BattleSummaryTable {
  id: string,
  time: number,
  defenderId: number;
  defenderName: string;
  attackerId: number;
  attackerName: string;
  data: BattleReportSummary;
}

interface BattleReportTable {
  id: string,
  data: BattleReport
}


interface ChronicleTable {
  mageId: number,
  mageName: string,
  time: number, 
  turn: number, 
  data: any[]
}



const DB_INIT = `
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
    data json
  );
  COMMIT;

  DROP TABLE IF EXISTS battle_summary;
  CREATE TABLE IF NOT EXISTS battle_summary(
    id varchar(64),
    time bigint,
    attackerId integer,
    attackerName varchar(64),
    defenderId integer,
    defenderName varchar(64),
    data json
  );
  COMMIT;

  DROP TABLE IF EXISTS turn_chronicle;
  CREATE TABLE IF NOT EXISTS turn_chronicle(
    id integer,
    name varchar(64),
    time bigint,
    turn integer,
    data json
  );
  COMMIT;
`;


export class PGliteDataAdapter extends DataAdapter {
  db: PGlite;

  constructor() {
    super();
    this.db = new PGlite('./archmage-db');
  }

  async initialize() {
    try {
      console.log('initialize database...');
      await this.db.exec(DB_INIT);
    } catch (err) {
      console.log(err);
    }
  }

  async getUser(username: string) {
    const result = await this.db.query<UserTable>(`
SELECT * from archmage_user where username = '${username}'
    `);
    return result.rows[0];
  }

  async updateUser(user: UserTable) {
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
    await this.db.exec(`
UPDATE mage 
SET mage = '${JSON.stringify(mage)}'
WHERE id = ${mage.id}
    `);
  }

  async getMage(id: number) {
    const result = await this.db.query<MageTable>(`
SELECT mage from mage where id = ${id}
    `);
    return result.rows[0].mage;
  }

  async getMageByUser(username: string) {
    console.log('pglite: getMageByUser');
    const result = await this.db.query<MageTable>(`
SELECT mage from mage where username = '${username}'
    `);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0].mage;
  }

  async getAllMages() {
    console.log('pglite: getAllMages');
    const result = await this.db.query<MageTable>(`
SELECT mage from mage
    `);
    return result.rows.map(d => d.mage);
  }

  async getBattles(options: SearchOptions) {
    const result = await this.db.query<BattleSummaryTable>(`
SELECT * from battle_summary
WHERE (attackerId = ${options.mageId} OR defenderId = ${options.mageId})
    `);
    return result.rows.map(d => d.data);
  }

  async getBattleReport(id: string) {
    const result = await this.db.query<BattleReportTable>(`
SELECT * from battle_report
WHERE id = '${id}'
    `)
    if (result.rows.length > 0) {
      return result.rows[0].data;
    }
    return null;
  }

  async saveBattleReport(
    id: number, 
    reportId: string, 
    report: BattleReport, 
    reportSummary: BattleReportSummary
  ) {
    const attacker = report.attacker;
    const defender = report.defender;
    await this.db.exec(`
INSERT INTO battle_summary(id, time, attackerId, attackerName, defenderId, defenderName, data)
values ('${reportId}', 0, ${attacker.id}, ${attacker.name}, ${defender.id}, ${defender.name}, '${JSON.stringify(reportSummary)}')
    `);

    await this.db.exec(`
INSERT INTO battle_report(id, data) values ('${reportId}', '${JSON.stringify(report)}')
    `);
  }

  async saveChronicles(data: ChronicleTurn[]): Promise<void> {
    // Build parameter placeholders for each row
    const valuePlaceholders = data.map((_, i) => 
      `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4}, $${i * 3 + 5})`
    ).join(", ");

    const values: any[] = data.flatMap(entry => [
      entry.id,
      entry.name,
      entry.time,
      entry.turn,
      JSON.stringify(entry.data)
    ]);

    const insertSQL = `
      INSERT INTO turn_chronicle(id, name, time, turn, data)
      VALUES ${valuePlaceholders}
    `;
    await this.db.query(insertSQL, values);
  }

  async getChronicles(options: SearchOptions): Promise<any[]> {
    const result = await this.db.query<ChronicleTurn>(`
      SELECT * from turn_chronicle 
      WHERE id = ${options.mageId}
    `);
    return result.rows;
  }

  async nextTurn() {
    // nothing
  }
}
