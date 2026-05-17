import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Header({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps) {
  const router = useRouter();
  const currentPage = router.pathname === '/' ? 'home' : router.pathname.replace('/', '');

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
            <Link href="/" className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}>
              Startseite
            </Link>
            <Link href="/vitrines" className={`nav-link ${currentPage === 'vitrines' ? 'active' : ''}`}>
              Regale
            </Link>
            <Link href="/collection" className={`nav-link ${currentPage === 'collection' ? 'active' : ''}`}>
              Sammlung
            </Link>
            <Link href="/map" className={`nav-link ${currentPage === 'map' ? 'active' : ''}`}>
              Karte
            </Link>
            <Link href="/admin" className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}>
              Verwaltung
            </Link>
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