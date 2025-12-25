-- Tabelle für Admin-Sessions erstellen
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    last_activity INTEGER,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Index für schnelle Token-Lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token);

-- Index für Cleanup abgelaufener Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);

-- Optional: Tabelle für Login-Versuche (für besseres Rate-Limiting)
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    success INTEGER NOT NULL DEFAULT 0,
    attempted_at INTEGER DEFAULT (strftime('%s','now') * 1000)
);

-- Index für IP-basiertes Rate-Limiting
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, attempted_at);