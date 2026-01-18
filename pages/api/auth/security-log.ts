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

      // Aktive Sessions
      const activeSessions = await database.query(`
        SELECT token, user_id, ip_address, 
               expires_at, last_activity, created_at
        FROM admin_sessions 
        WHERE expires_at > ?
        ORDER BY last_activity DESC
      `, [Date.now()]);

      // Blockierte IP-Adressen
      const blockedIPs = await database.query(`
        SELECT ip_address, blocked_at, reason
        FROM blocked_ips
        ORDER BY blocked_at DESC
      `);

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
        
        blocked_ips_count: await database.get(`
          SELECT COUNT(*) as count 
          FROM blocked_ips
        `)
      };

      res.status(200).json({
        stats: {
          failed_logins_24h: stats.total_failed_24h.count,
          successful_logins_24h: stats.total_successful_24h.count,
          active_sessions: stats.active_sessions,
          unique_failed_ips: failedLogins.length,
          blocked_ips: stats.blocked_ips_count.count
        },
        failedLogins: failedLogins.map(row => ({
          ip: row.ip_address,
          attempts: row.attempts,
          lastAttempt: new Date(row.last_attempt).toISOString()
        })),
        activeSessions: activeSessions.map(row => ({
          token: row.token,
          ip: row.ip_address,
          createdAt: new Date(row.created_at).toISOString(),
          lastActivity: new Date(row.last_activity || row.created_at).toISOString(),
          expiresAt: new Date(row.expires_at).toISOString(),
          isCurrent: row.token === req.sessionToken
        })),
        blockedIPs: blockedIPs.map(row => ({
          ip: row.ip_address,
          blockedAt: new Date(row.blocked_at).toISOString(),
          reason: row.reason
        }))
      });
    } catch (error) {
      console.error('Fehler beim Laden der Security-Logs:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Security-Logs' });
    }
  });
}