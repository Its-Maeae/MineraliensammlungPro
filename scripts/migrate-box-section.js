/**
 * Migration: Box-Sektionen (shelf_sections)
 * 
 * Fügt eine neue Tabelle "shelf_sections" hinzu, die Unterteilungen
 * einer Box (shelf) darstellen.
 * 
 * Neues Code-System:
 *   V01-01      → Regal (showcase) V01, Box 01
 *   V01-01-A    → Regal V01, Box 01, Sektion A
 * 
 * Mineralien können nun entweder direkt einer Box (shelf_id) ODER
 * einer Sektion (section_id) zugeordnet sein. Wenn section_id gesetzt
 * ist, hat shelf_id Vorrang für Vitrinenstruktur, section_id präzisiert.
 * 
 * Ausführen: node migrate_box_sections.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'mineralien.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Fehler beim Öffnen der Datenbank:', err.message);
    process.exit(1);
  }
  console.log('✅ Datenbankverbindung hergestellt:', dbPath);
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrate() {
  console.log('\n🚀 Starte Migration: Box-Sektionen\n');

  // ── 1. Prüfen ob shelf_sections bereits existiert ──────────────────────────
  const existing = await get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='shelf_sections'`
  );

  if (existing) {
    console.log('⚠️  Tabelle "shelf_sections" existiert bereits – Migration übersprungen.');
    db.close();
    return;
  }

  // ── 2. Tabelle shelf_sections erstellen ────────────────────────────────────
  await run(`
    CREATE TABLE shelf_sections (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      shelf_id       INTEGER NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
      name           TEXT    NOT NULL,
      code           TEXT    NOT NULL,
      description    TEXT,
      position_order INTEGER NOT NULL DEFAULT 0,
      image_path     TEXT,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(shelf_id, code)
    )
  `);
  console.log('✅ Tabelle "shelf_sections" erstellt');

  // ── 3. Index für schnelle Lookups ──────────────────────────────────────────
  await run(`CREATE INDEX idx_shelf_sections_shelf_id ON shelf_sections(shelf_id)`);
  console.log('✅ Index auf shelf_sections(shelf_id) erstellt');

  // ── 4. Spalte section_id zu minerals hinzufügen ───────────────────────────
  // SQLite erlaubt kein ADD COLUMN mit FOREIGN KEY direkt, daher ohne Constraint
  try {
    await run(`ALTER TABLE minerals ADD COLUMN section_id INTEGER REFERENCES shelf_sections(id) ON DELETE SET NULL`);
    console.log('✅ Spalte "section_id" zu "minerals" hinzugefügt');
  } catch (e) {
    // Falls die Spalte schon existiert (z.B. teilweise Migration)
    if (e.message.includes('duplicate column')) {
      console.log('⚠️  Spalte "section_id" existiert bereits');
    } else {
      throw e;
    }
  }

  // ── 5. Index für section_id auf minerals ──────────────────────────────────
  await run(`CREATE INDEX IF NOT EXISTS idx_minerals_section_id ON minerals(section_id)`);
  console.log('✅ Index auf minerals(section_id) erstellt');

  // ── 6. Überprüfung ─────────────────────────────────────────────────────────
  const sectionTable = await get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='shelf_sections'`
  );
  const mineralColumns = await all(`PRAGMA table_info(minerals)`);
  const hasSectionId = mineralColumns.some(c => c.name === 'section_id');

  console.log('\n📋 Überprüfung:');
  console.log('  shelf_sections Tabelle:', sectionTable ? '✅' : '❌');
  console.log('  minerals.section_id Spalte:', hasSectionId ? '✅' : '❌');

  // ── 7. Beispiel-Daten anzeigen ─────────────────────────────────────────────
  const shelfCount = await get(`SELECT COUNT(*) as count FROM shelves`);
  const mineralCount = await get(`SELECT COUNT(*) as count FROM minerals`);
  console.log('\n📊 Aktuelle Datenbankstatistiken:');
  console.log(`  Boxen (shelves): ${shelfCount.count}`);
  console.log(`  Mineralien:      ${mineralCount.count}`);
  console.log(`  Sektionen:       0 (neu)`);

  console.log('\n✅ Migration erfolgreich abgeschlossen!\n');
  console.log('📝 Nächste Schritte:');
  console.log('  1. API-Routen für /api/sections/* hinzufügen');
  console.log('  2. Frontend-Komponenten aktualisieren');
  console.log('  3. App neu starten\n');

  db.close();
}

migrate().catch((err) => {
  console.error('\n❌ Migration fehlgeschlagen:', err.message);
  db.close();
  process.exit(1);
});