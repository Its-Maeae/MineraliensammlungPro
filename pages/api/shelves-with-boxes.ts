// pages/api/shelves-with-boxes.ts
import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Hole alle Regale (showcase_id IS NULL bedeutet es ist ein Hauptregal)
      const shelves = await database.query(`
        SELECT s.*
        FROM shelves s
        WHERE s.showcase_id IS NULL
        ORDER BY s.position_order, s.name
      `);

      // Für jedes Regal hole die Boxen
      const shelvesWithBoxes = await Promise.all(
        shelves.map(async (shelf: any) => {
          const boxes = await database.query(`
            SELECT 
              sb.id,
              sb.name,
              sb.code,
              sb.description,
              sb.position_order,
              sb.image_path,
              (s.code || '-' || sb.code) as full_code,
              COUNT(m.id) as mineral_count
            FROM shelves sb
            LEFT JOIN shelves s ON sb.showcase_id = s.id
            LEFT JOIN minerals m ON sb.id = m.shelf_id
            WHERE sb.showcase_id = ?
            GROUP BY sb.id
            ORDER BY sb.position_order, sb.name
          `, [shelf.id]);

          return {
            ...shelf,
            boxes: boxes || []
          };
        })
      );

      res.status(200).json(shelvesWithBoxes);
    } catch (error) {
      console.error('Fehler beim Laden der Regale mit Boxen:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Regale mit Boxen' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}