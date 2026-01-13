// pages/api/boxes/[id]/minerals.ts
import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await database.query(`
        SELECT 
          s.id as box_id,
          s.name as box_name,
          s.code,
          s.image_path as box_image_path,
          s.description as box_description,
          s.position_order,
          sh.name as shelf_name,
          sh.code as shelf_code,
          (sh.code || '-' || s.code) as full_code,
          m.id,
          m.name,
          m.number,
          m.color,
          m.description,
          m.location,
          m.purchase_location,
          m.rock_type,
          m.shelf_id,
          m.image_path,
          m.latitude,
          m.longitude,
          m.created_at
        FROM shelves s
        LEFT JOIN shelves sh ON s.showcase_id = sh.showcase_id AND sh.id != s.id
        LEFT JOIN minerals m ON s.id = m.shelf_id
        WHERE s.id = ?
        ORDER BY m.name
      `, [id]);

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Box nicht gefunden' });
      }

      const boxInfo = {
        id: result[0].box_id,
        name: result[0].box_name,
        box_name: result[0].box_name,
        code: result[0].code,
        image_path: result[0].box_image_path,
        description: result[0].box_description,
        position_order: result[0].position_order,
        shelf_name: result[0].shelf_name,
        shelf_code: result[0].shelf_code,
        full_code: result[0].full_code
      };

      const minerals = result
        .filter((row: any) => row.id !== null)
        .map((row: any) => ({
          id: row.id,
          name: row.name,
          number: row.number,
          color: row.color,
          description: row.description,
          location: row.location,
          purchase_location: row.purchase_location,
          rock_type: row.rock_type,
          shelf_id: row.shelf_id,
          image_path: row.image_path,
          latitude: row.latitude,
          longitude: row.longitude,
          created_at: row.created_at
        }));

      res.status(200).json({
        boxInfo,
        minerals
      });
    } catch (error) {
      console.error('Fehler beim Laden der Box-Mineralien:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Box-Mineralien' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}