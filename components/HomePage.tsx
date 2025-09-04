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
              Entdecken Sie die umfangreiche Sammlung seltener Mineralien und Gesteine 
              des Samuel von Pufendorf Gymnasiums Flöha auf eine interaktive Art.
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

      {/* Features Section */}
      <div className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Sammlungsfeatures</h2>
            <p className="section-description">
              Was kann dieses Archiv?
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Intelligente Suche</h3>
              <p className="feature-description">
                Suchen Sie nach Namen, Steinnummer oder Eigenschaften. 
                Das System erkennt automatisch Ihre Suchintention.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Präzise Filter</h3>
              <p className="feature-description">
                Filtern Sie nach Farbe, Fundort, Gesteinsart oder Standort. 
                Finden Sie genau das gesuchte Mineral.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Detaillierte Dokumentation</h3>
              <p className="feature-description">
                Jedes Mineral ist wissenschaftlich dokumentiert mit 
                Herkunft, Eigenschaften und passenden Bildern.
              </p>
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
                Von verschiedensten Gesteinen bis hin zu seltenen 
                Mineralien sind in dieser Sammlung zu finden.
              </p>
            </div>
            
            <div className="about-visual">
              <div className="about-card">
                <div className="about-card-icon">🌍</div>
                <h4>Weltweite Fundorte</h4>
                <p>Mineralien aus verschiedensten Fundorten</p>
              </div>
              <div className="about-card">
                <div className="about-card-icon">🔬</div>
                <h4>Wissenschaftlich dokumentiert</h4>
                <p>Präzise Katalogisierung von Schülern dieser Schule</p>
              </div>
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
                  <p><strong>Marius Schmieder (Digitalisierung & Bestimmung)</strong></p>
                  <p>Schüler der 10c</p>
                  <p>📞 03726 123456</p>
                  <p>✉️ <a href="mailto:marius-schmieder@gymnasium-floeha.lernsax.de">
                    marius-schmieder@gymnasium-floeha.lernsax.de
                  </a></p>
                </div>

                <div className="impressum-card">
                  <h3>👤 Kontaktperson</h3>
                  <p><strong>Charlie Espig (Bestimmung)</strong></p>
                  <p>Schüler der 10c</p>
                  <p>📞 03726 123456</p>
                  <p>✉️ <a href="mailto:charlie-espig@gymnasium-floeha.lernsax.de">
                    charlie-espig@gymnasium-floeha.lernsax.de
                  </a></p>
                </div>

                <div className="impressum-card">
                  <h3>👤 Kontaktperson</h3>
                  <p><strong>Manuela Barthel (Projektleitung)</strong></p>
                  <p>Fachbereich Geologie</p>
                  <p>📞 03726 123456</p>
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
                  <p>• Marius Schmieder (Digitalisierung & Bestimmung)</p>
                  <p>• Charlie Espig (Bestimmung)</p>
                  <p>• Manuela Barthel (Projektleitung)</p>
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