import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
    try {
      const { ip } = req.body;

      if (!ip) {
        return res.status(400).json({ error: 'IP-Adresse erforderlich' });
      }

      // Blockierung aufheben
      const result = await database.run(
        'DELETE FROM blocked_ips WHERE ip_address = ?',
        [ip]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'IP-Adresse ist nicht blockiert' });
      }

      res.status(200).json({ 
        message: 'Blockierung erfolgreich aufgehoben',
        unblocked: true,
        ip
      });
    } catch (error) {
      console.error('Fehler beim Aufheben der Blockierung:', error);
      res.status(500).json({ error: 'Fehler beim Aufheben der Blockierung' });
    }
  });
}