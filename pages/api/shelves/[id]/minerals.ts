import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Pagination Parameter
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000; // Standard: alle
      const offset = (page - 1) * limit;

      // Regal-Informationen laden
      const shelfInfo = await database.get(`
        SELECT s.id,
              s.name,
              s.code,
              s.image_path,
              s.description,
              s.position_order,
              sc.name as showcase_name,
              sc.code as showcase_code,
              (sc.code || '-' || s.code) as full_code
        FROM shelves s
        LEFT JOIN showcases sc ON s.showcase_id = sc.id
        WHERE s.id = ?
      `, [id]);

      if (!shelfInfo) {
        return res.status(404).json({ error: 'Regal nicht gefunden' });
      }

      // Mineralien in diesem Regal laden mit Pagination
      const minerals = await database.query(`
        SELECT m.*
        FROM minerals m
        WHERE m.shelf_id = ?
        ORDER BY m.name
        LIMIT ? OFFSET ?
      `, [id, limit, offset]);

      // Gesamtanzahl für Info
      const totalResult = await database.get(`
        SELECT COUNT(*) as total
        FROM minerals m
        WHERE m.shelf_id = ?
      `, [id]);

      res.status(200).json({
        shelfInfo,
        minerals,
        pagination: {
          page,
          limit,
          total: totalResult.total,
          hasMore: offset + minerals.length < totalResult.total
        }
      });
    } catch (error) {
      console.error('Fehler beim Laden der Regal-Mineralien:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Regal-Mineralien' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}