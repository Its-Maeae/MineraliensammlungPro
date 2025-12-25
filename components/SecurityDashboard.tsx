import { useState, useEffect } from 'react';

interface SecurityStats {
  failed_logins_24h: number;
  successful_logins_24h: number;
  active_sessions: number;
  unique_failed_ips: number;
}

interface LoginAttempt {
  ip: string;
  attempts: number;
  lastAttempt: string;
}

interface SecurityLog {
  stats: SecurityStats;
  failedLogins: LoginAttempt[];
  successfulLogins: Array<{ ip: string; timestamp: string }>;
  activeSessions: Array<{
    ip: string;
    createdAt: string;
    lastActivity: string;
    expiresAt: string;
  }>;
}

interface SecurityDashboardProps {
  showPage?: (page: string) => void;
}

export default function SecurityDashboard({ showPage }: SecurityDashboardProps) {
  const [securityLog, setSecurityLog] = useState<SecurityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSecurityLog();
  }, []);

  const loadSecurityLog = async () => {
    try {
      const response = await fetch('/api/auth/security-log');
      if (!response.ok) throw new Error('Fehler beim Laden');
      
      const data = await response.json();
      setSecurityLog(data);
    } catch (err) {
      setError('Fehler beim Laden der Security-Logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="page active">
        <div className="container">
          <div className="loading-spinner">Lädt Security-Logs...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page active">
        <div className="container">
          <div style={{ color: 'red', padding: '20px' }}>{error}</div>
        </div>
      </section>
    );
  }

  if (!securityLog) return null;

  return (
    <section className="page active">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="page-header">
          <h1 className="page-title">🔒 Security Dashboard</h1>
          <p className="page-description">Überwachung von Login-Versuchen und aktiven Sessions</p>
        </div>
        
        {/* Statistiken */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ 
            backgroundColor: '#f8d7da', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Fehlgeschlagene Logins (24h)</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545', margin: 0 }}>
              {securityLog.stats.failed_logins_24h}
            </p>
          </div>
          
          <div style={{ 
            backgroundColor: '#d4edda', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Erfolgreiche Logins (24h)</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745', margin: 0 }}>
              {securityLog.stats.successful_logins_24h}
            </p>
          </div>
          
          <div style={{ 
            backgroundColor: '#d1ecf1', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Aktive Sessions</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0c5460', margin: 0 }}>
              {securityLog.stats.active_sessions}
            </p>
          </div>
          
          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Verdächtige IPs</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#856404', margin: 0 }}>
              {securityLog.stats.unique_failed_ips}
            </p>
          </div>
        </div>

        {/* Fehlgeschlagene Login-Versuche */}
        <div style={{ marginBottom: '30px', backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0 }}>Fehlgeschlagene Login-Versuche (letzte 7 Tage)</h2>
          {securityLog.failedLogins.length === 0 ? (
            <p style={{ color: '#28a745' }}>✓ Keine fehlgeschlagenen Login-Versuche in den letzten 7 Tagen</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>IP-Adresse</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Versuche</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Letzter Versuch</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLog.failedLogins.map((attempt, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace' }}>{attempt.ip}</td>
                      <td style={{ 
                        padding: '10px', 
                        color: attempt.attempts >= 5 ? '#dc3545' : 'inherit',
                        fontWeight: attempt.attempts >= 5 ? 'bold' : 'normal'
                      }}>
                        {attempt.attempts}
                        {attempt.attempts >= 5 && ' ⚠️'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {new Date(attempt.lastAttempt).toLocaleString('de-DE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Aktive Sessions */}
        <div style={{ marginBottom: '30px', backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0 }}>Aktive Sessions</h2>
          {securityLog.activeSessions.length === 0 ? (
            <p>Keine aktiven Sessions</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>IP-Adresse</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Erstellt</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Letzte Aktivität</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Läuft ab</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLog.activeSessions.map((session, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace' }}>{session.ip}</td>
                      <td style={{ padding: '10px' }}>
                        {new Date(session.createdAt).toLocaleString('de-DE')}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {new Date(session.lastActivity).toLocaleString('de-DE')}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {new Date(session.expiresAt).toLocaleString('de-DE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Zurück Button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => {
              if (showPage) {
                showPage('admin');
              }
            }}
            className="btn btn-primary btn-large"
          >
            ← Zurück zum Admin-Bereich
          </button>
          
          <button 
            onClick={() => {
              setLoading(true);
              loadSecurityLog();
            }}
            className="btn btn-secondary btn-large"
          >
            🔄 Aktualisieren
          </button>
        </div>
      </div>
    </section>
  );
}