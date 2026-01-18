// fix-admin-sessions.js
// Erstellt die admin_sessions Tabelle neu
// Ausführen mit: node fix-admin-sessions.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'mineralien.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Repariere admin_sessions Tabelle...\n');

db.serialize(() => {
  // Prüfe ob admin_sessions_backup existiert
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_sessions_backup'", (err, table) => {
    if (table) {
      console.log('✅ Backup gefunden, stelle wieder her...');
      
      // Erstelle neue Tabelle
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
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
          console.error('❌ Fehler beim Erstellen der Tabelle:', err);
          return;
        }
        
        // Kopiere Daten aus Backup
        db.run(`
          INSERT INTO admin_sessions (id, token, user_id, expires_at, ip_address, last_activity, created_at)
          SELECT id, token, user_id, expires_at, ip_address, last_activity, 
                 (expires_at - 86400000) as created_at
          FROM admin_sessions_backup
        `, (err) => {
          if (err) {
            console.error('❌ Fehler beim Kopieren der Daten:', err);
            return;
          }
          
          console.log('✅ Daten wiederhergestellt');
          
          // Lösche Backup
          db.run('DROP TABLE admin_sessions_backup', (err) => {
            if (err) {
              console.error('❌ Fehler beim Löschen des Backups:', err);
            } else {
              console.log('✅ Backup gelöscht');
            }
            createIndexes();
          });
        });
      });
    } else {
      console.log('ℹ️  Kein Backup gefunden, erstelle neue Tabelle...');
      
      // Erstelle neue leere Tabelle
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
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
          console.error('❌ Fehler beim Erstellen der Tabelle:', err);
        } else {
          console.log('✅ Neue admin_sessions Tabelle erstellt');
          createIndexes();
        }
      });
    }
  });
});

function createIndexes() {
  console.log('\n📑 Erstelle Indizes...');
  
  db.run('CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token)', (err) => {
    if (err) console.error('❌ Index token:', err);
    else console.log('✅ Index: token');
  });
  
  db.run('CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id)', (err) => {
    if (err) console.error('❌ Index user_id:', err);
    else console.log('✅ Index: user_id');
  });
  
  db.run('CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at)', (err) => {
    if (err) console.error('❌ Index expires_at:', err);
    else console.log('✅ Index: expires_at');
    
    // Zeige finale Struktur
    setTimeout(() => {
      db.all("PRAGMA table_info(admin_sessions)", (err, columns) => {
        if (!err) {
          console.log('\n📋 Finale Struktur:');
          columns.forEach(col => {
            console.log(`   - ${col.name} (${col.type})`);
          });
        }
        
        console.log('\n✅ Reparatur abgeschlossen!');
        console.log('ℹ️  Bitte melde dich neu im Admin-Bereich an.\n');
        
        db.close();
      });
    }, 500);
  });
}