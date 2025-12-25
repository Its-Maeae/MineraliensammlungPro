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
  const { id } = req.query;
  const shelfId = parseInt(id as string);

  // Validierung der ID
  if (isNaN(shelfId)) {
    return res.status(400).json({ error: 'Ungültige Regal-ID' });
  }

  if (req.method === 'GET') {
    try {
      const shelf = await database.get(`
        SELECT s.*,
               sc.name as showcase_name,
               sc.code as showcase_code,
               (sc.code || '-' || s.code) as full_code
        FROM shelves s
        LEFT JOIN showcases sc ON s.showcase_id = sc.id
        WHERE s.id = ?
      `, [shelfId]);

      if (!shelf) {
        return res.status(404).json({ error: 'Regal nicht gefunden' });
      }

      res.status(200).json(shelf);
    } catch (error) {
      console.error('Fehler beim Laden des Regals:', error);
      res.status(500).json({ error: 'Fehler beim Laden des Regals' });
    }
  } else if (req.method === 'PUT') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        // Multer Middleware für Bildupload
        await runMiddleware(req, res, upload.single('image'));

        const { name, code, description, position_order } = (req as any).body;
        const image = (req as any).file;

        console.log('Update Shelf - ID:', shelfId, 'Data:', { name, code, description, position_order });

        // Validierung der Pflichtfelder
        if (!name || !code) {
          return res.status(400).json({ error: 'Name und Code sind erforderlich' });
        }

        // Aktuelles Regal laden um die showcase_id zu bekommen
        const currentShelf = await database.get('SELECT id, showcase_id, image_path FROM shelves WHERE id = ?', [shelfId]);
        
        if (!currentShelf) {
          return res.status(404).json({ error: 'Regal nicht gefunden' });
        }

        // Prüfen ob Code bereits in der Vitrine existiert (aktuelles Regal ausschließen)
        const existingShelf = await database.get(
          'SELECT id FROM shelves WHERE code = ? AND showcase_id = ? AND id != ?',
          [code, currentShelf.showcase_id, shelfId]
        );

        if (existingShelf) {
          return res.status(400).json({ error: 'Regal-Code bereits in dieser Vitrine vorhanden' });
        }

        // SQL für Update vorbereiten
        let sql = 'UPDATE shelves SET name = ?, code = ?, description = ?, position_order = ?';
        let params = [name, code, description || '', parseInt(position_order) || 0];

        // Neues Bild hinzufügen wenn vorhanden
        if (image) {
          sql += ', image_path = ?';
          params.push(image.filename);
          
          // Altes Bild löschen wenn vorhanden
          if (currentShelf.image_path) {
            const oldImagePath = path.join(process.cwd(), 'public/uploads', currentShelf.image_path);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (error) {
                console.error('Fehler beim Löschen des alten Bildes:', error);
              }
            }
          }
        }

        sql += ' WHERE id = ?';
        params.push(shelfId);

        console.log('Update SQL:', sql);
        console.log('Update Params:', params);

        const result = await database.run(sql, params);

        if (result.changes === 0) {
          return res.status(404).json({ error: 'Regal konnte nicht aktualisiert werden' });
        }

        // Aktualisiertes Regal zurückgeben
        const updatedShelf = await database.get(`
          SELECT s.*,
                 sc.name as showcase_name,
                 sc.code as showcase_code,
                 (sc.code || '-' || s.code) as full_code
          FROM shelves s
          LEFT JOIN showcases sc ON s.showcase_id = sc.id
          WHERE s.id = ?
        `, [shelfId]);

        res.status(200).json({ 
          message: 'Regal erfolgreich aktualisiert',
          shelf: updatedShelf
        });
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Regals:', error);
        res.status(500).json({ 
          error: 'Fehler beim Aktualisieren des Regals',
          details: error.message 
        });
      }
    });
  } else if (req.method === 'DELETE') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        // Regal-Informationen laden (für Bildlöschung)
        const shelf = await database.get('SELECT image_path FROM shelves WHERE id = ?', [shelfId]);
        
        if (!shelf) {
          return res.status(404).json({ error: 'Regal nicht gefunden' });
        }

        // Alle Mineralien von diesem Regal entfernen (shelf_id auf NULL setzen)
        await database.run('UPDATE minerals SET shelf_id = NULL WHERE shelf_id = ?', [shelfId]);

        // Regal löschen
        const result = await database.run('DELETE FROM shelves WHERE id = ?', [shelfId]);

        if (result.changes === 0) {
          return res.status(404).json({ error: 'Regal konnte nicht gelöscht werden' });
        }

        // Bild löschen wenn vorhanden
        if (shelf.image_path) {
          const imagePath = path.join(process.cwd(), 'public/uploads', shelf.image_path);
          if (fs.existsSync(imagePath)) {
            try {
              fs.unlinkSync(imagePath);
            } catch (error) {
              console.error('Fehler beim Löschen des Bildes:', error);
            }
          }
        }

        res.status(200).json({ message: 'Regal erfolgreich gelöscht' });
      } catch (error) {
        console.error('Fehler beim Löschen des Regals:', error);
        res.status(500).json({ 
          error: 'Fehler beim Löschen des Regals',
          details: error.message 
        });
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