// check-db.js - Prüft die Datenbank-Struktur
// Ausführen mit: node check-db.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'mineralien.db');
const db = new sqlite3.Database(dbPath);

console.log('\n🔍 Prüfe Datenbank-Struktur...\n');

// Prüfe admin_sessions Tabelle
db.all("PRAGMA table_info(admin_sessions)", (err, columns) => {
  if (err) {
    console.error('❌ Fehler beim Prüfen von admin_sessions:', err);
  } else {
    console.log('📋 admin_sessions Spalten:');
    const hasCreatedAt = columns.some(col => col.name === 'created_at');
    columns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    
    if (hasCreatedAt) {
      console.log('   ✅ created_at Spalte existiert\n');
    } else {
      console.log('   ⚠️  created_at Spalte FEHLT - Migration nötig!\n');
    }
  }
});

// Prüfe ob blocked_ips existiert
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='blocked_ips'", (err, tables) => {
  if (err) {
    console.error('❌ Fehler beim Prüfen von blocked_ips:', err);
  } else {
    if (tables.length > 0) {
      console.log('✅ blocked_ips Tabelle existiert');
      
      // Zeige Struktur
      db.all("PRAGMA table_info(blocked_ips)", (err, columns) => {
        if (!err) {
          console.log('📋 blocked_ips Spalten:');
          columns.forEach(col => {
            console.log(`   - ${col.name} (${col.type})`);
          });
        }
        console.log('');
        
        // Zeige blockierte IPs
        db.all("SELECT * FROM blocked_ips", (err, rows) => {
          if (!err && rows.length > 0) {
            console.log(`📊 ${rows.length} blockierte IP(s):`);
            rows.forEach(row => {
              console.log(`   - ${row.ip_address}: ${row.reason}`);
            });
          } else {
            console.log('📊 Keine blockierten IPs');
          }
          console.log('');
        });
      });
    } else {
      console.log('⚠️  blocked_ips Tabelle FEHLT - wird automatisch erstellt\n');
    }
  }
});

// Zeige aktive Sessions
setTimeout(() => {
  db.all("SELECT * FROM admin_sessions WHERE expires_at > ?", [Date.now()], (err, sessions) => {
    if (err) {
      console.error('❌ Fehler beim Laden der Sessions:', err);
    } else {
      console.log(`📊 ${sessions.length} aktive Session(s)`);
      if (sessions.length > 0) {
        sessions.forEach((session, idx) => {
          const expiresIn = Math.round((session.expires_at - Date.now()) / 1000 / 60);
          console.log(`   ${idx + 1}. IP: ${session.ip_address || 'N/A'}, läuft ab in ${expiresIn} Minuten`);
        });
      }
      console.log('');
    }
    
    // Schließe Datenbank
    db.close((err) => {
      if (err) {
        console.error('❌ Fehler beim Schließen:', err);
      } else {
        console.log('✅ Prüfung abgeschlossen\n');
      }
    });
  });
}, 500);