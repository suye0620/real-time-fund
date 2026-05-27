const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'state.db');

// 清理孤立的 WAL/SHM 文件（主 DB 被删除后残留会导致磁盘 I/O 错误）
for (const ext of ['-wal', '-shm']) {
  const walPath = DB_PATH + ext;
  if (!fs.existsSync(DB_PATH) && fs.existsSync(walPath)) {
    try { fs.unlinkSync(walPath); } catch { /* ignore */ }
  }
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const stmtGetAll = db.prepare('SELECT key, value, updated_at FROM state ORDER BY key');
const stmtGet = db.prepare('SELECT key, value, updated_at FROM state WHERE key = ?');
const stmtUpsert = db.prepare(`
  INSERT INTO state (key, value, updated_at)
  VALUES (?, ?, datetime('now'))
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`);
const stmtDelete = db.prepare('DELETE FROM state WHERE key = ?');

function getAllState() {
  const rows = stmtGetAll.all();
  const result = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }
  return result;
}

function getState(key) {
  const row = stmtGet.get(key);
  if (!row) return null;
  return { key: row.key, value: row.value, updated_at: row.updated_at };
}

function putState(key, value) {
  stmtUpsert.run(key, value);
}

function putStateBatch(entries) {
  const upsertMany = db.transaction((items) => {
    for (const [k, v] of Object.entries(items)) {
      stmtUpsert.run(k, v);
    }
  });
  upsertMany(entries);
}

function deleteState(key) {
  stmtDelete.run(key);
}

function close() {
  db.close();
}

module.exports = { getAllState, getState, putState, putStateBatch, deleteState, close };
