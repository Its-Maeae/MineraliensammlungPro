import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (req.method === 'POST' || req.method === 'GET') {
    try {
      const now = Date.now();

      const sessionsResult = await database.run(
        'DELETE FROM admin_sessions WHERE expires_at < ?',
        [now]
      );

      const attemptsResult = await database.run(
        'DELETE FROM login_attempts WHERE attempted_at < ?',
        [now - (24 * 60 * 60 * 1000)]
      );

      const inactiveResult = await database.run(
        'DELETE FROM admin_sessions WHERE last_activity < ?',
        [now - (30 * 24 * 60 * 60 * 1000)]
      );

      res.status(200).json({ 
        message: 'Cleanup erfolgreich',
        deletedSessions: sessionsResult.changes || 0,
        deletedAttempts: attemptsResult.changes || 0,
        deletedInactive: inactiveResult.changes || 0
      });
    } catch (error) {
      console.error('Cleanup-Fehler:', error);
      res.status(500).json({ error: 'Fehler beim Aufräumen' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}