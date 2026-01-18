import { useState, useEffect } from 'react';

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
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="page-header">
          <h1 className="page-title">Security Dashboard</h1>
          <p className="page-description">Überwachung und Verwaltung der Systemsicherheit</p>
        </div>
        
        {/* Statistiken Grid */}
        <div className="stats-grid" style={{ marginBottom: '40px' }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <span className="stat-number">{securityLog.stats.failed_logins_24h}</span>
            <span className="stat-label">Fehlgeschlagene Logins (24h)</span>
          </div>
          
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <span className="stat-number">{securityLog.stats.successful_logins_24h}</span>
            <span className="stat-label">Erfolgreiche Logins (24h)</span>
          </div>
          
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <span className="stat-number">{securityLog.stats.active_sessions}</span>
            <span className="stat-label">Aktive Sessions</span>
          </div>
          
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <span className="stat-number">{securityLog.stats.blocked_ips}</span>
            <span className="stat-label">Blockierte IP-Adressen</span>
          </div>
        </div>

        {/* Blockierte IP-Adressen */}
        {securityLog.blockedIPs && securityLog.blockedIPs.length > 0 && (
          <div className="admin-form-container" style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Blockierte IP-Adressen
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>IP-Adresse</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Grund</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Blockiert seit</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLog.blockedIPs.map((blocked, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: '500' }}>
                        {blocked.ip}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {blocked.reason}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {new Date(blocked.blockedAt).toLocaleString('de-DE')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
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
        <div className="admin-form-container" style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👥 Aktive Sessions
          </h2>
          {securityLog.activeSessions.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
              Keine aktiven Sessions
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>IP-Adresse</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Erstellt</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Letzte Aktivität</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Läuft ab</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLog.activeSessions.map((session, idx) => (
                    <tr 
                      key={idx} 
                      style={{ 
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: session.isCurrent ? '#f0f9ff' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                            {session.ip}
                          </span>
                          {session.isCurrent && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: '#3b82f6',
                              color: 'white',
                              borderRadius: '12px',
                              fontWeight: '600'
                            }}>
                              Aktuelle Session
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {new Date(session.createdAt).toLocaleString('de-DE')}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {new Date(session.lastActivity).toLocaleString('de-DE')}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {new Date(session.expiresAt).toLocaleString('de-DE')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
        <div className="admin-form-container" style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Fehlgeschlagene Login-Versuche (7 Tage)
          </h2>
          {securityLog.failedLogins.length === 0 ? (
            <p style={{ 
              color: '#10b981', 
              textAlign: 'center',
              padding: '20px',
              background: '#f0fdf4',
              borderRadius: '8px',
              fontWeight: '500'
            }}>
              Keine fehlgeschlagenen Login-Versuche in den letzten 7 Tagen
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>IP-Adresse</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Versuche</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Letzter Versuch</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLog.failedLogins.map((attempt, idx) => (
                    <tr 
                      key={idx} 
                      style={{ 
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: attempt.attempts >= 5 ? '#fef2f2' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: '500' }}>
                        {attempt.ip}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          color: attempt.attempts >= 5 ? '#ef4444' : '#64748b',
                          fontWeight: attempt.attempts >= 5 ? '600' : 'normal',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {attempt.attempts}
                          {attempt.attempts >= 5 && <span>⚠️</span>}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {new Date(attempt.lastAttempt).toLocaleString('de-DE')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
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
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '40px' }}>
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
            {loading ? 'Lädt...' : '🔄 Aktualisieren'}
          </button>
        </div>
      </div>
    </section>
  );
}