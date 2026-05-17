import React from 'react';
import Link from 'next/link';

interface LegalPagesProps {
  currentPage: string;
}

export default function LegalPages({ currentPage }: LegalPagesProps) {
  if (currentPage === 'impressum') {
    return (
      <section className="page active">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Impressum</h1>
          </div>
          <div className="legal-btn-wrapper">
            <Link href="/" className='btn btn-primary'>
                Zurück zur Startseite 
            </Link>
          </div>
          
          <div className="legal-content">
            <div className="legal-section">
              <h2>Angaben gemäß § 5 TMG</h2>
              <p><strong>Samuel von Pufendorf Gymnasium Flöha</strong></p>
              <p>Turnerstraße 16<br/>
                09557 Flöha<br/>
                Deutschland</p>
            </div>
            
            <div className="legal-section">
              <h2>Vertreten durch</h2>
              <p>Schulleitung: Frau Noack<br/>
                Fachbereich Geologie: Herr Sommer</p>
            </div>
            
            <div className="legal-section">
              <h2>Kontakt</h2>
              <p>Telefon: 03726 58160<br/>
                E-Mail: gymnasium-floeha@landkreis-mittelsachsen.de<br/>
                Internet: www.gymnasium-floeha.de</p>
            </div>
            
            <div className="legal-section">
              <h2>Haftung für Inhalte</h2>
              <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr Übernehmen.</p>
            </div>
            
            <div className="legal-section">
              <h2>Datenschutz</h2>
              <p>Diese Website verwendet keine Cookies und sammelt keine personenbezogenen Daten. Die Mineraliensammlung dient ausschließlich wissenschaftlichen und pädagogischen Zwecken.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (currentPage === 'quellen') {
    return (
      <section className="page active">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Quellen & Literatur</h1>
          </div>

          <div className="legal-btn-wrapper">
            <Link href="/" className='btn btn-primary'>
                Zurück zur Startseite 
            </Link>
          </div>
          
          <div className="sources-content">
            <div className="sources-section">
              <h2>Hauptliteratur</h2>
              <ul className="sources-list">
                <li>Mineralien Bestimmen, Kennenlernen, Sammeln (Rupert Hochleitner) </li>
                <li>Minerale Arthia (Jaroslav Svenek und Ladislav Pros)</li>
                <li>Gesteinsbestimmungsbuch (Rudolf Jubelt und Peter Schreiter)</li>
                <li>Minerale Sammeln und Bestimmen (Rolf Seim)</li>
              </ul>
            </div>
            
            <div className="sources-section">
              <h2>Online-Ressourcen</h2>
              <ul className="sources-list">
                <li><a href="https://www.mindat.org" target="_blank" rel="noopener noreferrer">Mindat.org - Mineraldatenbank</a></li>
                <li><a href="https://www.seilnacht.com" target="_blank" rel="noopener noreferrer">Seilnacht Mineralien</a></li>
                <li><a href="https://www.mineralienatlas.de/" target="_blank" rel="noopener noreferrer">Mineralienatlas - Mineralogischer Atlas</a></li>
              </ul>
            </div>
            
            <div className="sources-section">
              <h2>Technische Ausstattung</h2>
              <ul className="sources-list">
                <li>S25 Ultra für Kameraufnamhmen</li>
                <li>Raspberry Pi mit Immich für Cloud Syncronisation</li>
                <li>Raspberry Pi für Website hosting</li>
              </ul>
            </div>
            
            <div className="sources-section">
              <h2>Mitwirkende Personen</h2>
              <ul className="sources-list">
                <li><strong>Marius Schmieder</strong> - Webentwicklung und Datenbank, Bestimmung, Fotografie, Digitalisierung</li>
                <li><strong>Charlie Espig</strong> - Bestimmung, Digitalisierung und Fotografie</li>
                <li><strong>Herr Matthias Albrecht</strong> - Geologie, Bestimmung von Gesteinen</li>
                <li><strong>Lagertechnik.de</strong> - Sponsor für Lagermöglichkeiten</li>
                <li><strong>Frau Barthel</strong> - Betreuung und fachliche Unterstützung</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (currentPage === 'kontakt') {
    return (
      <section className="page active">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Kontakt & Support</h1>
          </div>

          <div className="legal-btn-wrapper">
            <Link href="/" className='btn btn-primary'>
                Zurück zur Startseite 
            </Link>
          </div>
          
          <div className="contact-content">
            <div className="contact-grid">
              <div className="contact-card">
                <h3>Schuladresse</h3>
                <p><strong>Samuel von Pufendorf Gymnasium Flöha</strong></p>
                <p>Turnerstraße 16<br/>
                  09557 Flöha<br/>
                  Deutschland</p>
                <p><strong>03726 58160</strong></p>
              </div>
              
              <div className="contact-card">
                <h3>Ansprechpartner</h3>
                <p><strong>Frau Barthel</strong><br/>
                  Fachbereich Geologie</p>
                <p>manuela-barthel@gymnasium-floeha.lernsax.de</p>
              </div>
              
              <div className="contact-card">
                <h3>Technischer Support</h3>
                <p><strong>Marius Schmieder</strong><br/>
                  Schüler Klasse 10c</p>
                <p>marius-schmieder@gymnasium-floeha.lernsax.de</p>
                <p>Bei technischen Problemen mit der Website</p>
              </div>
              
              <div className="contact-card">
                <h3>Online</h3>
                <p><strong>Website:</strong><br/>
                  <a href="https://gymnasium-floeha.de" target="_blank" rel="noopener noreferrer">
                    gymnasium-floeha.de
                  </a></p>
                <p><strong>Sammlung:</strong><br/>
                  Diese Webanwendung</p>
              </div>
            </div>
            
            <div className="contact-info">
              <h2>Wichtige Informationen</h2>
              <div className="info-grid">
                <div className="info-item">
                  <h4>Inhalt</h4>
                  <p>Für inhaltliche Richtigkeit übernehmen wir keine Verantwortung. Diese Sammlung dient nur der Ausstellung der Mineraliensammlung.</p>
                </div>
                <div className="info-item">
                  <h4>Bildungsnutzung</h4>
                  <p>Diese Sammlung steht für Bildungszwecke zur Verfügung und für die Verwendung im Unterricht.</p>
                </div>
                <div className="info-item">
                  <h4>Spenden</h4>
                  <p>Mineralspenden zur Erweiterung der Sammlung werden gerne entgegengenommen.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}