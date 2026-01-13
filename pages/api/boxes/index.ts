// pages/api/boxes/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../lib/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'box-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien sind erlaubt'));
    }
  }
});

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Alle Boxen mit Shelf-Info und Mineral-Count
      const boxes = await database.query(`
        SELECT 
          s.*,
          sh.name as shelf_name,
          sh.code as shelf_code,
          (sh.code || '-' || s.code) as full_code,
          COUNT(m.id) as mineral_count
        FROM shelves s
        LEFT JOIN showcases sh ON s.showcase_id = sh.id
        LEFT JOIN minerals m ON s.id = m.shelf_id
        WHERE s.id IS NOT NULL
        GROUP BY s.id
        ORDER BY sh.code, s.position_order, s.name
      `);

      res.status(200).json(boxes);
    } catch (error) {
      console.error('Fehler beim Laden der Boxen:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Boxen' });
    }
  } else if (req.method === 'POST') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        await runMiddleware(req, res, upload.single('image'));

        const { name, code, shelf_id, description, position_order } = (req as any).body;
        const image = (req as any).file;

        // Prüfen ob Code bereits in diesem Regal existiert
        const existingBox = await database.get(
          'SELECT id FROM shelves WHERE code = ? AND showcase_id = (SELECT showcase_id FROM shelves WHERE id = ?)',
          [code, shelf_id]
        );

        if (existingBox) {
          return res.status(400).json({ error: 'Box-Code bereits in diesem Regal vorhanden' });
        }

        // Hole die showcase_id vom parent shelf
        const parentShelf = await database.get(
          'SELECT showcase_id FROM shelves WHERE id = ?',
          [shelf_id]
        );

        if (!parentShelf) {
          return res.status(404).json({ error: 'Regal nicht gefunden' });
        }

        const result = await database.run(
          'INSERT INTO shelves (name, code, showcase_id, description, position_order, image_path) VALUES (?, ?, ?, ?, ?, ?)',
          [name, code, parentShelf.showcase_id, description, position_order || 0, image ? image.filename : null]
        );

        res.status(201).json({ id: result.id, message: 'Box erfolgreich hinzugefügt' });
      } catch (error) {
        console.error('Fehler beim Hinzufügen der Box:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen der Box' });
      }
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};