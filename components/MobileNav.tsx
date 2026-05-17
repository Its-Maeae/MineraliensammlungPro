import React from 'react';
import Link from 'next/link';

interface MobileNavProps {
  mobileMenuOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ mobileMenuOpen, onClose }: MobileNavProps) {
  return (
    <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
      <Link className="mobile-nav-link" href="/" onClick={onClose}>Startseite</Link>
      <Link className="mobile-nav-link" href="/vitrines" onClick={onClose}>Regale</Link>
      <Link className="mobile-nav-link" href="/collection" onClick={onClose}>Sammlung</Link>
      <Link className="mobile-nav-link" href="/map" onClick={onClose}>Karte</Link>
      <Link className="mobile-nav-link" href="/admin" onClick={onClose}>Verwaltung</Link>
    </div>
  );
}