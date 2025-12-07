import React, { useEffect } from 'react';
import { Stats } from '../types';

interface HomePageProps {
  showPage: (page: string) => void;
  stats: Stats;
  lastUpdated: string;
  setLastUpdated: (date: string) => void;
}

export default function HomePage({ showPage, stats, lastUpdated, setLastUpdated }: HomePageProps) {

  const loadLastUpdated = async () => {
    try {
      const response = await fetch('/api/last-updated');
      if (response.ok) {
        const data = await response.json();
        setLastUpdated(data.last_updated);
      }
    } catch (error) {
      console.error('Fehler beim Laden des letzten Update-Datums:', error);
    }
  };

  useEffect(() => {
    loadLastUpdated();
  }, []);

  const showImpressumPage = () => {
    showPage('impressum');
  };

  const showQuellenPage = () => {
    showPage('quellen');
  };

  const showKontaktPage = () => {
    showPage('kontakt');
  };

  return (
    <section className="page active">
      {/* Hero Section */}
      <div className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Faszinierende Welt der
              <span className="hero-highlight"> Mineralien und Gesteine</span>
            </h1>
            <p className="hero-description">
              Dieses Projekt enstand im Rahmen eines Schülerprojekts an der Samuel von Pufendorf Schule in Flöha. Ziel war es, 
              die umfangreiche Mineraliensammlung der Schule zu sortieren und zu organisieren, um die Zugänglichkeit zu verbessern.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => showPage('collection')}>
                Sammlung entdecken
              </button>
              <button className="btn btn-secondary" onClick={() => showPage('vitrines')}>
                Vitrinen erkunden
              </button>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-crystal">💎</div>
            <div className="hero-particles">
              <span className="particle">✨</span>
              <span className="particle">🔬</span>
              <span className="particle">⭐­</span>
              <span className="particle">💫</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.total_minerals}</span>
              <span className="stat-label">Mineralien</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.total_locations}</span>
              <span className="stat-label">Fundorte</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.total_colors}</span>
              <span className="stat-label">Farben</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.total_shelves}</span>
              <span className="stat-label">Regale</span>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="about-title">Über die Sammlung</h2>
              <p className="about-description">
                Diese Sammlung ist Eigentum der Samuel von Pufendorf Schule in Flöha. 
                Sowohl Lehrer als auch andere Personen trugen zu dieser Sammlung bei.
              </p>
              <p className="about-description">
                Über die Jahre hinweg wurde die Sammlung durch zahlreiche Steine erweitert. In 2025 war es das Ziel 
                im Umfang einer Komplexen Leistung diese Sammlung aufzubereiten
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Impressum Section */}
      <div className="impressum-section">
        <div className="container">
          <div className="impressum-content">
            <div className="impressum-main">
              <h2 className="impressum-title">Impressum</h2>
              
              <div className="impressum-grid">
                <div className="impressum-card">
                  <h3>👤 Kontaktperson</h3>
                  <p><strong>Marius Schmieder</strong></p>
                  <p>Schüler der 10c</p>
                  <p>📞</p>
                  <p>✉️ <a href="mailto:marius-schmieder@gymnasium-floeha.lernsax.de">
                    marius-schmieder@gymnasium-floeha.lernsax.de
                  </a></p>
                </div>

                <div className="impressum-card">
                  <h3>👤 Kontaktperson</h3>
                  <p><strong>Charlie Espig</strong></p>
                  <p>Schüler der 10c</p>
                  <p>📞</p>
                  <p>✉️ <a href="mailto:charlie-espig@gymnasium-floeha.lernsax.de">
                    charlie-espig@gymnasium-floeha.lernsax.de
                  </a></p>
                </div>

                <div className="impressum-card">
                  <h3>👤 Kontaktperson</h3>
                  <p><strong>Manuela Barthel</strong></p>
                  <p>Leherin Bereich Geografie</p>
                  <p>📞</p>
                  <p>✉️ <a href="mailto:manuela-bathel@gymnasium-floeha.lernsax.de">
                    manuela-barthel@gymnasium-floeha.lernsax.de
                  </a></p>
                </div>

                <div className="impressum-card">
                  <h3>Bildungseinrichtung</h3>
                  <p><strong>Samuel von Pufendorf Gymnasium Flöha</strong></p>
                  <p>Turnerstraße 16</p>
                  <p>09557 Flöha, Deutschland</p>
                  <p>🌐 <a href="https://gymnasium-floeha.de" target="_blank" rel="noopener noreferrer">
                      gymnasium-floeha.de
                    </a>
                  </p>
                </div>
                
                <div className="impressum-card">
                  <h3>👥 Mitwirkende</h3>
                  <p>• Marius Schmieder</p>
                  <p>• Charlie Espig</p>
                  <p>• Manuela Barthel</p>
                  <p>• Matthias Albrecht</p>
                  <p>• Lagertechnik.de</p>
                </div>
                
                <div className="impressum-card">
                  <h3>Letzte Aktualisierung</h3>
                  <p className="last-update-date">
                    {lastUpdated ? new Date(lastUpdated).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Wird geladen...'}
                  </p>
                </div>
              </div>
              
              <div className="impressum-links">
                <button className="impressum-link" onClick={showImpressumPage}>
                  Vollständiges Impressum
                </button>
                <button className="impressum-link" onClick={showQuellenPage}>
                  Quellen & Literatur
                </button>
                <button className="impressum-link" onClick={showKontaktPage}>
                  Kontakt & Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}