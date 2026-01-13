-- ============================================
-- Migration: Vitrinen→Regale zu Regale→Boxen
-- Datum: 2026-01-13
-- ACHTUNG: Backup vorher erstellen!
-- ============================================

BEGIN TRANSACTION;

-- Schritt 1: Mapping-Tabelle für Vitrine→Hauptregal
CREATE TEMPORARY TABLE showcase_to_shelf_mapping (
    old_showcase_id INTEGER PRIMARY KEY,
    new_shelf_id INTEGER,
    code TEXT
);

-- Schritt 2: Alle Vitrinen als Hauptregale in shelves einfügen
INSERT INTO shelves (name, code, description, image_path, position_order, showcase_id, created_at)
SELECT 
    name,
    code,
    description,
    image_path,
    position_order,
    NULL,  -- showcase_id = NULL → Hauptregal
    created_at
FROM showcases
ORDER BY position_order, id;

-- Schritt 3: Mapping befüllen (alte Vitrinen-ID → neue Regal-ID)
INSERT INTO showcase_to_shelf_mapping (old_showcase_id, new_shelf_id, code)
SELECT 
    sc.id,
    s.id,
    sc.code
FROM showcases sc
JOIN shelves s ON sc.code = s.code AND s.showcase_id IS NULL;

-- Schritt 4: Bestehende Regale zu Boxen konvertieren
-- showcase_id von Vitrinen-IDs zu Hauptregal-IDs ändern
UPDATE shelves
SET showcase_id = (
    SELECT new_shelf_id 
    FROM showcase_to_shelf_mapping 
    WHERE old_showcase_id = shelves.showcase_id
)
WHERE showcase_id IS NOT NULL;

-- Schritt 5: Verifizierung
SELECT 
    'Migration abgeschlossen' as status,
    (SELECT COUNT(*) FROM shelves WHERE showcase_id IS NULL) as hauptregale,
    (SELECT COUNT(*) FROM shelves WHERE showcase_id IS NOT NULL) as boxen,
    (SELECT COUNT(*) FROM minerals) as mineralien;

COMMIT;

-- Optional: showcases Tabelle leeren (erst nach Tests!)
-- DELETE FROM showcases;