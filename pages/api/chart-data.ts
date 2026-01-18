import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../lib/database';

interface ChartDataItem {
  label: string;
  count: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Type parameter is required' });
    }

    let chartData: ChartDataItem[] = [];

    switch (type) {
      case 'name':
        // Top Mineralien nach Häufigkeit
        const nameData = await database.query(`
          SELECT name as label, COUNT(*) as count
          FROM minerals
          WHERE name IS NOT NULL AND name != ''
          GROUP BY name
          ORDER BY count DESC, name ASC
          LIMIT 20
        `);
        chartData = nameData;
        break;

      case 'rock_type':
        // Top Gesteinsarten
        const rockTypeData = await database.query(`
          SELECT rock_type as label, COUNT(*) as count
          FROM minerals
          WHERE rock_type IS NOT NULL AND rock_type != ''
          GROUP BY rock_type
          ORDER BY count DESC, rock_type ASC
          LIMIT 20
        `);
        chartData = rockTypeData;
        break;

      case 'color':
        // Top Farben
        const colorData = await database.query(`
          SELECT color as label, COUNT(*) as count
          FROM minerals
          WHERE color IS NOT NULL AND color != ''
          GROUP BY color
          ORDER BY count DESC, color ASC
          LIMIT 20
        `);
        chartData = colorData;
        break;

      case 'location':
        // Top Fundorte
        const locationData = await database.query(`
          SELECT location as label, COUNT(*) as count
          FROM minerals
          WHERE location IS NOT NULL AND location != ''
          GROUP BY location
          ORDER BY count DESC, location ASC
          LIMIT 20
        `);
        chartData = locationData;
        break;

      default:
        return res.status(400).json({ error: 'Invalid type parameter' });
    }

    // Sicherstellen, dass alle Werte numerisch sind
    chartData = chartData.map(item => ({
      label: String(item.label || 'Unbekannt'),
      count: Number(item.count) || 0
    }));

    res.status(200).json(chartData);
  } catch (error) {
    console.error('Fehler beim Laden der Chart-Daten:', error);
    res.status(500).json({ 
      error: 'Fehler beim Laden der Chart-Daten',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
}