// ============================================================
//  utils/database.js - SQLite データベース管理
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH  = path.join(DATA_DIR, 'lending.db');

// データディレクトリを作成
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;

// ── 初期化 ──────────────────────────────────────────────────
function init() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // 並列読み取り性能向上
  db.pragma('foreign_keys = ON');

  // テーブル作成
  db.exec(`
    -- 貸し出しアイテム
    CREATE TABLE IF NOT EXISTS items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      description TEXT    DEFAULT '',
      category    TEXT    DEFAULT '未分類',
      quantity    INTEGER DEFAULT 1,
      created_by  TEXT    NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 貸し出し記録
    CREATE TABLE IF NOT EXISTS loans (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT    NOT NULL,
      item_id     INTEGER NOT NULL REFERENCES items(id),
      borrower_id TEXT    NOT NULL,
      lender_id   TEXT    NOT NULL,
      quantity    INTEGER DEFAULT 1,
      due_date    DATETIME,
      returned_at DATETIME,
      note        TEXT    DEFAULT '',
      status      TEXT    DEFAULT 'active',  -- active / returned / overdue
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- リマインダー設定
    CREATE TABLE IF NOT EXISTS reminders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT    NOT NULL,
      channel_id  TEXT    NOT NULL,
      interval_h  INTEGER DEFAULT 24,
      enabled     INTEGER DEFAULT 1
    );

    -- サーバー設定
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id        TEXT PRIMARY KEY,
      log_channel_id  TEXT,
      admin_role_id   TEXT,
      reminder_dm     INTEGER DEFAULT 1
    );
  `);

  console.log('🗄️  データベース初期化完了');
}

// ── アイテム ────────────────────────────────────────────────
const items = {
  add: (guildId, name, description, category, quantity, createdBy) =>
    db.prepare(`INSERT INTO items (guild_id, name, description, category, quantity, created_by)
                VALUES (?, ?, ?, ?, ?, ?)`).run(guildId, name, description, category, quantity, createdBy),

  getAll: (guildId) =>
    db.prepare(`SELECT * FROM items WHERE guild_id = ? ORDER BY category, name`).all(guildId),

  getById: (id, guildId) =>
    db.prepare(`SELECT * FROM items WHERE id = ? AND guild_id = ?`).get(id, guildId),

  getByName: (guildId, name) =>
    db.prepare(`SELECT * FROM items WHERE guild_id = ? AND name LIKE ?`).all(guildId, `%${name}%`),

  delete: (id, guildId) =>
    db.prepare(`DELETE FROM items WHERE id = ? AND guild_id = ?`).run(id, guildId),

  update: (id, guildId, fields) => {
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    return db.prepare(`UPDATE items SET ${sets} WHERE id = ? AND guild_id = ?`)
             .run(...Object.values(fields), id, guildId);
  },

  // 現在の貸出中数を取得
  borrowedCount: (itemId) =>
    db.prepare(`SELECT COALESCE(SUM(quantity), 0) as count FROM loans
                WHERE item_id = ? AND status = 'active'`).get(itemId).count,
};

// ── 貸し出し ────────────────────────────────────────────────
const loans = {
  create: (guildId, itemId, borrowerId, lenderId, quantity, dueDate, note) =>
    db.prepare(`INSERT INTO loans (guild_id, item_id, borrower_id, lender_id, quantity, due_date, note)
                VALUES (?, ?, ?, ?, ?, ?, ?)`).run(guildId, itemId, borrowerId, lenderId, quantity, dueDate, note),

  getActive: (guildId) =>
    db.prepare(`SELECT l.*, i.name as item_name, i.category
                FROM loans l JOIN items i ON l.item_id = i.id
                WHERE l.guild_id = ? AND l.status = 'active'
                ORDER BY l.due_date ASC NULLS LAST`).all(guildId),

  getByBorrower: (guildId, borrowerId) =>
    db.prepare(`SELECT l.*, i.name as item_name, i.category
                FROM loans l JOIN items i ON l.item_id = i.id
                WHERE l.guild_id = ? AND l.borrower_id = ? AND l.status = 'active'`).all(guildId, borrowerId),

  getById: (id, guildId) =>
    db.prepare(`SELECT l.*, i.name as item_name FROM loans l JOIN items i ON l.item_id = i.id
                WHERE l.id = ? AND l.guild_id = ?`).get(id, guildId),

  return: (id, guildId) =>
    db.prepare(`UPDATE loans SET status = 'returned', returned_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP WHERE id = ? AND guild_id = ?`).run(id, guildId),

  getOverdue: (guildId) =>
    db.prepare(`SELECT l.*, i.name as item_name
                FROM loans l JOIN items i ON l.item_id = i.id
                WHERE l.guild_id = ? AND l.status = 'active'
                AND l.due_date IS NOT NULL AND l.due_date < CURRENT_TIMESTAMP`).all(guildId),

  updateOverdueStatus: (guildId) =>
    db.prepare(`UPDATE loans SET status = 'overdue'
                WHERE guild_id = ? AND status = 'active'
                AND due_date IS NOT NULL AND due_date < CURRENT_TIMESTAMP`).run(guildId),

  history: (guildId, limit = 20) =>
    db.prepare(`SELECT l.*, i.name as item_name
                FROM loans l JOIN items i ON l.item_id = i.id
                WHERE l.guild_id = ? ORDER BY l.created_at DESC LIMIT ?`).all(guildId, limit),
};

// ── サーバー設定 ────────────────────────────────────────────
const settings = {
  get: (guildId) =>
    db.prepare(`SELECT * FROM guild_settings WHERE guild_id = ?`).get(guildId)
    ?? { guild_id: guildId, log_channel_id: null, admin_role_id: null, reminder_dm: 1 },

  set: (guildId, fields) => {
    const current = settings.get(guildId);
    const merged  = { ...current, ...fields, guild_id: guildId };
    db.prepare(`INSERT OR REPLACE INTO guild_settings (guild_id, log_channel_id, admin_role_id, reminder_dm)
                VALUES (?, ?, ?, ?)`)
      .run(merged.guild_id, merged.log_channel_id, merged.admin_role_id, merged.reminder_dm);
  },
};

module.exports = { init, items, loans, settings };
