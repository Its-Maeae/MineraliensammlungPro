/**
 * Migration: Add is_undetermined column to minerals table
 *
 * Ausführen mit:  npx ts-node scripts/migrate_add_is_undetermined.ts
 * (oder nach Kompilierung:  node scripts/migrate_add_is_undetermined.js)
 */

import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'mineralien.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Fehler beim Öffnen der Datenbank:', err.message);
    process.exit(1);
  }
  console.log('✅ Datenbankverbindung hergestellt:', dbPath);
});

db.serialize(() => {
  // Prüfen ob die Spalte bereits existiert
  db.all("PRAGMA table_info(minerals)", (err, rows: any[]) => {
    if (err) {
      console.error('❌ Fehler beim Lesen der Tabellenstruktur:', err.message);
      db.close();
      process.exit(1);
    }

    const columnExists = rows.some((row) => row.name === 'is_undetermined');

    if (columnExists) {
      console.log('ℹ️  Spalte "is_undetermined" existiert bereits – Migration wird übersprungen.');
      db.close(() => {
        console.log('✅ Datenbankverbindung geschlossen.');
        process.exit(0);
      });
      return;
    }

    // Spalte hinzufügen
    db.run(
      "ALTER TABLE minerals ADD COLUMN is_undetermined INTEGER NOT NULL DEFAULT 0",
      (err) => {
        if (err) {
          console.error('❌ Fehler beim Hinzufügen der Spalte:', err.message);
          db.close();
          process.exit(1);
        }

        console.log('✅ Spalte "is_undetermined" erfolgreich hinzugefügt.');

        // Verifizieren
        db.all("PRAGMA table_info(minerals)", (err, updatedRows: any[]) => {
          if (err) {
            console.error('❌ Fehler beim Verifizieren:', err.message);
          } else {
            const added = updatedRows.find((row) => row.name === 'is_undetermined');
            if (added) {
              console.log('✅ Verifikation erfolgreich:', added);
            } else {
              console.error('❌ Verifikation fehlgeschlagen – Spalte nicht gefunden!');
            }
          }

          db.close((err) => {
            if (err) {
              console.error('❌ Fehler beim Schließen der Datenbank:', err.message);
              process.exit(1);
            }
            console.log('✅ Migration abgeschlossen. Datenbankverbindung geschlossen.');
            process.exit(0);
          });
        });
      }
    );
  });
});