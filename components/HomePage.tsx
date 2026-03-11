import React, { useEffect, useRef, useState } from 'react';
import { Stats } from '../types';

interface HomePageProps {
  showPage: (page: string) => void;
  stats: Stats;
  lastUpdated: string;
  setLastUpdated: (date: string) => void;
}

/* Slow animated counter — counts up once on mount */
function useCounter(target: number) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let i = 0;
    const steps = 50;
    const id = setInterval(() => {
      i++;
      setVal(Math.round((1 - Math.pow(1 - i / steps, 3)) * target));
      if (i >= steps) clearInterval(id);
    }, 1800 / steps);
    return () => clearInterval(id);
  }, [target]);
  return val;
}

/* Subtle animated strata lines — slow, barely moving */
function StrataBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // A handful of irregular, slow strata lines — not perfectly spaced
    const lines = [
      { y: 0.14, amp: 8,  freq: 0.004, phase: 0.0,  speed: 0.00025, op: 0.07, w: 1.2 },
      { y: 0.29, amp: 12, freq: 0.003, phase: 1.2,  speed: 0.00018, op: 0.05, w: 0.9 },
      { y: 0.41, amp: 6,  freq: 0.005, phase: 0.7,  speed: 0.0003,  op: 0.08, w: 1.5 },
      { y: 0.55, amp: 14, freq: 0.0025,phase: 2.1,  speed: 0.00015, op: 0.06, w: 1.0 },
      { y: 0.68, amp: 9,  freq: 0.0035,phase: 3.5,  speed: 0.00022, op: 0.07, w: 1.3 },
      { y: 0.82, amp: 11, freq: 0.003, phase: 0.4,  speed: 0.0002,  op: 0.05, w: 0.8 },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lines.forEach(l => {
        l.phase += l.speed;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 6) {
          const y = l.y * canvas.height + Math.sin(x * l.freq + l.phase) * l.amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(30,64,175,${l.op})`;
        ctx.lineWidth = l.w;
        ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="hp-strata-canvas" />;
}

/* Mountain silhouette — asymmetric, hand-drawn feeling */
function Mountains() {
  return (
    <svg className="hp-mountains" viewBox="0 0 1200 280" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
      {/* Far background — very light, misty */}
      <polygon
        points="0,230  110,128  198,182  295,92   388,155  497,68   591,138  680,105  772,162  861,88   950,140  1040,100 1130,135 1200,118 1200,280 0,280"
        fill="rgba(148,163,184,0.18)"
      />
      {/* Mid range */}
      <polygon
        points="0,265  78,195  148,238  224,158  305,215  390,138  468,200  545,148  638,212  718,155  800,208  882,162  962,218  1040,172 1120,210 1200,182 1200,280 0,280"
        fill="rgba(100,116,139,0.25)"
      />
      {/* Foreground — most contrast */}
      <polygon
        points="0,280 0,262  58,222  104,258  162,192  213,248  278,172  332,228  388,178  444,240  506,175  562,232  618,182  676,252  735,188  794,245  850,192  908,250  965,200  1022,255 1080,208 1138,260 1200,220 1200,280"
        fill="rgba(51,65,85,0.30)"
      />
      {/* A few sharp crystal-peak outlines on notable summits */}
      <polyline points="278,172 298,145 318,172" stroke="rgba(30,64,175,0.38)" strokeWidth="1.4" fill="none"/>
      <polyline points="506,175 524,150 542,175" stroke="rgba(30,64,175,0.28)" strokeWidth="1.2" fill="none"/>
      <polyline points="735,188 752,162 769,188" stroke="rgba(14,165,233,0.25)" strokeWidth="1" fill="none"/>
      {/* Fault line — one subtle dashed crack */}
      <line x1="390" y1="280" x2="375" y2="138" stroke="rgba(30,64,175,0.15)" strokeWidth="1" strokeDasharray="4 8"/>
    </svg>
  );
}

export default function HomePage({ showPage, stats, lastUpdated, setLastUpdated }: HomePageProps) {
  const cMin = useCounter(stats.total_minerals);
  const cLoc = useCounter(stats.total_locations);
  const cCol = useCounter(stats.total_colors);
  const cShl = useCounter(stats.total_shelves);

  useEffect(() => {
    fetch('/api/last-updated')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setLastUpdated(d.last_updated))
      .catch(() => {});
  }, []);

  return (
    <section className="page active hp-root">

      {/* ─────────────────────────────────────
          HERO
      ───────────────────────────────────── */}
      <div className="hp-hero">
        <StrataBackground />

        <div className="container hp-hero-inner">
          {/* Left — text, intentionally a bit offset */}
          <div className="hp-hero-text">
            <p className="hp-school-label">Samuel von Pufendorf Gymnasium Flöha</p>

            <h1 className="hp-headline">
              Mineralien<br />
              <span className="hp-headline-and">&amp;</span>{' '}
              <span className="hp-headline-second">Gesteine</span>
            </h1>

            <p className="hp-intro">
              Dieses Projekt entstand aus einer Schülerarbeit. Wir haben die Mineraliensammlung 
              unserer Schule sortiert, fotografiert und für alle zugänglich gemacht — 
              von jedem Gerät aus, kostenlos.
            </p>

            <div className="hp-actions">
              <button className="hp-btn-main" onClick={() => showPage('collection')}>
                Sammlung ansehen
              </button>
              <button className="hp-btn-sec" onClick={() => showPage('vitrines')}>
                Wo liegt was? →
              </button>
            </div>
          </div>

          {/* Right — geological cross-section diagram */}
          <div className="hp-hero-diagram" aria-hidden>
            <svg viewBox="0 0 280 320" className="hp-section-svg" xmlns="http://www.w3.org/2000/svg">
              {/* Layer fills — wavy, slightly irregular */}
              <path d="M0,20  Q70,14  140,22 Q210,30  280,18 L280,62 Q210,70 140,64 Q70,58  0,66 Z"  fill="rgba(203,213,225,0.6)"/>
              <path d="M0,66  Q70,58  140,64 Q210,70 280,62 L280,108 Q210,116 140,110 Q70,104 0,112 Z" fill="rgba(148,163,184,0.55)"/>
              <path d="M0,112 Q70,104 140,110 Q210,116 280,108 L280,158 Q210,168 140,162 Q70,156 0,164 Z" fill="rgba(100,116,139,0.5)"/>
              <path d="M0,164 Q70,156 140,162 Q210,168 280,158 L280,214 Q210,224 140,218 Q70,212 0,220 Z" fill="rgba(71,85,105,0.48)"/>
              <path d="M0,220 Q70,212 140,218 Q210,224 280,214 L280,274 Q210,284 140,278 Q70,272 0,280 Z" fill="rgba(51,65,85,0.44)"/>
              <path d="M0,280 Q70,272 140,278 Q210,284 280,274 L280,320 L0,320 Z"                       fill="rgba(30,41,59,0.42)"/>

              {/* Layer borders */}
              {[66,112,164,220,280].map(y => (
                <path key={y}
                  d={`M0,${y} Q70,${y-6} 140,${y} Q210,${y+6} 280,${y-2}`}
                  stroke="rgba(30,64,175,0.2)" strokeWidth="1" fill="none"
                />
              ))}

              {/* Intrusion / crystal vein */}
              <polygon points="130,148 148,110 166,148 158,194 140,194"
                stroke="rgba(30,64,175,0.55)" strokeWidth="1.5" fill="rgba(30,64,175,0.14)"/>
              <line x1="140" y1="110" x2="140" y2="194" stroke="rgba(14,165,233,0.3)" strokeWidth="0.8"/>

              {/* Fault line */}
              <line x1="148" y1="0" x2="136" y2="320" stroke="rgba(30,64,175,0.22)" strokeWidth="1.2" strokeDasharray="5 8"/>

              {/* Tick marks right side */}
              {[43,89,138,192,252,300].map(y => (
                <line key={y} x1="280" y1={y} x2="294" y2={y} stroke="rgba(100,116,139,0.4)" strokeWidth="1"/>
              ))}
            </svg>

            {/* Layer labels — right of diagram, human handwriting-style font */}
            <div className="hp-layer-labels">
              <span>Sediment</span>
              <span>Kalkstein</span>
              <span>Tonschiefer</span>
              <span>Metamorphit</span>
              <span>Tiefengestein</span>
              <span>Magma</span>
            </div>
          </div>
        </div>

        <div className="hp-mountains-wrap">
          <Mountains />
        </div>
      </div>

      {/* ─────────────────────────────────────
          STATS — simple, no shapes
      ───────────────────────────────────── */}
      <div className="hp-stats">
        <div className="container">
          <div className="hp-stats-row">
            <div className="hp-stat">
              <strong>{cMin}</strong>
              <span>Mineralien in der Sammlung</span>
            </div>
            <div className="hp-stat-divider" />
            <div className="hp-stat">
              <strong>{cLoc}</strong>
              <span>verschiedene Fundorte</span>
            </div>
            <div className="hp-stat-divider" />
            <div className="hp-stat">
              <strong>{cCol}</strong>
              <span>erfasste Farben</span>
            </div>
            <div className="hp-stat-divider" />
            <div className="hp-stat">
              <strong>{cShl}</strong>
              <span>Regale und Vitrinen</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────
          ABOUT — editorial, two-column with pull quote
      ───────────────────────────────────── */}
      <div className="hp-about">
        <div className="container hp-about-inner">
          <div className="hp-about-left">
            <h2 className="hp-about-heading">Wie das hier entstanden ist</h2>
            <p className="hp-about-pull">
              „Eine Schublade mit Steinen. Keine Beschriftung. 
              Keiner wusste mehr, woher sie kamen."
            </p>
          </div>
          <div className="hp-about-right">
            <p>
              Die Mineraliensammlung des Samuel von Pufendorf Gymnasiums schlummerte jahrelang 
              in Vitrinen und Schubladen. Lehrer und Fachleute hatten über Jahrzehnte Stücke 
              zusammengetragen — aber eine systematische Übersicht fehlte.
            </p>
            <p>
              Im Rahmen unserer Komplexen Leistung haben wir 2025 jeden einzelnen Stein 
              in die Hand genommen, fotografiert, bestimmt und in diesen Katalog eingetragen. 
              Das Ergebnis ist diese Website.
            </p>
            <div className="hp-about-tags">
              <span>Geologie</span>
              <span>Mineralogie</span>
              <span>Schülerprojekt 2025</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────
          IMPRESSUM
      ───────────────────────────────────── */}
      <div className="hp-imprint">
        <div className="container">
          <h2 className="hp-imprint-heading">Impressum</h2>

          <div className="hp-imprint-grid">
            {[
              { init: 'MS', name: 'Marius Schmieder',  role: 'Schüler, 10c', mail: 'marius-schmieder@gymnasium-floeha.lernsax.de' },
              { init: 'CE', name: 'Charlie Espig',     role: 'Schüler, 10c', mail: 'charlie-espig@gymnasium-floeha.lernsax.de' },
              { init: 'MB', name: 'Manuela Barthel',   role: 'Lehrerin Geografie', mail: 'manuela-barthel@gymnasium-floeha.lernsax.de' },
            ].map(p => (
              <div className="hp-person" key={p.init}>
                <div className="hp-person-init">{p.init}</div>
                <div>
                  <p className="hp-person-name">{p.name}</p>
                  <p className="hp-person-role">{p.role}</p>
                  <a className="hp-person-mail" href={`mailto:${p.mail}`}>{p.mail}</a>
                </div>
              </div>
            ))}
          </div>

          <div className="hp-imprint-meta">
            <div className="hp-imprint-school">
              <strong>Samuel von Pufendorf Gymnasium Flöha</strong><br />
              Turnerstraße 16, 09557 Flöha —{' '}
              <a href="https://gymnasium-floeha.de" target="_blank" rel="noopener noreferrer">
                gymnasium-floeha.de
              </a>
            </div>

            <div className="hp-imprint-contrib">
              <span className="hp-imprint-label">Mitwirkende</span>
              <p>Marius Schmieder, Charlie Espig, Manuela Barthel, Matthias Albrecht, Lagertechnik.de</p>
            </div>

            {lastUpdated && (
              <div className="hp-imprint-updated">
                <span className="hp-imprint-label">Zuletzt aktualisiert</span>
                <p>{new Date(lastUpdated).toLocaleDateString('de-DE', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}</p>
              </div>
            )}
          </div>

          <div className="hp-imprint-links">
            <button onClick={() => showPage('impressum')}>Vollständiges Impressum</button>
            <button onClick={() => showPage('quellen')}>Quellen &amp; Literatur</button>
            <button onClick={() => showPage('kontakt')}>Kontakt</button>
          </div>
        </div>
      </div>

    </section>
  );
}
