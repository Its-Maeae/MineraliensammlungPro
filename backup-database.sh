#!/bin/bash

# Backup der Mineralien-Datenbank
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"
DB_FILE="mineralien.db"
BACKUP_FILE="${BACKUP_DIR}/mineralien_backup_${TIMESTAMP}.db"

# Backup-Verzeichnis erstellen
mkdir -p $BACKUP_DIR

# Datenbank kopieren
echo "Erstelle Backup: $BACKUP_FILE"
cp $DB_FILE $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup erfolgreich erstellt!"
    echo "Dateigröße: $(du -h $BACKUP_FILE | cut -f1)"
    ls -lh $BACKUP_DIR
else
    echo "❌ Fehler beim Erstellen des Backups!"
    exit 1
fi