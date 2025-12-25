import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import database from '../../../lib/database';
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
    cb(null, 'showcase-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 40 * 1024 * 1024 // 40MB
  },
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
      const showcases = await database.query(`
        SELECT sc.*,
               COUNT(DISTINCT s.id) as shelf_count,
               COUNT(DISTINCT m.id) as mineral_count
        FROM showcases sc
        LEFT JOIN shelves s ON sc.id = s.showcase_id
        LEFT JOIN minerals m ON s.id = m.shelf_id
        GROUP BY sc.id
        ORDER BY sc.name
      `);

      res.status(200).json(showcases);
    } catch (error) {
      console.error('Fehler beim Laden der Vitrinen:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Vitrinen' });
    }
  } else if (req.method === 'POST') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        // Multer Middleware ausführen
        await runMiddleware(req, res, upload.single('image'));

        const { name, code, location, description } = (req as any).body;
        const image = (req as any).file;

        // Prüfen ob Code bereits existiert
        const existingShowcase = await database.get(
          'SELECT id FROM showcases WHERE code = ?',
          [code]
        );

        if (existingShowcase) {
          return res.status(400).json({ error: 'Vitrine-Code bereits vorhanden' });
        }

        const result = await database.run(
          'INSERT INTO showcases (name, code, location, description, image_path) VALUES (?, ?, ?, ?, ?)',
          [name, code, location, description, image ? image.filename : null]
        );

        res.status(201).json({ id: result.id, message: 'Vitrine erfolgreich hinzugefügt' });
      } catch (error) {
        console.error('Fehler beim Hinzufügen der Vitrine:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen der Vitrine' });
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