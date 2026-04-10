import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../../lib/database';

/**
 * GET /api/sections/[id]/minerals
 * Returns minerals belonging to a specific section.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = (page - 1) * limit;

    // Validate section exists
    const sectionInfo = await database.get(`
      SELECT ss.*,
             s.code  as shelf_code,
             sc.code as showcase_code,
             sc.name as showcase_name,
             s.name  as shelf_name,
             (sc.code || '-' || s.code || '-' || ss.code) as full_code
      FROM shelf_sections ss
      LEFT JOIN shelves s   ON ss.shelf_id    = s.id
      LEFT JOIN showcases sc ON s.showcase_id = sc.id
      WHERE ss.id = ?
    `, [id]);

    if (!sectionInfo) {
      return res.status(404).json({ error: 'Sektion nicht gefunden' });
    }

    const minerals = await database.query(`
      SELECT m.*,
             ss.code as section_code,
             (sc.code || '-' || s.code || '-' || ss.code) as full_location_code
      FROM minerals m
      LEFT JOIN shelf_sections ss ON m.section_id = ss.id
      LEFT JOIN shelves s         ON m.shelf_id   = s.id
      LEFT JOIN showcases sc      ON s.showcase_id = sc.id
      WHERE m.section_id = ?
      ORDER BY m.name
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    const totalResult = await database.get(
      `SELECT COUNT(*) as total FROM minerals WHERE section_id = ?`,
      [id]
    );

    return res.status(200).json({
      sectionInfo,
      minerals,
      pagination: {
        page,
        limit,
        total: totalResult.total,
        hasMore: offset + minerals.length < totalResult.total,
      },
    });
  } catch (error) {
    console.error('Fehler beim Laden der Sektions-Mineralien:', error);
    return res.status(500).json({ error: 'Fehler beim Laden der Sektions-Mineralien' });
  }
}