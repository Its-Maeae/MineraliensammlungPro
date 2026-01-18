import { useState, useEffect } from 'react';
import './SecurityDashboard.css';

interface SecurityStats {
  failed_logins_24h: number;
  successful_logins_24h: number;
  active_sessions: number;
  unique_failed_ips: number;
  blocked_ips: number;
}

interface LoginAttempt {
  ip: string;
  attempts: number;
  lastAttempt: string;
}

interface ActiveSession {
  token: string;
  ip: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface BlockedIP {
  ip: string;
  blockedAt: string;
  reason: string;
}

interface SecurityLog {
  stats: SecurityStats;
  failedLogins: LoginAttempt[];
  activeSessions: ActiveSession[];
  blockedIPs: BlockedIP[];
}

interface SecurityDashboardProps {
  showPage?: (page: string) => void;
}

export default function SecurityDashboard({ showPage }: SecurityDashboardProps) {
  const [securityLog, setSecurityLog] = useState<SecurityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const terminateSession = async (token: string) => {
    if (!confirm('Möchten Sie diese Session wirklich beenden?')) return;
    
    setActionLoading(token);
    try {
      const response = await fetch('/api/auth/terminate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        await loadSecurityLog();
      } else {
        alert('Fehler beim Beenden der Session');
      }
    } catch (err) {
      alert('Netzwerkfehler');
    } finally {
      setActionLoading(null);
    }
  };

  const blockIP = async (ip: string, reason: string = 'Verdächtige Aktivität') => {
    if (!confirm(`Möchten Sie die IP-Adresse ${ip} wirklich blockieren?`)) return;
    
    setActionLoading(ip);
    try {
      const response = await fetch('/api/auth/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, reason })
      });

      if (response.ok) {
        await loadSecurityLog();
      } else {
        alert('Fehler beim Blockieren der IP-Adresse');
      }
    } catch (err) {
      alert('Netzwerkfehler');
    } finally {
      setActionLoading(null);
    }
  };

  const unblockIP = async (ip: string) => {
    if (!confirm(`Möchten Sie die Blockierung für ${ip} wirklich aufheben?`)) return;
    
    setActionLoading(ip);
    try {
      const response = await fetch('/api/auth/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });

      if (response.ok) {
        await loadSecurityLog();
      } else {
        alert('Fehler beim Aufheben der Blockierung');
      }
    } catch (err) {
      alert('Netzwerkfehler');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <section className="page active">
        <div className="container">
          <div className="loading">Lädt Security-Logs...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page active">
        <div className="container">
          <div style={{ 
            color: '#ef4444', 
            padding: '20px', 
            textAlign: 'center',
            background: '#fef2f2',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            {error}
          </div>
        </div>
      </section>
    );
  }

  if (!securityLog) return null;

  return (
    <section className="page active">
      <div className="container security-dashboard">
        <div className="page-header">
          <h1 className="page-title">Security Dashboard</h1>
          <p className="page-description">Überwachung und Verwaltung der Systemsicherheit</p>
        </div>
        
        {/* Statistiken Grid */}
        <div className="stats-grid">
          <div className="stat-card variant-danger">
            <span className="stat-number">{securityLog.stats.failed_logins_24h}</span>
            <span className="stat-label">Fehlgeschlagene Logins (24h)</span>
          </div>
          
          <div className="stat-card variant-success">
            <span className="stat-number">{securityLog.stats.successful_logins_24h}</span>
            <span className="stat-label">Erfolgreiche Logins (24h)</span>
          </div>
          
          <div className="stat-card variant-info">
            <span className="stat-number">{securityLog.stats.active_sessions}</span>
            <span className="stat-label">Aktive Sessions</span>
          </div>
          
          <div className="stat-card variant-warning">
            <span className="stat-number">{securityLog.stats.blocked_ips}</span>
            <span className="stat-label">Blockierte IP-Adressen</span>
          </div>
        </div>

        {/* Blockierte IP-Adressen */}
        {securityLog.blockedIPs && securityLog.blockedIPs.length > 0 && (
          <div className="security-section">
            <h2 className="security-section-title">
              Blockierte IP-Adressen
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="security-table">
                <thead>
                  <tr>
                    <th>IP-Adresse</th>
                    <th>Grund</th>
                    <th>Blockiert seit</th>
                    <th className="center">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLog.blockedIPs.map((blocked, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="ip-address">{blocked.ip}</span>
                      </td>
                      <td>{blocked.reason}</td>
                      <td>{new Date(blocked.blockedAt).toLocaleString('de-DE')}</td>
                      <td className="center">
                        <button
                          onClick={() => unblockIP(blocked.ip)}
                          disabled={actionLoading === blocked.ip}
                          className="btn btn-primary"
                          style={{ 
                            padding: '6px 12px',
                            fontSize: '13px',
                            background: '#10b981',
                            border: 'none'
                          }}
                        >
                          {actionLoading === blocked.ip ? 'Lädt...' : 'Freigeben'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aktive Sessions */}
        <div className="security-section">
          <h2 className="security-section-title">
            Aktive Sessions
          </h2>
          {securityLog.activeSessions.length === 0 ? (
            <p className="security-empty-state neutral">
              Keine aktiven Sessions
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="security-table">
                <thead>
                  <tr>
                    <th>IP-Adresse</th>
                    <th>Erstellt</th>
                    <th>Letzte Aktivität</th>
                    <th>Läuft ab</th>
                    <th className="center">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLog.activeSessions.map((session, idx) => (
                    <tr 
                      key={idx} 
                      className={session.isCurrent ? 'current-session' : ''}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="ip-address">{session.ip}</span>
                          {session.isCurrent && (
                            <span className="session-badge">Aktuelle Session</span>
                          )}
                        </div>
                      </td>
                      <td>{new Date(session.createdAt).toLocaleString('de-DE')}</td>
                      <td>{new Date(session.lastActivity).toLocaleString('de-DE')}</td>
                      <td>{new Date(session.expiresAt).toLocaleString('de-DE')}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => terminateSession(session.token)}
                            disabled={session.isCurrent || actionLoading === session.token}
                            className="btn btn-secondary"
                            style={{ 
                              padding: '6px 12px',
                              fontSize: '13px',
                              background: session.isCurrent ? '#cbd5e1' : '#ef4444',
                              color: 'white',
                              border: 'none',
                              cursor: session.isCurrent ? 'not-allowed' : 'pointer'
                            }}
                            title={session.isCurrent ? 'Eigene Session kann nicht beendet werden' : 'Session beenden'}
                          >
                            {actionLoading === session.token ? 'Lädt...' : 'Beenden'}
                          </button>
                          <button
                            onClick={() => blockIP(session.ip, 'Manuell blockiert vom Admin')}
                            disabled={session.isCurrent || actionLoading === session.ip}
                            className="btn btn-secondary"
                            style={{ 
                              padding: '6px 12px',
                              fontSize: '13px',
                              background: session.isCurrent ? '#cbd5e1' : '#f59e0b',
                              color: 'white',
                              border: 'none',
                              cursor: session.isCurrent ? 'not-allowed' : 'pointer'
                            }}
                            title={session.isCurrent ? 'Eigene IP kann nicht blockiert werden' : 'IP blockieren'}
                          >
                            {actionLoading === session.ip ? 'Lädt...' : 'IP blockieren'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fehlgeschlagene Login-Versuche */}
        <div className="security-section">
          <h2 className="security-section-title">
            Fehlgeschlagene Login-Versuche (7 Tage)
          </h2>
          {securityLog.failedLogins.length === 0 ? (
            <p className="security-empty-state">
              Keine fehlgeschlagenen Login-Versuche in den letzten 7 Tagen
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="security-table">
                <thead>
                  <tr>
                    <th>IP-Adresse</th>
                    <th>Versuche</th>
                    <th>Letzter Versuch</th>
                    <th className="center">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLog.failedLogins.map((attempt, idx) => (
                    <tr 
                      key={idx} 
                      className={attempt.attempts >= 5 ? 'danger-row' : ''}
                    >
                      <td>
                        <span className="ip-address">{attempt.ip}</span>
                      </td>
                      <td>
                        <span className={attempt.attempts >= 5 ? 'attempt-count high' : 'attempt-count'}>
                          {attempt.attempts}
                          {attempt.attempts >= 5 && <span>⚠</span>}
                        </span>
                      </td>
                      <td>{new Date(attempt.lastAttempt).toLocaleString('de-DE')}</td>
                      <td className="center">
                        {attempt.attempts >= 3 && (
                          <button
                            onClick={() => blockIP(attempt.ip, `${attempt.attempts} fehlgeschlagene Login-Versuche`)}
                            disabled={actionLoading === attempt.ip}
                            className="btn btn-secondary"
                            style={{ 
                              padding: '6px 12px',
                              fontSize: '13px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            {actionLoading === attempt.ip ? 'Lädt...' : 'IP blockieren'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Zurück und Aktualisieren Buttons */}
        <div className="security-actions">
          <button 
            onClick={() => showPage && showPage('admin')}
            className="btn btn-secondary btn-large"
          >
            Zurück
          </button>
          
          <button 
            onClick={() => {
              setLoading(true);
              loadSecurityLog();
            }}
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? 'Lädt...' : 'Aktualisieren'}
          </button>
        </div>
      </div>
    </section>
  );
}