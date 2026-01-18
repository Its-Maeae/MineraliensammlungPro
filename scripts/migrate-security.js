// migrate-security.js
// Führen Sie dieses Script aus mit: node migrate-security.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'mineralien.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Starte Security-Migration...');

db.serialize(() => {
  // 1. Erstelle blocked_ips Tabelle
  db.run(`
    CREATE TABLE IF NOT EXISTS blocked_ips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL UNIQUE,
      blocked_at INTEGER NOT NULL,
      reason TEXT DEFAULT 'Verdächtige Aktivität',
      created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Fehler beim Erstellen der blocked_ips Tabelle:', err);
    } else {
      console.log('✅ blocked_ips Tabelle erstellt');
    }
  });

  // 2. Index für blocked_ips erstellen
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address)
  `, (err) => {
    if (err) {
      console.error('❌ Fehler beim Erstellen des Index:', err);
    } else {
      console.log('✅ Index für blocked_ips erstellt');
    }
  });

  // 3. Prüfe ob created_at Spalte in admin_sessions existiert
  db.all("PRAGMA table_info(admin_sessions)", (err, columns) => {
    if (err) {
      console.error('❌ Fehler beim Prüfen der Tabellenstruktur:', err);
      return;
    }

    const hasCreatedAt = columns.some(col => col.name === 'created_at');

    if (!hasCreatedAt) {
      console.log('📝 created_at Spalte fehlt in admin_sessions, füge hinzu...');

      // Temporäre Tabelle erstellen
      db.run(`
        CREATE TABLE admin_sessions_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT NOT NULL UNIQUE,
          user_id INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          ip_address TEXT,
          last_activity INTEGER,
          created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
          FOREIGN KEY (user_id) REFERENCES admin_users(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Fehler beim Erstellen der neuen Tabelle:', err);
          return;
        }

        // Daten kopieren
        db.run(`
          INSERT INTO admin_sessions_new (id, token, user_id, expires_at, ip_address, last_activity, created_at)
          SELECT id, token, user_id, expires_at, ip_address, last_activity, 
                 expires_at - (24 * 60 * 60 * 1000) as created_at
          FROM admin_sessions
        `, (err) => {
          if (err) {
            console.error('❌ Fehler beim Kopieren der Daten:', err);
            return;
          }

          // Alte Tabelle löschen
          db.run(`DROP TABLE admin_sessions`, (err) => {
            if (err) {
              console.error('❌ Fehler beim Löschen der alten Tabelle:', err);
              return;
            }

            // Neue Tabelle umbenennen
            db.run(`ALTER TABLE admin_sessions_new RENAME TO admin_sessions`, (err) => {
              if (err) {
                console.error('❌ Fehler beim Umbenennen der Tabelle:', err);
                return;
              }

              // Indizes erstellen
              db.run(`CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token)`);
              db.run(`CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id)`);
              db.run(`CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at)`);

              console.log('✅ admin_sessions Tabelle erfolgreich migriert');
            });
          });
        });
      });
    } else {
      console.log('✅ created_at Spalte existiert bereits in admin_sessions');
    }
  });
});

// Warte 2 Sekunden und schließe dann die Datenbankverbindung
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('❌ Fehler beim Schließen der Datenbank:', err);
    } else {
      console.log('✅ Migration abgeschlossen, Datenbankverbindung geschlossen');
    }
  });
}, 2000);