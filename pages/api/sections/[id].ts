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
  const { id } = req.query;
  const sectionId = parseInt(id as string);

  if (isNaN(sectionId)) {
    return res.status(400).json({ error: 'Ungültige Sektions-ID' });
  }

  if (req.method === 'GET') {
    try {
      const section = await database.get(
        `SELECT ss.*,
                s.code  as shelf_code,
                sc.code as showcase_code,
                (sc.code || '-' || s.code || '-' || ss.code) as full_code,
                COUNT(m.id) as mineral_count
         FROM shelf_sections ss
         LEFT JOIN shelves s   ON ss.shelf_id    = s.id
         LEFT JOIN showcases sc ON s.showcase_id = sc.id
         LEFT JOIN minerals m  ON m.section_id   = ss.id
         WHERE ss.id = ?
         GROUP BY ss.id`,
        [sectionId]
      );

      if (!section) {
        return res.status(404).json({ error: 'Sektion nicht gefunden' });
      }

      return res.status(200).json(section);
    } catch (error) {
      console.error('Fehler beim Laden der Sektion:', error);
      return res.status(500).json({ error: 'Fehler beim Laden der Sektion' });
    }
  } else if (req.method === 'PUT') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        await runMiddleware(req, res, upload.single('image'));

        const { name, code, description, position_order } = (req as any).body;
        const image = (req as any).file;

        if (!name || !code) {
          return res.status(400).json({ error: 'Name und Code sind erforderlich' });
        }

        const current = await database.get(
          'SELECT id, shelf_id, image_path FROM shelf_sections WHERE id = ?',
          [sectionId]
        );
        if (!current) {
          return res.status(404).json({ error: 'Sektion nicht gefunden' });
        }

        // Code-Eindeutigkeit innerhalb der Box
        const existing = await database.get(
          'SELECT id FROM shelf_sections WHERE code = ? AND shelf_id = ? AND id != ?',
          [code, current.shelf_id, sectionId]
        );
        if (existing) {
          return res.status(400).json({ error: 'Sektions-Code bereits in dieser Box vorhanden' });
        }

        let sql = `UPDATE shelf_sections SET name = ?, code = ?, description = ?, position_order = ?`;
        let params: any[] = [name, code, description || null, parseInt(position_order) || 0];

        if (image) {
          sql += `, image_path = ?`;
          params.push(image.filename);

          // Altes Bild löschen
          if (current.image_path) {
            const oldPath = path.join(process.cwd(), 'public/uploads', current.image_path);
            if (fs.existsSync(oldPath)) {
              try { fs.unlinkSync(oldPath); } catch {}
            }
          }
        }

        sql += ` WHERE id = ?`;
        params.push(sectionId);

        await database.run(sql, params);

        return res.status(200).json({ message: 'Sektion erfolgreich aktualisiert' });
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Sektion:', error);
        return res.status(500).json({ error: 'Fehler beim Aktualisieren der Sektion' });
      }
    });
  } else if (req.method === 'DELETE') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        const section = await database.get(
          'SELECT image_path FROM shelf_sections WHERE id = ?',
          [sectionId]
        );
        if (!section) {
          return res.status(404).json({ error: 'Sektion nicht gefunden' });
        }

        // Mineralien aus Sektion lösen (section_id → NULL), shelf_id bleibt
        await database.run(
          'UPDATE minerals SET section_id = NULL WHERE section_id = ?',
          [sectionId]
        );

        await database.run('DELETE FROM shelf_sections WHERE id = ?', [sectionId]);

        // Bild löschen
        if (section.image_path) {
          const imgPath = path.join(process.cwd(), 'public/uploads', section.image_path);
          if (fs.existsSync(imgPath)) {
            try { fs.unlinkSync(imgPath); } catch {}
          }
        }

        return res.status(200).json({ message: 'Sektion erfolgreich gelöscht' });
      } catch (error) {
        console.error('Fehler beim Löschen der Sektion:', error);
        return res.status(500).json({ error: 'Fehler beim Löschen der Sektion' });
      }
    });
  } else if (req.method === 'PATCH') {
    // PATCH /api/sections/[id] – Reihenfolge tauschen
    // Body: { swap_with: number }  (ID der anderen Sektion)
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        const body = JSON.parse(
          Buffer.from(await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            (req as any).on('data', (chunk: Buffer) => chunks.push(chunk));
            (req as any).on('end', () => resolve(Buffer.concat(chunks)));
            (req as any).on('error', reject);
          })).toString()
        );

        const { swap_with } = body;
        if (!swap_with) {
          return res.status(400).json({ error: 'swap_with ist erforderlich' });
        }

        const a = await database.get(
          'SELECT id, position_order FROM shelf_sections WHERE id = ?',
          [sectionId]
        );
        const b = await database.get(
          'SELECT id, position_order FROM shelf_sections WHERE id = ?',
          [swap_with]
        );

        if (!a || !b) {
          return res.status(404).json({ error: 'Sektion nicht gefunden' });
        }

        await database.run(
          'UPDATE shelf_sections SET position_order = ? WHERE id = ?',
          [b.position_order, a.id]
        );
        await database.run(
          'UPDATE shelf_sections SET position_order = ? WHERE id = ?',
          [a.position_order, b.id]
        );

        return res.status(200).json({ message: 'Reihenfolge erfolgreich getauscht' });
      } catch (error) {
        console.error('Fehler beim Tauschen der Reihenfolge:', error);
        return res.status(500).json({ error: 'Fehler beim Tauschen der Reihenfolge' });
      }
    });
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = { api: { bodyParser: false } };