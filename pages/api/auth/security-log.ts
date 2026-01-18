import { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req, res, async (req: AuthenticatedRequest, res) => {
    try {
      // Erstelle blocked_ips Tabelle falls nicht vorhanden
      try {
        await database.run(`
          CREATE TABLE IF NOT EXISTS blocked_ips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT NOT NULL UNIQUE,
            blocked_at INTEGER NOT NULL,
            reason TEXT DEFAULT 'Verdächtige Aktivität'
          )
        `);
      } catch (createErr) {
        console.log('Hinweis: blocked_ips Tabelle bereits vorhanden oder Fehler beim Erstellen');
      }

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

      // Aktive Sessions - Prüfe erst welche Spalten existieren
      let activeSessions = [];
      try {
        // Versuche mit allen Spalten
        activeSessions = await database.query(`
          SELECT token, user_id, ip_address, 
                 expires_at, last_activity, created_at
          FROM admin_sessions 
          WHERE expires_at > ?
          ORDER BY last_activity DESC
        `, [Date.now()]);
      } catch (err) {
        // Fallback ohne created_at
        console.log('Verwende Fallback für Sessions ohne created_at Spalte');
        activeSessions = await database.query(`
          SELECT token, user_id, ip_address, 
                 expires_at, last_activity,
                 (expires_at - 86400000) as created_at
          FROM admin_sessions 
          WHERE expires_at > ?
          ORDER BY last_activity DESC
        `, [Date.now()]);
      }

      // Blockierte IP-Adressen
      let blockedIPs = [];
      try {
        blockedIPs = await database.query(`
          SELECT ip_address, blocked_at, 
                 COALESCE(reason, 'Verdächtige Aktivität') as reason
          FROM blocked_ips
          ORDER BY blocked_at DESC
        `);
      } catch (err) {
        console.log('Keine blockierten IPs oder Tabelle existiert noch nicht');
        blockedIPs = [];
      }

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
        
        blocked_ips_count: blockedIPs.length
      };

      res.status(200).json({
        stats: {
          failed_logins_24h: stats.total_failed_24h?.count || 0,
          successful_logins_24h: stats.total_successful_24h?.count || 0,
          active_sessions: stats.active_sessions,
          unique_failed_ips: failedLogins.length,
          blocked_ips: stats.blocked_ips_count
        },
        failedLogins: failedLogins.map(row => ({
          ip: row.ip_address,
          attempts: row.attempts,
          lastAttempt: new Date(row.last_attempt).toISOString()
        })),
        activeSessions: activeSessions.map(row => ({
          token: row.token,
          ip: row.ip_address,
          createdAt: new Date(row.created_at || (row.expires_at - 86400000)).toISOString(),
          lastActivity: new Date(row.last_activity || row.expires_at).toISOString(),
          expiresAt: new Date(row.expires_at).toISOString(),
          isCurrent: row.token === req.sessionToken
        })),
        blockedIPs: blockedIPs.map(row => ({
          ip: row.ip_address,
          blockedAt: new Date(row.blocked_at).toISOString(),
          reason: row.reason || 'Verdächtige Aktivität'
        }))
      });
    } catch (error) {
      console.error('Fehler beim Laden der Security-Logs:', error);
      res.status(500).json({ 
        error: 'Fehler beim Laden der Security-Logs',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });
}