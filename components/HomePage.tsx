import React, { useEffect, useRef, useState } from 'react';
import { Stats } from '../types';

interface HomePageProps {
  showPage: (page: string) => void;
  stats: Stats;
  lastUpdated: string;
  setLastUpdated: (date: string) => void;
}

export default function HomePage({ showPage, stats, lastUpdated, setLastUpdated }: HomePageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [counters, setCounters] = useState({ minerals: 0, locations: 0, colors: 0, shelves: 0 });

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
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Animated counters
  useEffect(() => {
    if (!stats.total_minerals) return;
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounters({
        minerals: Math.floor(ease * stats.total_minerals),
        locations: Math.floor(ease * stats.total_locations),
        colors: Math.floor(ease * stats.total_colors),
        shelves: Math.floor(ease * stats.total_shelves),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [stats]);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; hue: number }[] = [];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.15,
        hue: Math.random() > 0.5 ? 214 : 196, // blue or cyan
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(96, 165, 250, ${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const showImpressumPage = () => showPage('impressum');
  const showQuellenPage = () => showPage('quellen');
  const showKontaktPage = () => showPage('kontakt');

  return (
    <section className="page active hp-root">

      {/* ── HERO ── */}
      <div className={`hp-hero ${visible ? 'hp-hero--visible' : ''}`}>
        <canvas ref={canvasRef} className="hp-hero-canvas" />

        {/* geological texture overlay */}
        <div className="hp-hero-texture" />

        <div className="container hp-hero-inner">
          <div className="hp-hero-left">
            <span className="hp-eyebrow">Samuel von Pufendorf Gymnasium · Flöha</span>
            <h1 className="hp-title">
              <span className="hp-title-line hp-title-line--1">Mineralien</span>
              <span className="hp-title-line hp-title-line--2">&amp; Gesteine</span>
              <span className="hp-title-line hp-title-line--accent">Sammlung</span>
            </h1>
            <p className="hp-lead">
              Eine vollständig digitalisierte Schulsammlung — systematisch erfasst, 
              interaktiv erkundbar und wissenschaftlich dokumentiert.
            </p>
            <div className="hp-cta-row">
              <button className="hp-btn hp-btn--primary" onClick={() => showPage('collection')}>
                <span className="hp-btn-icon">◈</span>
                Sammlung erkunden
              </button>
              <button className="hp-btn hp-btn--ghost" onClick={() => showPage('vitrines')}>
                <span className="hp-btn-icon">⬡</span>
                Vitrinen ansehen
              </button>
            </div>
          </div>

          <div className="hp-hero-right">
            <div className="hp-gem-wrapper">
              <div className="hp-gem-ring hp-gem-ring--outer" />
              <div className="hp-gem-ring hp-gem-ring--mid" />
              <div className="hp-gem-ring hp-gem-ring--inner" />
              <div className="hp-gem-core">💎</div>
              <span className="hp-gem-orbit hp-gem-orbit--1">✦</span>
              <span className="hp-gem-orbit hp-gem-orbit--2">◆</span>
              <span className="hp-gem-orbit hp-gem-orbit--3">✧</span>
              <span className="hp-gem-orbit hp-gem-orbit--4">◇</span>
            </div>
          </div>
        </div>

        <div className="hp-hero-scroll">
          <span className="hp-scroll-label">Entdecken</span>
          <div className="hp-scroll-line" />
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="hp-stats">
        <div className="container hp-stats-grid">
          {[
            { value: counters.minerals, label: 'Mineralien', icon: '◈', suffix: '+' },
            { value: counters.locations, label: 'Fundorte', icon: '⌖', suffix: '' },
            { value: counters.colors, label: 'Farben', icon: '◉', suffix: '' },
            { value: counters.shelves, label: 'Regale', icon: '⬡', suffix: '' },
          ].map((s, i) => (
            <div className="hp-stat" key={i} style={{ '--delay': `${i * 0.12}s` } as React.CSSProperties}>
              <span className="hp-stat-icon">{s.icon}</span>
              <span className="hp-stat-value">{s.value}{s.suffix}</span>
              <span className="hp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="hp-features">
        <div className="container">
          <div className="hp-section-header">
            <div className="hp-section-tag">Funktionen</div>
            <h2 className="hp-section-title">Was dich erwartet</h2>
          </div>

          <div className="hp-features-grid">
            {[
              {
                icon: '🔬',
                title: 'Detailkatalog',
                desc: 'Jedes Mineral mit Fundort, Farbe, Härte und wissenschaftlicher Klassifikation vollständig dokumentiert.',
                action: () => showPage('collection'),
                cta: 'Zur Sammlung',
              },
              {
                icon: '🗺️',
                title: 'Fundort-Karte',
                desc: 'Interaktive Weltkarte zeigt, woher jeder Stein stammt — von Sachsen bis Südamerika.',
                action: () => showPage('map'),
                cta: 'Karte öffnen',
              },
              {
                icon: '📦',
                title: 'Vitrinenplan',
                desc: 'Digitaler Grundriss aller Vitrinen und Regale. Finde jeden Stein auf Anhieb.',
                action: () => showPage('vitrines'),
                cta: 'Vitrinen',
              },
            ].map((f, i) => (
              <div
                className="hp-feature-card"
                key={i}
                onClick={f.action}
                style={{ '--delay': `${i * 0.15}s` } as React.CSSProperties}
              >
                <div className="hp-feature-icon">{f.icon}</div>
                <h3 className="hp-feature-title">{f.title}</h3>
                <p className="hp-feature-desc">{f.desc}</p>
                <span className="hp-feature-link">{f.cta} →</span>
                <div className="hp-feature-glow" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div className="hp-about">
        <div className="container hp-about-inner">
          <div className="hp-about-decoration">
            <div className="hp-crystal-large">🪨</div>
            <div className="hp-about-lines">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="hp-about-line" style={{ '--i': i } as React.CSSProperties} />
              ))}
            </div>
          </div>
          <div className="hp-about-text">
            <div className="hp-section-tag">Hintergrund</div>
            <h2 className="hp-section-title">Über dieses Projekt</h2>
            <p className="hp-about-body">
              Die Mineraliensammlung ist Eigentum des <strong>Samuel von Pufendorf Gymnasiums Flöha</strong>. 
              Lehrer und externe Fachleute haben die Sammlung über Jahrzehnte hinweg zusammengetragen 
              und stetig erweitert.
            </p>
            <p className="hp-about-body">
              Im Jahr 2025 wurde im Rahmen einer <em>Komplexen Leistung</em> das Ziel gesetzt, 
              diese umfangreiche Sammlung vollständig zu digitalisieren, zu katalogisieren und 
              für Schüler und Interessierte zugänglich zu machen.
            </p>
            <div className="hp-about-tags">
              {['Geologie', 'Mineralogie', 'Schülerprojekt 2025', 'Open Catalogue'].map(tag => (
                <span key={tag} className="hp-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── IMPRESSUM ── */}
      <div className="hp-impressum">
        <div className="container">
          <div className="hp-section-header">
            <div className="hp-section-tag">Impressum</div>
            <h2 className="hp-section-title">Kontakt &amp; Informationen</h2>
          </div>

          <div className="hp-impressum-grid">
            <div className="hp-imp-card">
              <div className="hp-imp-avatar">MS</div>
              <div>
                <p className="hp-imp-name">Marius Schmieder</p>
                <p className="hp-imp-role">Schüler der 10c</p>
                <a className="hp-imp-mail" href="mailto:marius-schmieder@gymnasium-floeha.lernsax.de">
                  marius-schmieder@gymnasium-floeha.lernsax.de
                </a>
              </div>
            </div>

            <div className="hp-imp-card">
              <div className="hp-imp-avatar">CE</div>
              <div>
                <p className="hp-imp-name">Charlie Espig</p>
                <p className="hp-imp-role">Schüler der 10c</p>
                <a className="hp-imp-mail" href="mailto:charlie-espig@gymnasium-floeha.lernsax.de">
                  charlie-espig@gymnasium-floeha.lernsax.de
                </a>
              </div>
            </div>

            <div className="hp-imp-card">
              <div className="hp-imp-avatar">MB</div>
              <div>
                <p className="hp-imp-name">Manuela Barthel</p>
                <p className="hp-imp-role">Lehrerin – Geografie</p>
                <a className="hp-imp-mail" href="mailto:manuela-barthel@gymnasium-floeha.lernsax.de">
                  manuela-barthel@gymnasium-floeha.lernsax.de
                </a>
              </div>
            </div>

            <div className="hp-imp-card hp-imp-card--wide">
              <div className="hp-imp-avatar hp-imp-avatar--school">🏫</div>
              <div>
                <p className="hp-imp-name">Samuel von Pufendorf Gymnasium Flöha</p>
                <p className="hp-imp-role">Turnerstraße 16 · 09557 Flöha, Deutschland</p>
                <a className="hp-imp-mail" href="https://gymnasium-floeha.de" target="_blank" rel="noopener noreferrer">
                  gymnasium-floeha.de
                </a>
              </div>
            </div>

            <div className="hp-imp-card hp-imp-card--contrib">
              <p className="hp-imp-contrib-label">Mitwirkende</p>
              <div className="hp-imp-contrib-list">
                {['Marius Schmieder', 'Charlie Espig', 'Manuela Barthel', 'Matthias Albrecht', 'Lagertechnik.de'].map(n => (
                  <span key={n} className="hp-imp-contrib-name">{n}</span>
                ))}
              </div>
            </div>

            <div className="hp-imp-card hp-imp-card--update">
              <p className="hp-imp-contrib-label">Letzte Aktualisierung</p>
              <p className="hp-imp-update-date">
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleDateString('de-DE', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : 'Wird geladen…'}
              </p>
            </div>
          </div>

          <div className="hp-impressum-links">
            <button className="hp-imp-link" onClick={showImpressumPage}>Vollständiges Impressum</button>
            <button className="hp-imp-link" onClick={showQuellenPage}>Quellen &amp; Literatur</button>
            <button className="hp-imp-link" onClick={showKontaktPage}>Kontakt &amp; Support</button>
          </div>
        </div>
      </div>
    </section>
  );
}
