import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parse } from 'cookie';
import database from '../../../lib/database';

// Authentifizierungsfunktion
function checkAuthentication(req: NextApiRequest): boolean {
  try {
    const cookies = parse(req.headers.cookie || '');
    const sessionToken = cookies.admin_session;

    if (!sessionToken || !sessionToken.startsWith('authenticated-')) {
      return false;
    }

    // Token-Validierung (gleiche Logik wie in checks.ts)
    const tokenTimestamp = parseInt(sessionToken.split('-')[1]);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 Stunden

    if (now - tokenTimestamp > maxAge) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Authentifizierungsfehler:', error);
    return false;
  }
}

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
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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

// Multer Middleware für Next.js
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
      const { search = '', color = '', location = '', rock_type = '', sort = 'name' } = req.query;
      
      let sql = `
        SELECT m.*, 
               s.code as shelf_code, 
               sc.code as showcase_code
        FROM minerals m
        LEFT JOIN shelves s ON m.shelf_id = s.id
        LEFT JOIN showcases sc ON s.showcase_id = sc.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      if (search) {
        sql += ` AND (m.name LIKE ? OR m.number LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (color) {
        sql += ` AND m.color = ?`;
        params.push(color);
      }
      
      if (location) {
        sql += ` AND m.location = ?`;
        params.push(location);
      }
      
      if (rock_type) {
        sql += ` AND m.rock_type = ?`;
        params.push(rock_type);
      }
      
      // Sortierung
      switch (sort) {
        case 'number':
          sql += ` ORDER BY CAST(m.number AS INTEGER)`;
          break;
        case 'color':
          sql += ` ORDER BY m.color`;
          break;
        default:
          sql += ` ORDER BY m.name`;
      }
      
      const minerals = await database.query(sql, params);
      res.status(200).json(minerals);
    } catch (error) {
      console.error('Fehler beim Laden der Mineralien:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Mineralien' });
    }
  } else if (req.method === 'POST') {
    try {
      // Direkte Authentifizierungsprüfung
      if (!checkAuthentication(req)) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      // Multer Middleware ausführen
      await runMiddleware(req, res, upload.single('image'));
      
      const {
        name,
        number,
        color,
        description,
        location,
        purchase_location,
        rock_type,
        shelf_id,
        latitude,
        longitude  // NEU
      } = (req as any).body;
      
      const image = (req as any).file;
      
      // Prüfen ob Steinnummer bereits existiert
      const existingMineral = await database.get(
        'SELECT id FROM minerals WHERE number = ?',
        [number]
      );
      
      if (existingMineral) {
        return res.status(400).json({ error: 'Steinnummer bereits vorhanden' });
      }
      
      const result = await database.run(
        `INSERT INTO minerals (
          name, number, color, description, location, 
          purchase_location, rock_type, shelf_id, image_path, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          number,
          color,
          description,
          location,
          purchase_location,
          rock_type,
          shelf_id || null,
          image ? image.filename : null,
          latitude ? parseFloat(latitude) : null,
          longitude ? parseFloat(longitude) : null
        ]
      );
      
      res.status(201).json({ id: result.id, message: 'Mineral erfolgreich hinzugefügt' });
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Minerals:', error);
      res.status(500).json({ error: 'Fehler beim Hinzufügen des Minerals' });
    }
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