import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
    try {
      // Fehlgeschlagene Login-Versuche der letzten 7 Tage
      const failedLogins = await database.query(`
        SELECT ip_address, 
               COUNT(*) as attempts,
               MAX(attempted_at) as last_attempt
        FROM login_attempts 
        WHERE success = 0 
          AND attempted_at > ?
        GROUP BY ip_address
        ORDER BY attempts DESC, last_attempt DESC
        LIMIT 50
      `, [Date.now() - (7 * 24 * 60 * 60 * 1000)]);

      // Erfolgreiche Logins der letzten 7 Tage
      const successfulLogins = await database.query(`
        SELECT ip_address, attempted_at
        FROM login_attempts 
        WHERE success = 1 
          AND attempted_at > ?
        ORDER BY attempted_at DESC
        LIMIT 50
      `, [Date.now() - (7 * 24 * 60 * 60 * 1000)]);

      // Aktive Sessions
      const activeSessions = await database.query(`
        SELECT token, user_id, ip_address, 
               expires_at, last_activity, created_at
        FROM admin_sessions 
        WHERE expires_at > ?
        ORDER BY last_activity DESC
      `, [Date.now()]);

      // Statistiken
      const stats = {
        total_failed_24h: await database.get(`
          SELECT COUNT(*) as count 
          FROM login_attempts 
          WHERE success = 0 
            AND attempted_at > ?
        `, [Date.now() - (24 * 60 * 60 * 1000)]),
        
        total_successful_24h: await database.get(`
          SELECT COUNT(*) as count 
          FROM login_attempts 
          WHERE success = 1 
            AND attempted_at > ?
        `, [Date.now() - (24 * 60 * 60 * 1000)]),
        
        active_sessions: activeSessions.length,
        
        unique_ips_failed: await database.get(`
          SELECT COUNT(DISTINCT ip_address) as count 
          FROM login_attempts 
          WHERE success = 0 
            AND attempted_at > ?
        `, [Date.now() - (24 * 60 * 60 * 1000)])
      };

      res.status(200).json({
        stats: {
          failed_logins_24h: stats.total_failed_24h.count,
          successful_logins_24h: stats.total_successful_24h.count,
          active_sessions: stats.active_sessions,
          unique_failed_ips: stats.unique_ips_failed.count
        },
        failedLogins: failedLogins.map(row => ({
          ip: row.ip_address,
          attempts: row.attempts,
          lastAttempt: new Date(row.last_attempt).toISOString()
        })),
        successfulLogins: successfulLogins.map(row => ({
          ip: row.ip_address,
          timestamp: new Date(row.attempted_at).toISOString()
        })),
        activeSessions: activeSessions.map(row => ({
          ip: row.ip_address,
          createdAt: new Date(row.created_at).toISOString(),
          lastActivity: new Date(row.last_activity || row.created_at).toISOString(),
          expiresAt: new Date(row.expires_at).toISOString()
        }))
      });
    } catch (error) {
      console.error('Fehler beim Laden der Security-Logs:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Security-Logs' });
    }
  });
}