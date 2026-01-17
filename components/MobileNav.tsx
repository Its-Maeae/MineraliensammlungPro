import React from 'react';

interface MobileNavProps {
  mobileMenuOpen: boolean;
  showPage: (page: string) => void;
}

export default function MobileNav({ mobileMenuOpen, showPage }: MobileNavProps) {
  return (
    <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
      <a className="mobile-nav-link" onClick={() => showPage('home')}>Startseite</a>
      <a className="mobile-nav-link" onClick={() => showPage('vitrines')}>Regale</a>
      <a className="mobile-nav-link" onClick={() => showPage('collection')}>Sammlung</a>
      <a className="mobile-nav-link" onClick={() => showPage('map')}>Karte</a>
      <a className="mobile-nav-link" onClick={() => showPage('admin')}>Verwaltung</a>
    </div>
  );
}