import React, { useEffect, useRef, useState } from 'react';
import { Stats } from '../types';
import Image from 'next/image'; 
import ShelfImage from './shelf_main.jpg';
import First from './first.jpg';
import Second from './second.jpg';
import Third from './third.jpg';
import Fourth from './fourth.jpg';
import Fifth from './fifth.jpg';

interface HomePageProps {
  showPage: (page: string) => void;
  stats: Stats;
  lastUpdated: string;
  setLastUpdated: (date: string) => void;
}

function useCounter(target: number, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    const steps = 60;
    const id = setInterval(() => {
      frame++;
      const ease = 1 - Math.pow(1 - frame / steps, 3);
      setVal(Math.floor(ease * target));
      if (frame >= steps) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

function GeoCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const crystals = [
      { cx: 0.72, cy: 0.18, r: 55, sides: 6, rot: 0.3, drot: 0.0004, op: 0.10, col: '30,64,175' },
      { cx: 0.85, cy: 0.55, r: 32, sides: 4, rot: 0.8, drot: -0.0005, op: 0.08, col: '30,64,175' },
      { cx: 0.60, cy: 0.72, r: 20, sides: 3, rot: 0.2, drot: 0.0007, op: 0.07, col: '14,165,233' },
      { cx: 0.88, cy: 0.28, r: 16, sides: 5, rot: 1.1, drot: 0.0005, op: 0.09, col: '59,130,246' },
      { cx: 0.76, cy: 0.86, r: 26, sides: 6, rot: 0.5, drot: -0.0003, op: 0.07, col: '30,64,175' },
      { cx: 0.62, cy: 0.38, r: 12, sides: 4, rot: 0.0, drot: 0.0008, op: 0.09, col: '14,165,233' },
    ];

    const strata = Array.from({ length: 8 }, (_, i) => ({
      y: 0.08 + i * 0.11,
      amp: 5 + i * 2,
      freq: 0.007 + i * 0.002,
      phase: Math.random() * Math.PI * 2,
      dphase: 0.0006 + i * 0.0002,
      op: 0.045 + i * 0.008,
      w: 0.7 + Math.random() * 0.7,
    }));

    const drawPoly = (cx: number, cy: number, r: number, sides: number, rot: number, op: number, col: string) => {
      ctx.beginPath();
      for (let s = 0; s < sides; s++) {
        const a = rot + (s / sides) * Math.PI * 2;
        s === 0 ? ctx.moveTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r)
                : ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${col},${op})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = `rgba(${col},${op * 0.28})`;
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strata.forEach(s => {
        s.phase += s.dphase;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = s.y * canvas.height + Math.sin(x * s.freq + s.phase) * s.amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(30,64,175,${s.op})`;
        ctx.lineWidth = s.w;
        ctx.stroke();
      });
      crystals.forEach(c => {
        c.rot += c.drot;
        drawPoly(c.cx * canvas.width, c.cy * canvas.height, c.r, c.sides, c.rot, c.op, c.col);
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="hp-geo-canvas" />;
}

function MountainSVG() {
  return (
    <svg className="hp-mountain-svg" viewBox="0 0 900 300" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
      
      <polygon points="0,240 90,110 175,180 260,80 360,155 455,60 550,145 640,95 725,160 810,85 900,130 900,300 0,300" fill="rgba(148,163,184,0.22)" />
      
      <polygon points="0,290 55,200 120,245 195,155 270,220 355,135 435,205 510,130 595,195 670,148 750,205 825,162 900,188 900,300 0,300" fill="rgba(100,116,139,0.28)" />
      
      <polygon points="0,300 0,275 65,210 120,258 185,175 245,238 320,152 390,222 455,168 520,238 590,162 655,228 720,178 790,250 865,192 900,215 900,300" fill="rgba(51,65,85,0.32)" />
     
      <polyline points="320,152 342,120 364,152" stroke="rgba(30,64,175,0.45)" strokeWidth="1.5" fill="none" />
      <polyline points="185,175 203,148 221,175" stroke="rgba(14,165,233,0.35)" strokeWidth="1.2" fill="none" />
      <polyline points="455,60 475,32 495,60" stroke="rgba(30,64,175,0.3)" strokeWidth="1" fill="none" />
    
      <line x1="260" y1="300" x2="250" y2="80" stroke="rgba(14,165,233,0.13)" strokeWidth="1" strokeDasharray="4 7" />
      
      <line x1="0" y1="268" x2="900" y2="262" stroke="rgba(30,64,175,0.08)" strokeWidth="1.5" />
      <line x1="0" y1="282" x2="900" y2="278" stroke="rgba(30,64,175,0.06)" strokeWidth="1" />
    </svg>
  );
}


export default function HomePage({ showPage, stats, lastUpdated, setLastUpdated }: HomePageProps) {
  const [visible, setVisible] = useState(false);

  const cMin = useCounter(stats.total_minerals);
  const cLoc = useCounter(stats.total_locations);
  const cCol = useCounter(stats.total_colors);
  const cShl = useCounter(stats.total_shelves);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/last-updated');
        if (res.ok) setLastUpdated((await res.json()).last_updated);
      } catch {}
    })();
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className={`page active hp-root ${visible ? 'hp-visible' : ''}`}>

      <div className="hp-hero">
        <GeoCanvas />
        <div className="hp-hero-diagonal" />

        <div className="container hp-hero-inner">
          <div className="hp-hero-text">
            <h1 className="hp-title">
              <span className="hp-title-main">Mineralien</span>
              <span className="hp-title-main hp-title-main--indent">&amp; Gesteine</span>
              <span className="hp-title-sub">Digitales Archiv</span>
            </h1>
            <p className="hp-lead">
              Entdecke die Sammlungsstücke des Samuel von Pufendorf Gymnasiums Flöha.
            </p>
            <div className="hp-cta-row">
              <button className="hp-btn hp-btn--primary" onClick={() => showPage('collection')}>
                Sammlung erkunden
              </button>
              <button className="hp-btn hp-btn--outline" onClick={() => showPage('vitrines')}>
                Vitrinen ansehen
              </button>
            </div>
          </div>
        </div>

        <div className="hp-mountain-wrapper">
          <MountainSVG />
        </div>
      </div>

      
      <div className="hp-stats">
        <div className="container hp-stats-grid">
          {[
            { value: cMin, label: 'Mineralien', shape: 'hex' },
            { value: cLoc, label: 'Fundorte',   shape: 'dia' },
            { value: cCol, label: 'Farben',     shape: 'tri' },
            { value: cShl, label: 'Regale',     shape: 'sqr' },
          ].map((s, i) => (
            <div className="hp-stat" key={i} style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}>
              <div className={`hp-stat-shape hp-stat-shape--${s.shape}`} />
              <span className="hp-stat-value">{s.value}</span>
              <span className="hp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hp-geo-section">
        <div className="container hp-geo-inner">

          
          {/* <div className="hp-strata-wrap" aria-hidden>
            <svg viewBox="0 0 340 380" className="hp-strata-svg" xmlns="http://www.w3.org/2000/svg">
              {[
                { y:28,  h:40, ca:'203,213,225', op:0.55 },
                { y:76,  h:36, ca:'148,163,184', op:0.50 },
                { y:120, h:46, ca:'100,116,139', op:0.45 },
                { y:174, h:50, ca:'71,85,105',   op:0.42 },
                { y:232, h:56, ca:'51,65,85',    op:0.38 },
                { y:296, h:66, ca:'30,41,59',    op:0.35 },
              ].map((l, i) => (
                <g key={i}>
                  <path
                    d={`M0,${l.y} Q85,${l.y+(i%2===0?7:-7)} 170,${l.y+2} Q255,${l.y+(i%2===0?-6:6)} 340,${l.y} L340,${l.y+l.h} Q255,${l.y+l.h+(i%2===0?-5:5)} 170,${l.y+l.h+1} Q85,${l.y+l.h+(i%2===0?5:-5)} 0,${l.y+l.h} Z`}
                    fill={`rgba(${l.ca},${l.op})`}
                  />
                  <path
                    d={`M0,${l.y} Q85,${l.y+(i%2===0?7:-7)} 170,${l.y+2} Q255,${l.y+(i%2===0?-6:6)} 340,${l.y}`}
                    stroke="rgba(30,64,175,0.18)" strokeWidth="1" fill="none"
                  />
                </g>
              ))}
             
              <line x1="172" y1="0" x2="158" y2="370" stroke="rgba(30,64,175,0.28)" strokeWidth="1.5" strokeDasharray="5 7"/>
              
              <polygon points="145,192 170,150 195,192 182,242 158,242"
                stroke="rgba(30,64,175,0.5)" strokeWidth="1.5" fill="rgba(30,64,175,0.13)" />
              <line x1="160" y1="150" x2="160" y2="242" stroke="rgba(14,165,233,0.3)" strokeWidth="0.9"/>
              
              {[48,94,143,199,260,329].map(y => (
                <line key={y} x1="340" y1={y} x2="360" y2={y} stroke="rgba(100,116,139,0.35)" strokeWidth="1"/>
              ))}
            </svg>
            <div className="hp-strata-labels">
              {['Sedimentgestein','Kalkstein','Tonschiefer','Metamorphit','Tiefengestein','Magma'].map(l => (
                <span key={l} className="hp-strata-label">{l}</span>
              ))}
            </div>
          </div> */}

          <div className='hp-strata-wrap'>
            <Image src={ShelfImage} alt="Shelf Image" width={300} height={520}/>
          </div>

          <div className="hp-geo-text">
            <div className="hp-section-tag">Hintergrund</div>
            <h2 className="hp-section-title">Über dieses Projekt</h2>
            <br></br>
            <p className="hp-about-body">
              Die Mineraliensammlung ist Eigentum des{' '}
              <strong>Samuel von Pufendorf Gymnasiums Flöha</strong>.
              Lehrer und externe Fachleute haben die Sammlung über Jahrzehnte hinweg
              zusammengetragen und stetig erweitert.
            </p>
            <p className="hp-about-body">
              Im Jahr 2025 wurde im Rahmen einer <em>Komplexen Leistung</em> das Ziel gesetzt,
              diese Sammlung vollständig zu digitalisieren, zu katalogisieren und für Schüler
              und Interessierte zugänglich zu machen.
            </p>
            <p className="hp-about-body">
              Zu dem Zeitpunkt der Sortierung und Digitalisierung befanden sich <em>ca. 600 Gesteine und Mineralien</em> in der Sammlung.
              Von jedem einzelnem Stück wurden in dem Zeitraum von 6 Monaten Fotos angefertigt und Informationen gesammelt, sowie anschließend digitalisiert.
            </p>
             <p className="hp-about-body">
              Außerdem wurden neue Verbindungen zu Unternehmen und Vereinen hergestellt, um die Sammlung fachgerecht lagern und sortieren zu können. 
              Dabei spendete die Firma Lagertechnik.de ein Schwergewichtregal und durch die finanzielle Unterstützung des Födervereins für Nachwuchssport e.V. konnten neue Lagerboxen gekauft werden.              
            </p>
          </div>
        </div>
        

        <div className='wrapper-timeline'>
          <div className='hp-timeline-heading'>Zeitstrahl - Ablauf</div>
          <div className='hp-timeline'>
            <div className='hp-timeline-item'>
              <div className='hp-timeline-date'>August 2025</div>
              <div className='hp-timeline-content'>
                <h3>Ausgangssituation</h3>
                <p>Keine Nummerierungen und wenig Ordnung.</p>
                <Image src={First} alt="Timeline 2025" width={0} height={300} />
              </div>
            </div>
            <div className='hp-timeline-item'>
              <div className='hp-timeline-date'>November 2025</div>
              <div className='hp-timeline-content'>
                <h3>Zwischenstand</h3>
                <p>Vollständige Nummerierung und erste Ordnung.</p>
                <Image src={Second} alt="Timeline 2025" width={0} height={300} />
              </div>
            </div>
            <div className='hp-timeline-item'>
              <div className='hp-timeline-date'>Januar 2026</div>
              <div className='hp-timeline-content'>
                <h3>Erste Boxen</h3>
                <p>Erstmalige Einordnung in Boxen.</p>
                <Image src={Third} alt="Timeline 2025" width={0} height={300} />
              </div>
            </div>
            <div className='hp-timeline-item'>
              <div className='hp-timeline-date'>März 2026</div>
              <div className='hp-timeline-content'>
                <h3>Aufbau des neuen Regals</h3>
                <p>Austauschen des alten Regals mit dem neuen.</p>
                <Image src={Fourth} alt="Timeline 2025" width={0} height={300} />
              </div>
            </div>
            <div className='hp-timeline-item'>
              <div className='hp-timeline-date'>April 2026</div>
              <div className='hp-timeline-content'>
                <h3>Einordnung der Boxen</h3>
                <p>Einräumen der Boxen in das Regal.</p>
                <Image src={Fifth} alt="Timeline 2025" width={0} height={300} />
              </div>
            </div>
            <div className='hp-timeline-item'>
              <div className='hp-timeline-date'>April 2026</div>
              <div className='hp-timeline-content'>
                <h3>Nummerierung der Boxen</h3>
                <p>Vergeben der Nummern für die Boxen.</p>
                <Image src={ShelfImage} alt="Timeline 2025" width={0} height={300} />
              </div>
            </div>
          </div>
        </div>

      </div>

      
      <div className="hp-impressum">
        <div className="container">
          <div className="hp-section-header">
            <div className="hp-section-tag">Impressum</div>
            <h2 className="hp-section-title">Kontakt &amp; Informationen</h2>
          </div>

          <div className="hp-impressum-grid">
            {[
              { init:'MS', name:'Marius Schmieder', role:'Schüler der 10c', mail:'marius-schmieder@gymnasium-floeha.lernsax.de' },
              { init:'CE', name:'Charlie Espig',    role:'Schüler der 10c', mail:'charlie-espig@gymnasium-floeha.lernsax.de' },
              { init:'MB', name:'Manuela Barthel',  role:'Lehrerin — Geografie', mail:'manuela-barthel@gymnasium-floeha.lernsax.de' },
            ].map(p => (
              <div key={p.init} className="hp-imp-card">
                <div className="hp-imp-avatar">{p.init}</div>
                <div>
                  <p className="hp-imp-name">{p.name}</p>
                  <p className="hp-imp-role">{p.role}</p>
                  <a className="hp-imp-mail" href={`mailto:${p.mail}`}>{p.mail}</a>
                </div>
              </div>
            ))}

            <div className="hp-imp-card hp-imp-card--wide">
              <div className="hp-imp-avatar hp-imp-avatar--school">SvP</div>
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
                {['Marius Schmieder','Charlie Espig','Manuela Barthel','Matthias Albrecht','Lagertechnik.de'].map(n => (
                  <span key={n} className="hp-imp-contrib-name">{n}</span>
                ))}
              </div>
            </div>

            <div className="hp-imp-card hp-imp-card--update">
              <p className="hp-imp-contrib-label">Letzte Aktualisierung</p>
              <p className="hp-imp-update-date">
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleDateString('de-DE', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })
                  : 'Wird geladen…'}
              </p>
            </div>
          </div>

          <div className="hp-impressum-links">
            <button className="hp-imp-link" onClick={() => showPage('impressum')}>Vollständiges Impressum</button>
            <button className="hp-imp-link" onClick={() => showPage('quellen')}>Quellen &amp; Literatur</button>
            <button className="hp-imp-link" onClick={() => showPage('kontakt')}>Kontakt &amp; Support</button>
          </div>
        </div>
      </div>
    </section>
  );
}
