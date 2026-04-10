import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../lib/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'section-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Nur Bilddateien sind erlaubt'));
  },
});

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // GET /api/sections?shelf_id=X  → alle Sektionen einer Box
    try {
      const { shelf_id } = req.query;

      if (!shelf_id) {
        return res.status(400).json({ error: 'shelf_id ist erforderlich' });
      }

      const sections = await database.query(
        `SELECT ss.*,
                s.code  as shelf_code,
                sc.code as showcase_code,
                (sc.code || '-' || s.code || '-' || ss.code) as full_code,
                COUNT(m.id) as mineral_count
         FROM shelf_sections ss
         LEFT JOIN shelves s   ON ss.shelf_id    = s.id
         LEFT JOIN showcases sc ON s.showcase_id = sc.id
         LEFT JOIN minerals m  ON m.section_id   = ss.id
         WHERE ss.shelf_id = ?
         GROUP BY ss.id
         ORDER BY ss.position_order, ss.code`,
        [shelf_id]
      );

      return res.status(200).json(sections);
    } catch (error) {
      console.error('Fehler beim Laden der Sektionen:', error);
      return res.status(500).json({ error: 'Fehler beim Laden der Sektionen' });
    }
  } else if (req.method === 'POST') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        await runMiddleware(req, res, upload.single('image'));

        const { shelf_id, name, code, description, position_order } = (req as any).body;
        const image = (req as any).file;

        if (!shelf_id || !name || !code) {
          return res.status(400).json({ error: 'shelf_id, Name und Code sind erforderlich' });
        }

        // Code-Eindeutigkeit innerhalb der Box prüfen
        const existing = await database.get(
          'SELECT id FROM shelf_sections WHERE code = ? AND shelf_id = ?',
          [code, shelf_id]
        );
        if (existing) {
          return res.status(400).json({ error: 'Sektions-Code bereits in dieser Box vorhanden' });
        }

        // Prüfen ob dies die erste Sektion in dieser Box ist (vor dem Insert!)
        const existingSectionCount = await database.get(
          'SELECT COUNT(*) as count FROM shelf_sections WHERE shelf_id = ?',
          [shelf_id]
        );
        const isFirstSection = existingSectionCount.count === 0;

        const result = await database.run(
          `INSERT INTO shelf_sections (shelf_id, name, code, description, position_order, image_path)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            shelf_id,
            name,
            code,
            description || null,
            parseInt(position_order) || 0,
            image ? image.filename : null,
          ]
        );

        const newSectionId = result.id;

        // Wenn dies die erste Sektion ist: alle bisher direkt in der Box
        // liegenden Mineralien (section_id = NULL) automatisch in diese Sektion verschieben.
        let movedMineralCount = 0;
        if (isFirstSection) {
          const moveResult = await database.run(
            `UPDATE minerals
             SET section_id = ?
             WHERE shelf_id = ? AND (section_id IS NULL OR section_id = 0)`,
            [newSectionId, shelf_id]
          );
          movedMineralCount = moveResult.changes ?? 0;
        }

        return res.status(201).json({
          id: newSectionId,
          message: 'Sektion erfolgreich hinzugefügt',
          ...(isFirstSection && movedMineralCount > 0 && {
            movedMinerals: movedMineralCount,
            movedMineralsMessage: `${movedMineralCount} Mineral${movedMineralCount !== 1 ? 'ien' : ''} wurde${movedMineralCount !== 1 ? 'n' : ''} automatisch in diese Sektion verschoben`,
          }),
        });
      } catch (error) {
        console.error('Fehler beim Erstellen der Sektion:', error);
        return res.status(500).json({ error: 'Fehler beim Erstellen der Sektion' });
      }
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = { api: { bodyParser: false } };