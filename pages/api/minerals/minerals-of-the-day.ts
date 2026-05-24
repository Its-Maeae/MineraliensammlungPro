import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../lib/database';

function hashDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (Math.imul(31, h) + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

async function ensureHistoryTable() {
  await database.run(`
    CREATE TABLE IF NOT EXISTS mineral_of_the_day_history (
      date        TEXT PRIMARY KEY,   -- YYYY-MM-DD
      mineral_id  INTEGER NOT NULL
    )
  `);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    await ensureHistoryTable();

    // Heutiges Datum als YYYY-MM-DD (Server-Zeitzone)
    const today = new Date().toISOString().slice(0, 10);

    // Bereits für heute gespeichert?
    const cached = await database.get(
      'SELECT mineral_id FROM mineral_of_the_day_history WHERE date = ?',
      [today]
    );

    let mineralId: number;

    if (cached) {
      mineralId = cached.mineral_id;
    } else {
      // IDs aus den letzten 30 Tagen ermitteln, die nicht wiederholt werden sollen
      const history = await database.query(
        `SELECT mineral_id FROM mineral_of_the_day_history
         WHERE date >= date(?, '-30 days')
         ORDER BY date DESC`,
        [today]
      );
      const usedIds: number[] = history.map((r: any) => r.mineral_id);

      // Kandidaten laden: nicht unbestimmt, kein "Kohle" im Namen
      let candidates = await database.query(
        `SELECT id FROM minerals
         WHERE (is_undetermined = 0 OR is_undetermined IS NULL)
           AND LOWER(name) NOT LIKE '%kohle%'
         ORDER BY id`,
        []
      );

      // Bereits benutzte IDs ausfiltern – falls zu wenig Kandidaten übrig,
      // Fenster schrittweise verkleinern bis mindestens einer übrig bleibt
      let filtered = candidates.filter((r: any) => !usedIds.includes(r.id));

      if (filtered.length === 0) {
        // Notfall-Fallback: einfach alle Kandidaten nehmen
        filtered = candidates;
      }

      if (filtered.length === 0) {
        return res.status(404).json({ error: 'Keine geeigneten Mineralien vorhanden' });
      }

      // Deterministisch per Datum-Hash wählen
      const seed = hashDate(today);
      const index = seed % filtered.length;
      mineralId = filtered[index].id;

      // In History speichern
      await database.run(
        'INSERT OR REPLACE INTO mineral_of_the_day_history (date, mineral_id) VALUES (?, ?)',
        [today, mineralId]
      );

      // History älter als 60 Tage bereinigen
      await database.run(
        "DELETE FROM mineral_of_the_day_history WHERE date < date(?, '-60 days')",
        [today]
      );
    }

    // Vollständige Mineral-Daten laden
    const mineral = await database.get(
      `SELECT m.*,
              s.code  as shelf_code,
              s.name  as shelf_name,
              sc.code as showcase_code,
              sc.name as showcase_name,
              ss.code as section_code,
              CASE
                WHEN ss.id IS NOT NULL THEN (sc.code || '-' || s.code || '-' || ss.code)
                WHEN s.id  IS NOT NULL THEN (sc.code || '-' || s.code)
                ELSE NULL
              END as full_location_code
       FROM minerals m
       LEFT JOIN shelves s         ON m.shelf_id  = s.id
       LEFT JOIN showcases sc      ON s.showcase_id = sc.id
       LEFT JOIN shelf_sections ss ON m.section_id  = ss.id
       WHERE m.id = ?`,
      [mineralId]
    );

    if (!mineral) {
      return res.status(404).json({ error: 'Mineral nicht gefunden' });
    }

    res.status(200).json({ ...mineral, date: today });
  } catch (error) {
    console.error('Fehler beim Laden des Steins des Tages:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Steins des Tages' });
  }
}