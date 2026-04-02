import path from 'path';
import fs from 'fs';

export interface SyncLog {
  id: number;
  timestamp: string;
  booking_url: string;
  slots_found: number;
  slots_created: number;
  status: 'success' | 'error';
  error_message: string | null;
}

let db: import('better-sqlite3').Database | null = null;

function getDb(): import('better-sqlite3').Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'calsync.db');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  db = new Database(dbPath) as import('better-sqlite3').Database;

  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      booking_url TEXT NOT NULL,
      slots_found INTEGER NOT NULL DEFAULT 0,
      slots_created INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT
    )
  `);

  return db;
}

export function insertSyncLog(log: Omit<SyncLog, 'id'>): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO sync_logs (timestamp, booking_url, slots_found, slots_created, status, error_message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    log.timestamp,
    log.booking_url,
    log.slots_found,
    log.slots_created,
    log.status,
    log.error_message
  );
}

export function getRecentLogs(limit = 50): SyncLog[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM sync_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(limit) as SyncLog[];
}

export function getLastSyncLog(): SyncLog | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM sync_logs
    ORDER BY timestamp DESC
    LIMIT 1
  `);
  return stmt.get() as SyncLog | null;
}
