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
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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

function invalidateChartCache() {
  try {
    const chartDataModule = require('../chart-data');
    if (chartDataModule.invalidateChartCache) {
      chartDataModule.invalidateChartCache();
    }
  } catch (error) {
    console.error('Fehler beim Invalidieren des Chart-Caches:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const mineral = await database.get(
        `SELECT m.*, 
                s.code as shelf_code, 
                s.name as shelf_name,
                sc.code as showcase_code,
                sc.name as showcase_name
         FROM minerals m
         LEFT JOIN shelves s ON m.shelf_id = s.id
         LEFT JOIN showcases sc ON s.showcase_id = sc.id
         WHERE m.id = ?`,
        [id]
      );

      if (!mineral) {
        return res.status(404).json({ error: 'Mineral nicht gefunden' });
      }

      res.status(200).json(mineral);
    } catch (error) {
      console.error('Fehler beim Laden des Minerals:', error);
      res.status(500).json({ error: 'Fehler beim Laden des Minerals' });
    }
  } else if (req.method === 'PUT') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
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
          longitude,
          is_undetermined,
          suspected_name
        } = (req as any).body;

        const image = (req as any).file;
        const undetermined = is_undetermined === 'true' || is_undetermined === true ? 1 : 0;

        // Prüfen ob Steinnummer bereits von anderem Mineral verwendet wird
        const existingMineral = await database.get(
          'SELECT id FROM minerals WHERE number = ? AND id != ?',
          [number, id]
        );

        if (existingMineral) {
          return res.status(400).json({ error: 'Steinnummer bereits vorhanden' });
        }

        // Handle coordinates
        let parsedLatitude = null;
        let parsedLongitude = null;

        if (latitude !== '' && latitude !== undefined && latitude !== null) {
          const lat = parseFloat(latitude);
          if (!isNaN(lat)) parsedLatitude = lat;
        }

        if (longitude !== '' && longitude !== undefined && longitude !== null) {
          const lng = parseFloat(longitude);
          if (!isNaN(lng)) parsedLongitude = lng;
        }

        // When undetermined, clear non-essential fields (Farbe bleibt erhalten)
        const finalName = undetermined ? 'Unbestimmtes Mineral' : name;
        const finalColor = color || null;               // Farbe auch bei unbestimmten speichern
        const finalDescription = undetermined ? null : (description || null);
        const finalLocation = undetermined ? null : (location || null);
        const finalPurchaseLocation = undetermined ? null : (purchase_location || null);
        const finalRockType = undetermined ? null : (rock_type || null);
        // suspected_name only makes sense when undetermined; clear it when toggling off
        const finalSuspectedName = undetermined ? (suspected_name || null) : null;

        let sql = `UPDATE minerals SET 
                  name = ?, number = ?, color = ?, description = ?, location = ?,
                  purchase_location = ?, rock_type = ?, shelf_id = ?, latitude = ?, longitude = ?,
                  is_undetermined = ?, suspected_name = ?`;
        let params: any[] = [
          finalName, number, finalColor, finalDescription, finalLocation,
          finalPurchaseLocation, finalRockType, shelf_id || null,
          parsedLatitude, parsedLongitude, undetermined, finalSuspectedName
        ];

        if (image) {
          sql += `, image_path = ?`;
          params.push(image.filename);
        }

        sql += ` WHERE id = ?`;
        params.push(id);

        await database.run(sql, params);

        invalidateChartCache();

        res.status(200).json({ message: 'Mineral erfolgreich aktualisiert' });
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Minerals:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Minerals' });
      }
    });
  } else if (req.method === 'DELETE') {
    return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
      try {
        const result = await database.run('DELETE FROM minerals WHERE id = ?', [id]);

        if (result.changes === 0) {
          return res.status(404).json({ error: 'Mineral nicht gefunden' });
        }

        invalidateChartCache();

        res.status(200).json({ message: 'Mineral erfolgreich gelöscht' });
      } catch (error) {
        console.error('Fehler beim Löschen des Minerals:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Minerals' });
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