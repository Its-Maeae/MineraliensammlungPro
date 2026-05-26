import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { serialize } from 'cookie';
import crypto from 'crypto';
import database from '../../../lib/database';

const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; 

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.socket.remoteAddress || 'unknown';
  return ip;
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts?: number; waitTime?: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (!attempts || now > attempts.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + LOCKOUT_DURATION });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    const waitTime = Math.ceil((attempts.resetTime - now) / 1000);
    return { allowed: false, waitTime };
  }

  attempts.count++;
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - attempts.count };
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function logLoginAttempt(ip: string, success: boolean) {
  try {
    await database.run(
      'INSERT INTO login_attempts (ip_address, success, attempted_at) VALUES (?, ?, ?)',
      [ip, success ? 1 : 0, Date.now()]
    );
  } catch (error) {
    console.error('Fehler beim Protokollieren des Login-Versuchs:', error);
  }
}

async function isIPBlocked(ip: string): Promise<boolean> {
  try {
    await database.run(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL UNIQUE,
        blocked_at INTEGER NOT NULL,
        reason TEXT DEFAULT 'Verdächtige Aktivität'
      )
    `);
    
    const blocked = await database.get(
      'SELECT * FROM blocked_ips WHERE ip_address = ?',
      [ip]
    );
    return !!blocked;
  } catch (error) {
    console.error('Fehler beim Prüfen der IP-Blockierung:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const clientIP = getClientIP(req);
    console.log('🔐 Login-Versuch von IP:', clientIP);

    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Passwort erforderlich' });
      }

      const blocked = await isIPBlocked(clientIP);
      if (blocked) {
        console.log('🚫 Blockierte IP versucht Login:', clientIP);
        await logLoginAttempt(clientIP, false);
        return res.status(403).json({ 
          error: 'Ihre IP-Adresse wurde blockiert. Bitte kontaktieren Sie den Administrator.',
          blocked: true
        });
      }

      const rateLimitCheck = checkRateLimit(clientIP);
      if (!rateLimitCheck.allowed) {
        await logLoginAttempt(clientIP, false);
        return res.status(429).json({ 
          error: `Zu viele Anmeldeversuche. Bitte warten Sie ${rateLimitCheck.waitTime} Sekunden.`,
          retryAfter: rateLimitCheck.waitTime
        });
      }

      const adminUser = await database.get('SELECT * FROM admin_users WHERE id = 1');

      if (!adminUser) {
        console.error('❌ Admin-Benutzer nicht gefunden');
        return res.status(500).json({ error: 'Admin-Benutzer nicht gefunden' });
      }

      const isValid = await bcrypt.compare(password, adminUser.password_hash);

      if (!isValid) {
        console.log('❌ Ungültiges Passwort');
        await logLoginAttempt(clientIP, false);
        return res.status(401).json({ 
          error: 'Ungültiges Passwort',
          remainingAttempts: rateLimitCheck.remainingAttempts
        });
      }

      loginAttempts.delete(clientIP);
      await logLoginAttempt(clientIP, true);

      const sessionToken = generateSecureToken();
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); 

      console.log('✅ Login erfolgreich, erstelle Session...');
      console.log('🔑 Token (erste 10 Zeichen):', sessionToken.substring(0, 10) + '...');
      console.log('⏰ Läuft ab:', new Date(expiresAt).toISOString());

      const insertResult = await database.run(
        'INSERT INTO admin_sessions (token, user_id, expires_at, ip_address, last_activity, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [sessionToken, adminUser.id, expiresAt, clientIP, Date.now(), Date.now()]
      );

      console.log('💾 Session in DB gespeichert, ID:', insertResult.id);

      const isProduction = process.env.NODE_ENV === 'production';
      const cookie = serialize('admin_session', sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60,
        path: '/'
      });

      console.log('🍪 Cookie gesetzt');

      res.setHeader('Set-Cookie', cookie);
      res.status(200).json({ 
        message: 'Erfolgreich angemeldet',
        expiresAt,
        debug: {
          cookieSet: true,
          sessionId: insertResult.id,
          isProduction
        }
      });
    } catch (error) {
      console.error('💥 Login-Fehler:', error);
      res.status(500).json({ 
        error: 'Server-Fehler beim Login',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}