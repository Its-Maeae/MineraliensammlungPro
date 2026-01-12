import React, { useState, useEffect, useRef } from 'react';

interface PasswordModalProps {
  password: string;
  setPassword: (password: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  onClose: () => void;
}

export default function PasswordModal({ 
  password, 
  setPassword, 
  isAuthenticated, 
  setIsAuthenticated, 
  onClose 
}: PasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  
  // Move useEffect to top level of component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (modalOverlayRef.current && target === modalOverlayRef.current) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        onClose();
        setPassword('');
        setRemainingAttempts(null);
      } else if (response.status === 429) {
        // Rate-Limiting
        setErrorMessage(data.error || 'Zu viele Anmeldeversuche');
        setRemainingAttempts(null);
      } else if (response.status === 401) {
        // Falsches Passwort
        setErrorMessage(data.error || 'Ungültiges Passwort');
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
      } else {
        setErrorMessage('Anmeldefehler. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      setErrorMessage('Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={modalOverlayRef} className="modal" style={{ display: 'flex' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>Admin-Zugang</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Admin-Passwort eingeben"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          {errorMessage && (
            <div style={{ 
              color: '#dc3545', 
              marginBottom: '15px', 
              padding: '10px', 
              backgroundColor: '#f8d7da',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {errorMessage}
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <div style={{ marginTop: '5px', fontSize: '12px' }}>
                  Verbleibende Versuche: {remainingAttempts}
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>

        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>Hinweis:</strong> Nach 5 fehlgeschlagenen Versuchen wird Ihr Zugang für 15 Minuten gesperrt.
        </div>
      </div>
    </div>
  );
}