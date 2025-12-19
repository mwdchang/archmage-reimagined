import bcrypt from 'bcryptjs';
import { DataAdapter, SearchOptions, TurnOptions } from './data-adapter';
import { PGlite } from "@electric-sql/pglite";
import { getToken } from 'shared/src/auth';
import type { Enchantment, Mage } from 'shared/types/mage';
import type { BattleReport, BattleReportSummary } from 'shared/types/battle';
import { ChronicleTurn, MageRank, Mail, ServerClock } from 'shared/types/common';
import { NameError } from 'shared/src/errors';
import { MarketBid, MarketItem, MarketPrice } from 'shared/types/market';

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

interface BattleReportTable {
  id: string,
  data: BattleReport
}

const DB_CLEAN = `
  DROP MATERIALIZED VIEW IF EXISTS rank_view;
  DROP TABLE IF EXISTS clock;
  DROP TABLE IF EXISTS rank;
  DROP TABLE IF EXISTS archmage_user;
  DROP TABLE IF EXISTS mage;
  DROP TABLE IF EXISTS enchantment;
  DROP TABLE IF EXISTS battle_report;
  DROP TABLE IF EXISTS battle_summary;
  DROP TABLE IF EXISTS turn_chronicle;

  DROP TABLE IF EXISTS market_bid;
  DROP TABLE IF EXISTS market;
  DROP TABLE IF EXISTS market_price;

  DROP TABLE IF EXISTS mail;

  DROP SEQUENCE IF EXISTS mage_seq;

  COMMIT;
`;

const DB_INIT = `
  CREATE SEQUENCE IF NOT EXISTS mage_seq START WITH 0 MINVALUE 0;
  COMMIT;

  CREATE TABLE IF NOT EXISTS clock (
    current_turn int,
    current_turn_time bigint,
    end_turn int,
    start_time bigint,
    interval int
  );
  COMMIT;


  CREATE TABLE IF NOT EXISTS archmage_user (
    username VARCHAR(64), 
    hash VARCHAR(200),
    token VARCHAR(200)
  );
  COMMIT;


  CREATE TABLE IF NOT EXISTS mage (
    username varchar(64),
    id integer,
    mage json 
  );
  COMMIT;


  CREATE TABLE IF NOT EXISTS enchantment (
    id varchar(64) PRIMARY KEY,

    caster_id integer,
    caster_magic varchar(32),
    target_id integer,

    spell_id varchar(64),
    spell_level integer,

    is_active boolean,
    is_epidemic boolean,
    is_permanent boolean,
    life integer 
  );
  COMMIT;

  CREATE TABLE IF NOT EXISTS battle_report(
    id varchar(64),
    data json
  );
  COMMIT;

 
  CREATE TABLE IF NOT EXISTS battle_summary(
    id varchar(64),
    timestamp bigint,
    attack_type varchar(32),
    attacker_id integer,
    attacker_name varchar(64),
    attacker_power_loss bigint,
    attacker_power_loss_percentage float,
    attacker_starting_units integer,
    attacker_units_loss integer,
    defender_id integer,
    defender_name varchar(64),
    defender_power_loss bigint,
    defender_power_loss_percentage float,
    defender_starting_units integer,
    defender_units_loss integer,
    is_successful boolean,
    is_defender_defeated boolean,
    land_gain integer,
    land_loss integer
  );
  COMMIT;


  CREATE TABLE IF NOT EXISTS turn_chronicle(
    id integer,
    name varchar(64),
    timestamp bigint,
    turn integer,
    data json
  );
  COMMIT;


  CREATE TABLE IF NOT EXISTS market_price(
    id varchar(64) PRIMARY KEY,
    type varchar(64),
    price bigint
  );
  COMMIT;

  CREATE TABLE IF NOT EXISTS market(
    id varchar(64) PRIMARY KEY,
    price_id varchar(64) REFERENCES market_price(id),
    base_price bigint,
    mage_id int,
    extra json,
    expiration int
  );
  COMMIT;

  CREATE TABLE IF NOT EXISTS market_bid(
    id varchar(64),
    market_id varchar(64) REFERENCES market(id),
    mage_id int,
    bid bigint
  );
  COMMIT;


  CREATE TABLE IF NOT EXISTS rank(
    id integer,
    name varchar(64),
    magic varchar(32),
    forts integer,
    land integer,
    status varchar(32),
    net_power bigint
  );
  COMMIT;


  CREATE MATERIALIZED VIEW IF NOT EXISTS rank_view AS
  WITH 
  recent_battles AS (
    SELECT
      defender_id,
      SUM(defender_power_loss_percentage) AS total_loss_pct
    FROM
      battle_summary
    WHERE
      timestamp >= (EXTRACT(EPOCH FROM now()) * 1000)::bigint - 86400000
    GROUP BY
      defender_id
  ),
  rank_with_status AS (
    SELECT
      r.id,
      r.name,
      r.magic,
      r.forts,
      r.land,
      r.net_power,
      COALESCE(
        CASE
          WHEN r.forts <= 0 THEN 'defeated'
          WHEN rb.total_loss_pct > 0.3 THEN 'damaged'
          ELSE 'normal'
        END,
        'normal'
      ) AS status
    FROM
      rank r
      LEFT JOIN recent_battles rb ON r.id = rb.defender_id
  )
  SELECT
    *,
    ROW_NUMBER() OVER (ORDER BY net_power DESC) AS rank
  FROM
    rank_with_status;
  COMMIT;


  CREATE TABLE IF NOT EXISTS mail(
    id varchar(64),
    type varchar(16),
    priority integer,
    timestamp bigint,

    source integer,
    target integer,

    subject varchar(256),
    content text,
    read boolean
  );
  COMMIT;


  -- CREATE VIEW rank_view AS
  -- SELECT
  --     id,
  --     name,
  --     magic,
  --     forts,
  --     land,
  --     status,
  --     net_power,
  --     RANK() OVER (ORDER BY net_power DESC) AS rank
  -- FROM
  --     rank;
`;



const toCamelCase = <T>(row: Record<string, any>): T => {
  const result: any = {};

  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    result[camelKey] = row[key];
  }
  return result as T;
}

const Q = (v: string) => `'${v.replace(/'/g, "''")}'`;

export class PGliteDataAdapter extends DataAdapter {
  db: PGlite;

  constructor() {
    super();
    this.db = new PGlite('./archmage-db');
  }

  // We need to refresh view occasionally
  async refreshRankView() {
    this.db.exec('REFRESH MATERIALIZED VIEW rank_view');
  }

  async resetData(): Promise<void> {
    await this.db.exec(DB_CLEAN);
  }

  async initialize(): Promise<void> {
    try {
      console.log('initialize database...');
      await this.db.exec(DB_INIT);

      await this.db.exec(`
        SELECT setval('mage_seq', COALESCE((SELECT MAX(id) FROM mage), 0), true);
      `);

      await this.refreshRankView();
    } catch (err) {
      console.log(err);
    }
  }

  async setServerClock(clock: ServerClock): Promise<void> {
    await this.db.exec(`
      DELETE FROM clock;
      INSERT INTO clock (current_turn, current_turn_time, end_turn, interval, start_time)
      Values (
        ${clock.currentTurn}, 
        ${clock.currentTurnTime}, 
        ${clock.endTurn},
        ${clock.interval},
        ${clock.startTime}
      )
    `);
  }

  async getServerClock(): Promise<ServerClock> {
    const result = await this.db.query<any>(`
      SELECT * from clock
    `);
    return result.rows.map(toCamelCase<ServerClock>)[0];
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

    // check duplicates names
    const res = await this.db.query(`
      SELECT * from archmage_user where username = '${username}'
    `);
    if (res && res.rows.length > 0) {
      throw new NameError(`The name ${username} is already taken`);
    }

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

  async nextMageId(): Promise<number> {
    // Auto generated id
    const seqSQL = `SELECT nextval('mage_seq')`;
    const r = await this.db.query(seqSQL);
    const newId = r.rows[0]['nextval'];
    return newId;
  }

  async createMage(username: string, mage: Mage) {
    // Create
    const sql = `
      INSERT INTO mage values('${username}', '${mage.id}', '${JSON.stringify(mage)}');
    `;

    try {
      await this.db.exec(sql);
      if (mage.enchantments) {
        await this.setEnchantments(mage.enchantments);
      }
    } catch (err) {
      console.error(err);
    }
    this.refreshRankView();
    return mage;
  }

  async updateMage(mage: Mage) {
    await this.db.exec(`
      UPDATE mage 
      SET mage = '${JSON.stringify(mage)}'
      WHERE id = ${mage.id}
    `);

    await this.setEnchantments(mage.enchantments);
    mage.enchantments = await this.getEnchantments(mage.id);
  }

  async getMage(id: number) {
    const result = await this.db.query<MageTable>(`
      SELECT mage from mage where id = ${id}
    `);
    const mage: Mage = result.rows[0].mage;

    const mageRank = await this.db.query<MageRank>(`
      select * from rank_view where id = ${mage.id}
    `);

    const enchantments = await this.getEnchantments(mage.id);

    mage.rank = mageRank.rows[0].rank; 
    mage.status = mageRank.rows[0].status;
    mage.enchantments = enchantments;
    return mage;
  }

  async getMageByUser(username: string) {
    const result = await this.db.query<MageTable>(`
      SELECT mage from mage where username = '${username}'
    `);
    if (result.rows.length === 0) {
      return null;
    }

    const mage: Mage = result.rows[0].mage;
    const mageRank = await this.db.query<MageRank>(`
      select * from rank_view where id = ${mage.id}
    `);
    const enchantments = await this.getEnchantments(mage.id);

    mage.rank = mageRank.rows[0].rank; 
    mage.status = mageRank.rows[0].status;
    mage.enchantments = enchantments;

    return mage;
  }

  async getAllMages() {
    const result = await this.db.query<MageTable>(`
      SELECT mage from mage
    `);
    return result.rows.map(d => d.mage);
  }

  async getRankList(): Promise<MageRank[]> {
    const result = await this.db.query<any>('SELECT * from rank_view order by rank asc');
    return result.rows.map(toCamelCase<MageRank>);
  }

  async setEnchantments(enchantments: Enchantment[]) {
    if (enchantments.length === 0) return;

    for (const enchant of enchantments) {
      await this.db.exec(`
        INSERT into enchantment 
        VALUES (
          ${Q(enchant.id)},
          ${enchant.casterId},
          ${Q(enchant.casterMagic)},
          ${enchant.targetId},
          ${Q(enchant.spellId)},
          ${enchant.spellLevel},
          ${enchant.isActive},
          ${enchant.isEpidemic},
          ${enchant.isPermanent},
          ${enchant.life}
        )
        ON CONFLICT (id)
        DO UPDATE set 
          caster_id = ${enchant.casterId},
          caster_magic = ${Q(enchant.casterMagic)},
          target_id = ${enchant.targetId},
          spell_id = ${Q(enchant.spellId)},
          spell_level = ${enchant.spellLevel},
          is_active = ${enchant.isActive},
          is_epidemic = ${enchant.isEpidemic},
          is_permanent = ${enchant.isPermanent},
          life = ${enchant.life}
        ;
      `);
    }
  }

  async getEnchantments(mageId: number) {
    const result = await this.db.query<any>(`
      SELECT * 
      FROM enchantment 
      WHERE (target_id = ${mageId} OR caster_id = ${mageId})
      AND is_active = true
    `);
    return result.rows.map(toCamelCase<Enchantment>);
  }

  async createRank(mr : MageRank) {
    await this.db.exec(`
      INSERT INTO rank values(
        ${mr.id},
        ${Q(mr.name)},
        ${Q(mr.magic)},
        ${mr.forts},
        ${mr.land},
        ${Q(mr.status)},
        ${mr.netPower}
      );
    `)

    await this.refreshRankView();
  }

  async updateRank(mr : MageRank) {
    await this.db.exec(`
      UPDATE rank 
      SET forts = ${mr.forts}
      ,   land=${mr.land}
      ,   net_power=${mr.netPower}
      WHERE id = ${mr.id}
    `);
  }

  async getBattles(options: SearchOptions) {
    let sqlQuery = 'SELECT * from battle_summary ';
    const whereClauses: string[] = [];
    // whereClauses.push(`attack_type in ('pillage', 'regular', 'siege')`);

    if (options.mageId) {
      whereClauses.push(`(attacker_id = ${options.mageId} OR defender_id = ${options.mageId})`);
    }
    if (options.attackerId) {
      whereClauses.push(`attacker_id = ${options.attackerId}`);
    }
    if (options.defenderId) {
      whereClauses.push(`defender_id = ${options.defenderId}`);
    }
    if (options.mageName) {
      whereClauses.push(`(attacker_name like '%${options.mageName}%' OR defender_name like '%${options.mageName})%'`);
    }

    // Manage time
    if (options.startTime !== undefined) {
      whereClauses.push(`timestamp >= ${options.startTime}`);
    }
    if (options.endTime !== undefined) {
      whereClauses.push(`timestamp <= ${options.endTime}`);
    }

    if (whereClauses.length > 0) {
      sqlQuery += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    // paging and order
    sqlQuery += ' ORDER BY timestamp desc ';
    if (options.limit > 0) {
      sqlQuery += ` LIMIT ${options.limit} `;
    }
    if (options.from > 0) {
      sqlQuery += ` OFFSET ${options.from} `;
    }
    const result = await this.db.query<any>(sqlQuery);

    return result.rows.map(toCamelCase<BattleReportSummary>);
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
    await this.db.exec(`
      INSERT INTO battle_summary(
        id,
        timestamp,
        attack_type,
        attacker_id,
        attacker_name,
        attacker_power_loss,
        attacker_power_loss_percentage,
        attacker_starting_units,
        attacker_units_loss,
        defender_id, 
        defender_name,
        defender_power_loss,
        defender_power_loss_percentage,
        defender_starting_units,
        defender_units_loss,
        is_successful,
        is_defender_defeated,
        land_gain,
        land_loss
      )
      VALUES (
        ${Q(reportId)}, 
        ${reportSummary.timestamp}, 
        ${Q(reportSummary.attackType)},
        ${reportSummary.attackerId}, 
        ${Q(reportSummary.attackerName)}, 
        ${reportSummary.attackerPowerLoss}, 
        ${reportSummary.attackerPowerLossPercentage}, 
        ${reportSummary.attackerStartingUnits}, 
        ${reportSummary.attackerUnitsLoss}, 
        ${reportSummary.defenderId}, 
        ${Q(reportSummary.defenderName)}, 
        ${reportSummary.defenderPowerLoss}, 
        ${reportSummary.defenderPowerLossPercentage}, 
        ${reportSummary.defenderStartingUnits}, 
        ${reportSummary.defenderUnitsLoss}, 
        ${reportSummary.isSuccessful}, 
        ${reportSummary.isDefenderDefeated}, 

        ${reportSummary.landGain}, 
        ${reportSummary.landLoss}
      )
    `);

    if (report) {
      await this.db.exec(`
        INSERT INTO battle_report(id, data) 
        VALUES (${Q(reportId)}, ${Q(JSON.stringify(report))})
      `);
    }

    this.refreshRankView();
  }

  async saveChronicles(data: ChronicleTurn[]): Promise<void> {
    // Build parameter placeholders for each row
    const valuePlaceholders = data.map((_, i) => 
      `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4}, $${i * 3 + 5})`
    ).join(", ");

    const values: any[] = data.flatMap(entry => [
      entry.id,
      entry.name,
      entry.timestamp,
      entry.turn,
      JSON.stringify(entry.data)
    ]);

    const insertSQL = `
      INSERT INTO turn_chronicle(id, name, timestamp, turn, data)
      VALUES ${valuePlaceholders}
    `;
    await this.db.query(insertSQL, values);
    this.refreshRankView();
  }

  async getChronicles(options: SearchOptions): Promise<any[]> {
    let sqlQuery = 'SELECT * from turn_chronicle';
    const whereClauses: string[] = [];

    if (options.mageId) {
      whereClauses.push(`id = ${options.mageId}`);
    }
    if (options.mageName) {
      whereClauses.push(`name like '%${options.mageId}%'`);
    }
    if (options.startTime !== undefined) {
      whereClauses.push(`timestamp >= ${options.startTime}`);
    }
    if (options.endTime !== undefined) {
      whereClauses.push(`timestamp <= ${options.endTime}`);
    }
    if (whereClauses.length > 0) {
      sqlQuery += ' WHERE ' + whereClauses.join(' AND ');
    }

    // paging and order
    sqlQuery += ' ORDER BY timestamp desc ';
    if (options.limit > 0) {
      sqlQuery += ` LIMIT ${options.limit} `;
    }
    if (options.from > 0) {
      sqlQuery += ` OFFSET ${options.from} `;
    }

    const result = await this.db.query<ChronicleTurn>(sqlQuery);
    return result.rows;
  }


  async nextTurn(options: TurnOptions) {
    await this.db.query(`
      UPDATE mage
      SET mage = jsonb_set(
          mage::jsonb,
          '{currentTurn}',
          ((mage->>'currentTurn')::int + 1)::text::jsonb
      )
      WHERE (mage->>'currentTurn')::int < ${options.maxTurn};
    `);
    this.refreshRankView();

    await this.db.exec(`
      UPDATE clock
      SET current_turn = current_turn + 1
      ,   current_turn_time = ${Date.now()}
    `);


    /*
    await this.db.query(`
      UPDATE mage
      SET mage = json_set(
          mage,
          '$.currentTurn',
          json((json_extract(mage, '$.currentTurn') + 1))
      )
      WHERE json_extract(mage, '$.currentTurn') <= 400
    `);
    */
  }

  async createMarketPrice(id: string, type: string, price: number): Promise<void> {

    await this.db.query(`
      INSERT INTO market_price (id, type, price)
      VALUES (
        ${Q(id)},
        ${Q(type)},
        ${price}
      )
    `);
  }

  async updateMarketPrice(id: string, price: number) {
    await this.db.query(`
      UPDATE market_price 
      SET price = ${price}
      where id = ${Q(id)}
    `);
  }

  async getMarketPrices(): Promise<MarketPrice[]> {
    const result = await this.db.query(`
      SELECT * from market_price
    `)
    return result.rows.map(toCamelCase<MarketPrice>);
  }

  async addMarketItem(marketItem: MarketItem) {
    // Sanity check
    await this.db.exec(`
      INSERT INTO market (id, price_id, base_price, mage_id, extra, expiration)
      VALUES (
        ${Q(marketItem.id)},
        ${Q(marketItem.priceId)},
        ${marketItem.basePrice},
        ${marketItem.mageId || null},
        ${Q(JSON.stringify(marketItem.extra || null))},
        ${marketItem.expiration}
      )
    `);
  }

  async getMarketItem(id: string): Promise<MarketItem> {
    const result = await this.db.query(`
      SELECT * from market where id = ${Q(id)}
    `);
    return result.rows.map(toCamelCase<MarketItem>)[0];
  }

  async getMarketItems(): Promise<MarketItem[]> {
    const result = await this.db.query(`
      SELECT * from market
    `);
    return result.rows.map(toCamelCase<MarketItem>);
  }

  async removeMarketItem(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await this.db.exec(`
      DELETE FROM market where id in (${ids.map(Q).join(', ')})
    `);
  }

  async addMarketBid(marketBid: MarketBid): Promise<void> {
    const item = await this.getMarketItem(marketBid.marketId);
    if (item.basePrice >= marketBid.bid) {
      throw new Error(`Cannot make bid on ${item.priceId}, check bidding price`);
    }

    await this.db.exec(`
      INSERT INTO market_bid (id, market_id, mage_id, bid)
      VALUES (
        ${Q(marketBid.id)},
        ${Q(marketBid.marketId)},
        ${marketBid.mageId},
        ${marketBid.bid}
      )
    `);
  }

  async getMarketBids(priceId: string): Promise<MarketBid[]> {
    const result = await this.db.query(`
      SELECT * from market_bid where market_id IN ( 
        SELECT id from market where price_id = ${Q(priceId)}
      )
    `);
    return result.rows.map(toCamelCase<MarketBid>);
  }

  async removeMarketBids(ids: string[]): Promise<void> {
    if (ids.length === 0) return

    await this.db.exec(`
      DELETE FROM market_bid where id IN (${ids.map(Q).join(', ')})
    `);
  }

  async getWinningBids(turn: number): Promise<MarketBid[]> {
    const query = `
      WITH expired_markets AS (
        SELECT id
        FROM market
        WHERE expiration = ${turn}
      ),
      max_bids AS (
        SELECT
          mb.market_id AS market_id,
          MAX(mb.bid) AS max_bid
        FROM market_bid mb
        INNER JOIN expired_markets em ON mb.market_id = em.id
        GROUP BY mb.market_id
      ),
      bid_counts AS (
        SELECT
          mb.market_id AS market_id,
          mb.bid,
          COUNT(*) AS bid_count
        FROM market_bid mb
        INNER JOIN max_bids mb_max
          ON mb.market_id = mb_max.market_id AND mb.bid = mb_max.max_bid
        GROUP BY mb.market_id, mb.bid
      ),
      winning_bids AS (
        SELECT
          mb.*
        FROM market_bid mb
        INNER JOIN bid_counts bc
          ON mb.market_id = bc.market_id AND mb.bid = bc.bid
        WHERE bc.bid_count = 1
      )
      SELECT * FROM winning_bids;
    `;

    const result = await this.db.query(query);
    return result.rows.map(toCamelCase<MarketBid>);
  }

  async getExpiredBids(turn: number): Promise<MarketBid[]> {
    const query = `
      SELECT * from market_bid
      WHERE market_id in (
        SELECT id from market where expiration = ${turn}
      )
    `;
    const result = await this.db.query(query);
    return result.rows.map(toCamelCase<MarketBid>);
  }

  async cleanupMarket(turn: number): Promise<void> {

    /*
    let blah = `
      WITH expired_markets AS (
        SELECT id
        FROM market
        WHERE expiration = ${turn}
      ),
      refunds AS (
        SELECT
          mb.mage_id,
          SUM(mb.bid) AS total_refund
        FROM market_bid mb
        INNER JOIN expired_markets em ON mb.market_id = em.id
        GROUP BY mb.mage_id
      )
      SELECT * from refunds
    `;
    const res = await this.db.query(blah);
    */


    // Return geld
    let sql = `
      WITH expired_markets AS (
        SELECT id
        FROM market
        WHERE expiration = ${turn}
      ),
      refunds AS (
        SELECT
          mb.mage_id,
          SUM(mb.bid) AS total_refund
        FROM market_bid mb
        INNER JOIN expired_markets em ON mb.market_id = em.id
        GROUP BY mb.mage_id
      )

      UPDATE mage
      SET mage = jsonb_set(
          mage::jsonb,
          '{currentGeld}',
          ((COALESCE(mage->>'currentGeld', '0')::bigint + r.total_refund)::text)::jsonb
      )
      FROM refunds r
      WHERE mage.id = r.mage_id;
    `;
    await this.db.exec(sql);
    

    // Remove bids
    sql = `
      DELETE FROM market_bid
      WHERE market_id in (
        SELECT id from market where expiration = ${turn}
      )
    `
    await this.db.exec(sql);

    // Remove market
    sql = `
      DELETE FROM market where expiration = ${turn}
    `
    await this.db.exec(sql);
  }


  async saveMail(mail: Mail): Promise<void> {
    await this.db.exec(`
      INSERT INTO mail (
        id,
        type,
        priority,
        timestamp,
        source,
        target,
        subject,
        content,
        read
      )
      VALUES (
        ${Q(mail.id)},
        ${Q(mail.type)},
        ${mail.priority},
        ${mail.timestamp},
        ${mail.source},
        ${mail.target},
        ${Q(mail.subject)},
        ${Q(mail.content)},
        ${mail.read}
      )
    `);
  }

  async getMails(mageId: number): Promise<Mail[]> {
    const results = await this.db.query<any>(`
      SELECT * 
      FROM mail 
      WHERE target = ${mageId}
    `);
    return results.rows.map(toCamelCase<Mail>);
  }

  async deleteMails(mageId: number, ids: string[]): Promise<void> {
    await this.db.exec(`
      DELETE FROM mail 
      WHERE id in (${ids.map(Q).join(', ')})
      AND target = ${mageId}
    `);
  }

  async readMails(mageId: number, ids: string[]): Promise<void> {
    await this.db.exec(`
      UPDATE mail
      SET read = true
      WHERE id = (${ids.map(Q).join(', ')})
      AND target = ${mageId}
    `);
  }

}
