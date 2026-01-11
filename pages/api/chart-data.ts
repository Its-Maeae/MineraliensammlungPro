import type { NextApiRequest, NextApiResponse } from 'next';
import database from '../../lib/database';

interface ChartDataItem {
  label: string;
  count: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChartDataItem[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.query;

  console.log('Chart-Data API aufgerufen mit Typ:', type);

  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Type ist erforderlich' });
  }

  try {
    let data: ChartDataItem[] = [];

    switch (type) {
      case 'color':
        console.log('Lade Farben-Statistik...');
        const colors = await database.query(
          `SELECT color, COUNT(*) as count 
           FROM minerals 
           WHERE color IS NOT NULL AND color != '' AND color != '-'
           GROUP BY color 
           ORDER BY count DESC 
           LIMIT 7`
        );
        console.log('Farben gefunden:', colors.length);
        data = colors.map((row: any) => ({
          label: row.color,
          count: parseInt(row.count)
        }));
        break;

      case 'rock_type':
        console.log('Lade Gesteinsarten-Statistik...');
        const rockTypes = await database.query(
          `SELECT rock_type, COUNT(*) as count 
           FROM minerals 
           WHERE rock_type IS NOT NULL AND rock_type != '' AND rock_type != '-'
           GROUP BY rock_type 
           ORDER BY count DESC 
           LIMIT 7`
        );
        console.log('Gesteinsarten gefunden:', rockTypes.length);
        data = rockTypes.map((row: any) => ({
          label: row.rock_type,
          count: parseInt(row.count)
        }));
        break;

      case 'location':
        console.log('Lade Fundorte-Statistik...');
        const locations = await database.query(
          `SELECT location FROM minerals 
           WHERE location IS NOT NULL AND location != '' AND location != '-'`
        );
        console.log('Fundorte gefunden:', locations.length);
        
        // Gruppierung nach Land (letzter Teil nach Komma)
        const locationMap = new Map<string, number>();
        
        locations.forEach((row: any) => {
          const location = row.location;
          // Extrahiere das Land (letzter Teil)
          const parts = location.split(',').map((p: string) => p.trim());
          const country = parts[parts.length - 1];
          
          // Filter "-" auch nach der Extraktion
          if (country !== '-') {
            locationMap.set(country, (locationMap.get(country) || 0) + 1);
          }
        });
        
        // Sortiere und limitiere auf Top 7
        data = Array.from(locationMap.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 7);
        
        console.log('Länder gruppiert:', data.length);
        break;

      case 'name':
        console.log('Lade Mineralien-Namen-Statistik...');
        const names = await database.query(
          `SELECT name FROM minerals 
           WHERE name IS NOT NULL AND name != '' AND name != '-'`
        );
        console.log('Namen gefunden:', names.length);
        
        // Gruppierung nach Basis-Namen
        const nameMap = new Map<string, number>();
        
        names.forEach((row: any) => {
          const name = row.name;
          // Extrahiere Basis-Namen (erster Teil vor Leerzeichen oder Bindestrich)
          const baseName = name.split(/[\s\-]/)[0];
          
          // Filter "-" auch nach der Extraktion
          if (baseName !== '-') {
            nameMap.set(baseName, (nameMap.get(baseName) || 0) + 1);
          }
        });
        
        // Sortiere und limitiere auf Top 7
        data = Array.from(nameMap.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 7);
        
        console.log('Namen gruppiert:', data.length);
        break;

      default:
        return res.status(400).json({ error: 'Ungültiger Typ' });
    }

    console.log('Sende Daten:', data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Fehler beim Laden der Chart-Daten:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Chart-Daten' });
  }
}