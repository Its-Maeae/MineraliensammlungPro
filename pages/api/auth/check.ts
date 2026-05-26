import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import database from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    console.log('=== AUTH CHECK STARTED ===');
    console.log('📋 Headers:', {
      cookie: req.headers.cookie ? 'vorhanden' : 'FEHLT',
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer
    });

    try {
      const cookies = parse(req.headers.cookie || '');
      console.log('🍪 Alle Cookies:', Object.keys(cookies));
      
      const sessionToken = cookies.admin_session;

      if (!sessionToken) {
        console.log('❌ Kein Session-Token im Cookie gefunden');
        return res.status(401).json({ 
          error: 'Nicht authentifiziert',
          debug: {
            cookieFound: false,
            availableCookies: Object.keys(cookies)
          }
        });
      }

      console.log('🔑 Session Token gefunden (erste 10 Zeichen):', sessionToken.substring(0, 10) + '...');

      const allSessions = await database.query('SELECT token, user_id, expires_at, ip_address FROM admin_sessions');
      console.log('📊 Alle Sessions in DB:', allSessions.length);
      allSessions.forEach((s, i) => {
        console.log(`  Session ${i + 1}: Token=${s.token.substring(0, 10)}..., User=${s.user_id}, Expires=${new Date(s.expires_at).toISOString()}`);
      });

      const session = await database.get(
        'SELECT * FROM admin_sessions WHERE token = ?',
        [sessionToken]
      );

      if (!session) {
        console.log('❌ Session nicht in Datenbank gefunden');
        console.log('🔍 Gesuchter Token:', sessionToken.substring(0, 20) + '...');
        return res.status(401).json({ 
          error: 'Ungültige Session',
          debug: {
            sessionFound: false,
            totalSessions: allSessions.length
          }
        });
      }

      console.log('✅ Session gefunden:', {
        userId: session.user_id,
        expiresAt: new Date(session.expires_at).toISOString(),
        ipAddress: session.ip_address
      });

      const now = Date.now();
      console.log('⏰ Jetzt:', new Date(now).toISOString());
      console.log('⏰ Läuft ab:', new Date(session.expires_at).toISOString());
      console.log('⏰ Ist abgelaufen?', session.expires_at < now);

      if (session.expires_at < now) {
        console.log('❌ Session ist abgelaufen');
        await database.run(
          'DELETE FROM admin_sessions WHERE token = ?',
          [sessionToken]
        );
        return res.status(401).json({ 
          error: 'Session abgelaufen',
          debug: {
            expired: true,
            expiresAt: new Date(session.expires_at).toISOString()
          }
        });
      }
      
      await database.run(
        'UPDATE admin_sessions SET last_activity = ? WHERE token = ?',
        [now, sessionToken]
      );

      console.log('✅ Session ist gültig');
      console.log('=== AUTH CHECK SUCCESSFUL ===');

      res.status(200).json({ 
        message: 'Authentifiziert',
        expiresAt: session.expires_at,
        debug: {
          sessionValid: true,
          userId: session.user_id
        }
      });
    } catch (error) {
      console.error('💥 Authentifizierungsfehler:', error);
      res.status(401).json({ 
        error: 'Nicht authentifiziert',
        debug: {
          exception: error instanceof Error ? error.message : 'Unbekannter Fehler'
        }
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}