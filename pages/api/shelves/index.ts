import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../lib/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

// Multer Konfiguration
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
    cb(null, 'shelf-' + uniqueSuffix + path.extname(file.originalname));
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
      const shelves = await database.query(`
        SELECT s.*,
               sc.name as showcase_name,
               sc.code as showcase_code,
               (sc.code || '-' || s.code) as full_code,
               COUNT(m.id) as mineral_count
        FROM shelves s
        LEFT JOIN showcases sc ON s.showcase_id = sc.id
        LEFT JOIN minerals m ON s.id = m.shelf_id
        GROUP BY s.id
        ORDER BY sc.name, s.position_order, s.name
      `);

      res.status(200).json(shelves);
    } catch (error) {
      console.error('Fehler beim Laden der Regale:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Regale' });
    }
  } else if (req.method === 'POST') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        // Multer Middleware ausführen
        await runMiddleware(req, res, upload.single('image'));

        const { name, code, showcase_id, description, position_order } = (req as any).body;
        const image = (req as any).file;

        // Prüfen ob Code bereits in dieser Vitrine existiert
        const existingShelf = await database.get(
          'SELECT id FROM shelves WHERE code = ? AND showcase_id = ?',
          [code, showcase_id]
        );

        if (existingShelf) {
          return res.status(400).json({ error: 'Regal-Code bereits in dieser Vitrine vorhanden' });
        }

        const result = await database.run(
          'INSERT INTO shelves (name, code, showcase_id, description, position_order, image_path) VALUES (?, ?, ?, ?, ?, ?)',
          [name, code, showcase_id, description, position_order || 0, image ? image.filename : null]
        );

        res.status(201).json({ id: result.id, message: 'Regal erfolgreich hinzugefügt' });
      } catch (error) {
        console.error('Fehler beim Hinzufügen des Regals:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Regals' });
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