import { NextApiRequest, NextApiResponse } from 'next';
import { serialize, parse } from 'cookie';
import database from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const cookies = parse(req.headers.cookie || '');
      const sessionToken = cookies.admin_session;

      if (sessionToken) {
        await database.run(
          'DELETE FROM admin_sessions WHERE token = ?',
          [sessionToken]
        );
      }

      const cookie = serialize('admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      });

      res.setHeader('Set-Cookie', cookie);
      res.status(200).json({ message: 'Erfolgreich abgemeldet' });
    } catch (error) {
      console.error('Logout-Fehler:', error);
      res.status(500).json({ error: 'Server-Fehler beim Logout' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}