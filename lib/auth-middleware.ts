import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import database from './database';

export interface AuthenticatedRequest extends NextApiRequest {
  userId?: number;
  sessionToken?: string;
}

export async function requireAuth(
  req: NextApiRequest,  // Ändere hier von AuthenticatedRequest zu NextApiRequest
  res: NextApiResponse,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  try {
    console.log('🔐 Auth-Middleware gestartet');
    console.log('📋 Headers:', req.headers.cookie ? 'Cookie vorhanden' : 'Kein Cookie');
    
    const cookies = parse(req.headers.cookie || '');
    const sessionToken = cookies.admin_session;

    console.log('🍪 Session Token:', sessionToken ? 'Vorhanden' : 'Fehlt');

    if (!sessionToken) {
      console.log('❌ Kein Session Token gefunden');
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Session validieren
    console.log('🔍 Suche Session in Datenbank...');
    console.log('🔑 Token (erste 10 Zeichen):', sessionToken.substring(0, 10) + '...');
    
    // Prüfe alle Sessions in der Datenbank
    const allSessions = await database.query('SELECT token, user_id, expires_at FROM admin_sessions');
    console.log('📋 Alle Sessions in DB:', allSessions.length);
    allSessions.forEach((s, i) => {
      console.log(`  Session ${i + 1}: Token=${s.token.substring(0, 10)}..., expires=${new Date(s.expires_at)}`);
    });
    
    const session = await database.get(
      'SELECT * FROM admin_sessions WHERE token = ?',
      [sessionToken]
    );

    console.log('📊 Session gefunden:', session ? 'Ja' : 'Nein');
    
    if (!session) {
      console.log('❌ Session nicht in Datenbank gefunden');
      return res.status(401).json({ error: 'Ungültige Session' });
    }

    console.log('⏰ Session expires_at:', new Date(session.expires_at));
    console.log('⏰ Aktuell:', new Date(Date.now()));
    console.log('⏰ Ist abgelaufen?', session.expires_at < Date.now());

    if (session.expires_at < Date.now()) {
      console.log('❌ Session ist abgelaufen');
      await database.run('DELETE FROM admin_sessions WHERE token = ?', [sessionToken]);
      return res.status(401).json({ error: 'Session abgelaufen' });
    }

    // Benutzer-ID an Request anhängen
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.userId = session.user_id;
    authenticatedReq.sessionToken = sessionToken;

    console.log('✅ Authentifizierung erfolgreich, User ID:', session.user_id);

    // Aktivität aktualisieren
    await database.run(
      'UPDATE admin_sessions SET last_activity = ? WHERE token = ?',
      [Date.now(), sessionToken]
    );

    console.log('🔄 Session-Aktivität aktualisiert');

    // Handler ausführen
    console.log('▶️ Handler wird ausgeführt...');
    await handler(authenticatedReq, res);
    
  } catch (error) {
    console.error('💥 Auth-Middleware-Fehler:', error);
    res.status(500).json({ 
      error: 'Server-Fehler bei der Authentifizierung',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
}