import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token erforderlich' });
      }

      if (token === req.sessionToken) {
        return res.status(400).json({ error: 'Sie können Ihre eigene Session nicht beenden' });
      }

      const result = await database.run(
        'DELETE FROM admin_sessions WHERE token = ?',
        [token]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Session nicht gefunden' });
      }

      res.status(200).json({ 
        message: 'Session erfolgreich beendet',
        terminated: true
      });
    } catch (error) {
      console.error('Fehler beim Beenden der Session:', error);
      res.status(500).json({ error: 'Fehler beim Beenden der Session' });
    }
  });
}