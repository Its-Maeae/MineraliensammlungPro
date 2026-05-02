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
    cb(null, 'showcase-' + uniqueSuffix + path.extname(file.originalname));
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
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // FIX: Aggregate shelf_count and mineral_count directly in the query
      // so the detail endpoint returns the same stats as the list endpoint.
      const showcase = await database.get(`
        SELECT sc.*,
               COUNT(DISTINCT s.id) as shelf_count,
               COUNT(DISTINCT m.id) as mineral_count
        FROM showcases sc
        LEFT JOIN shelves s ON sc.id = s.showcase_id
        LEFT JOIN minerals m ON s.id = m.shelf_id
        WHERE sc.id = ?
        GROUP BY sc.id
      `, [id]);

      if (!showcase) {
        return res.status(404).json({ error: 'Vitrine nicht gefunden' });
      }

      // Regale dieser Vitrine laden – inkl. mineral_count und section_count pro Box
      const shelves = await database.query(`
        SELECT s.*,
               sc.code as showcase_code,
               (sc.code || '-' || s.code) as full_code,
               COUNT(DISTINCT m.id)  as mineral_count,
               COUNT(DISTINCT ss.id) as section_count
        FROM shelves s
        LEFT JOIN showcases sc       ON s.showcase_id  = sc.id
        LEFT JOIN minerals m         ON s.id           = m.shelf_id
        LEFT JOIN shelf_sections ss  ON s.id           = ss.shelf_id
        WHERE s.showcase_id = ?
        GROUP BY s.id
        ORDER BY s.position_order, s.name
      `, [id]);

      showcase.shelves = shelves;

      res.status(200).json(showcase);
    } catch (error) {
      console.error('Fehler beim Laden der Vitrine:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Vitrine' });
    }
  } else if (req.method === 'PUT') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        await runMiddleware(req, res, upload.single('image'));

        const { name, code, location, description } = (req as any).body;
        const image = (req as any).file;

        const existingShowcase = await database.get(
          'SELECT id FROM showcases WHERE code = ? AND id != ?',
          [code, id]
        );

        if (existingShowcase) {
          return res.status(400).json({ error: 'Vitrine-Code bereits vorhanden' });
        }

        let sql = `UPDATE showcases SET name = ?, code = ?, location = ?, description = ?`;
        let params = [name, code, location || '', description || ''];

        if (image) {
          sql += `, image_path = ?`;
          params.push(image.filename);
        }

        sql += ` WHERE id = ?`;
        params.push(id);

        const result = await database.run(sql, params);

        if (result.changes === 0) {
          return res.status(404).json({ error: 'Vitrine nicht gefunden' });
        }

        res.status(200).json({ message: 'Vitrine erfolgreich aktualisiert' });
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Vitrine:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren der Vitrine' });
      }
    });
  } else if (req.method === 'DELETE') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        // Mineralien aus Sektionen lösen
        await database.run(`
          UPDATE minerals
          SET section_id = NULL
          WHERE shelf_id IN (SELECT id FROM shelves WHERE showcase_id = ?)
        `, [id]);

        // Mineralien aus Regalen lösen
        await database.run(`
          UPDATE minerals
          SET shelf_id = NULL
          WHERE shelf_id IN (SELECT id FROM shelves WHERE showcase_id = ?)
        `, [id]);

        // Sektionen der Regale löschen
        await database.run(`
          DELETE FROM shelf_sections
          WHERE shelf_id IN (SELECT id FROM shelves WHERE showcase_id = ?)
        `, [id]);

        // Regale löschen
        await database.run('DELETE FROM shelves WHERE showcase_id = ?', [id]);

        // Vitrine löschen
        const result = await database.run('DELETE FROM showcases WHERE id = ?', [id]);

        if (result.changes === 0) {
          return res.status(404).json({ error: 'Vitrine nicht gefunden' });
        }

        res.status(200).json({ message: 'Vitrine erfolgreich gelöscht' });
      } catch (error) {
        console.error('Fehler beim Löschen der Vitrine:', error);
        res.status(500).json({ error: 'Fehler beim Löschen der Vitrine' });
      }
    });
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};