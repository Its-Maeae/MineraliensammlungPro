/**
 * Migration: Add suspected_name column to minerals table
 *
 * Run once:  npx ts-node migrate_suspected_name.ts
 *
 * What it does:
 *   - Adds the nullable TEXT column `suspected_name` to the `minerals` table.
 *   - The column is only meaningful when `is_undetermined = 1`.
 *   - Existing rows get NULL (no suspected name), which is the correct default.
 *   - The script is idempotent: running it twice will not throw an error.
 */

import sqlite3 from 'sqlite3';
import path from 'path';

// ── Muss mit dem Pfad in database.ts übereinstimmen ──────────────────────────
const DB_PATH = path.join(process.cwd(), 'mineralien.db');
// ─────────────────────────────────────────────────────────────────────────────

function run(db: sqlite3.Database, sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function all(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function close(db: sqlite3.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function migrate() {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌  Fehler beim Öffnen der Datenbank:', err);
      process.exit(1);
    }
  });

  // Idempotency-Check: Spalte bereits vorhanden?
  const columns: Array<{ name: string }> = await all(db, `PRAGMA table_info(minerals)`);
  const alreadyExists = columns.some((col) => col.name === 'suspected_name');

  if (alreadyExists) {
    console.log('✅  Spalte `suspected_name` existiert bereits – nichts zu tun.');
    await close(db);
    return;
  }

  // Spalte hinzufügen
  await run(db, `ALTER TABLE minerals ADD COLUMN suspected_name TEXT DEFAULT NULL`);

  console.log('✅  Migration erfolgreich: Spalte `suspected_name` wurde zur Tabelle `minerals` hinzugefügt.');
  await close(db);
}

migrate().catch((err) => {
  console.error('❌  Migration fehlgeschlagen:', err);
  process.exit(1);
});