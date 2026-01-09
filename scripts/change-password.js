const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Datenbankpfad relativ zum scripts-Ordner
const dbPath = path.join(__dirname, '..', 'mineralien.db');

console.log('Verwende Datenbank:', dbPath);

// Neues Passwort hier eingeben
const newPassword = 'DeinNeuesPasswort123';

if (!newPassword || newPassword === 'DeinNeuesPasswort123') {
    console.error('❌ FEHLER: Bitte setze ein neues Passwort in der Variable "newPassword"');
    process.exit(1);
}

// Datenbank öffnen
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Fehler beim Öffnen der Datenbank:', err);
        process.exit(1);
    }
    console.log('✅ Datenbank erfolgreich geöffnet');
});

// Passwort hashen und in Datenbank speichern
bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) {
        console.error('❌ Fehler beim Hashen des Passworts:', err);
        db.close();
        process.exit(1);
    }

    console.log('🔐 Passwort wurde gehasht...');

    db.run(
        'UPDATE admin_users SET password_hash = ? WHERE id = 1',
        [hash],
        function(err) {
            if (err) {
                console.error('❌ Fehler beim Aktualisieren des Passworts:', err);
                db.close();
                process.exit(1);
            }

            if (this.changes === 0) {
                console.error('❌ Kein Admin-Benutzer gefunden (id = 1)');
                db.close();
                process.exit(1);
            }

            console.log('✅ Passwort erfolgreich geändert!');
            console.log(`   Betroffene Zeilen: ${this.changes}`);
            
            db.close((err) => {
                if (err) {
                    console.error('Fehler beim Schließen der Datenbank:', err);
                } else {
                    console.log('📦 Datenbank geschlossen');
                }
            });
        }
    );
});