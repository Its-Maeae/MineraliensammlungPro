import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import database from '../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.socket.remoteAddress || 'unknown';
  return ip;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
    try {
      // Erstelle Tabelle falls nicht vorhanden
      await database.run(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip_address TEXT NOT NULL UNIQUE,
          blocked_at INTEGER NOT NULL,
          reason TEXT DEFAULT 'Verdächtige Aktivität'
        )
      `);

      const { ip, reason } = req.body;

      if (!ip) {
        return res.status(400).json({ error: 'IP-Adresse erforderlich' });
      }

      // Verhindere, dass der Admin seine eigene IP blockiert
      const currentIP = getClientIP(req);
      if (ip === currentIP) {
        return res.status(400).json({ error: 'Sie können Ihre eigene IP-Adresse nicht blockieren' });
      }

      // Prüfe ob IP bereits blockiert ist
      const existing = await database.get(
        'SELECT * FROM blocked_ips WHERE ip_address = ?',
        [ip]
      );

      if (existing) {
        return res.status(400).json({ error: 'IP-Adresse ist bereits blockiert' });
      }

      // IP-Adresse blockieren
      await database.run(
        'INSERT INTO blocked_ips (ip_address, blocked_at, reason) VALUES (?, ?, ?)',
        [ip, Date.now(), reason || 'Manuell blockiert']
      );

      // Alle Sessions dieser IP beenden
      await database.run(
        'DELETE FROM admin_sessions WHERE ip_address = ?',
        [ip]
      );

      res.status(200).json({ 
        message: 'IP-Adresse erfolgreich blockiert',
        blocked: true,
        ip
      });
    } catch (error) {
      console.error('Fehler beim Blockieren der IP:', error);
      res.status(500).json({ error: 'Fehler beim Blockieren der IP-Adresse' });
    }
  });
}