import React from 'react';

interface HeaderProps {
  currentPage: string;
  showPage: (page: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Header({ 
  currentPage, 
  showPage, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}: HeaderProps) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">💎</div>
            <div className="logo-text">
              <span className="logo-title">Gesteins- und Mineraliensammlung</span>
              <span className="logo-subtitle">Samuel von Pufendorf Gymnasium Flöha</span>
            </div>
          </div>
          
          <nav className="nav">
            <a 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => showPage('home')}
            >
              Startseite
            </a>
            <a 
              className={`nav-link ${currentPage === 'vitrines' ? 'active' : ''}`}
              onClick={() => showPage('vitrines')}
            >
              Regale
            </a>
            <a 
              className={`nav-link ${currentPage === 'collection' ? 'active' : ''}`}
              onClick={() => showPage('collection')}
            >
              Sammlung
            </a>
            <a 
              className={`nav-link ${currentPage === 'map' ? 'active' : ''}`}
              onClick={() => showPage('map')}
            >
              Karte
            </a>
            <a 
              className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => showPage('admin')}
            >
              Verwaltung
            </a>
          </nav>
          
          <div 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </header>
  );
}