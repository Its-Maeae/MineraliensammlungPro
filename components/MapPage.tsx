import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mineral } from '../types';
import MineralModal from './MineralModal';

interface MapPageProps {
  isAuthenticated: boolean;
  selectedMineral: Mineral | null;
  setSelectedMineral: (mineral: Mineral | null) => void;
  showMineralModal: boolean;
  setShowMineralModal: (show: boolean) => void;
  editMode: 'mineral' | 'showcase' | 'shelf' | null;
  setEditMode: (mode: 'mineral' | 'showcase' | 'shelf' | null) => void;
  editFormData: any;
  setEditFormData: (data: any) => void;
  editImage: File | null;
  setEditImage: (image: File | null) => void;
  shelves: any[];
  loadStats: () => void;
  setMinerals: (minerals: Mineral[]) => void;
  currentPage: string;
}

declare global {
  interface Window {
    L: any;
    openMineralDetails: (id: number) => Promise<void>;
  }
}

export default function MapPage({
  isAuthenticated,
  selectedMineral,
  setSelectedMineral,
  showMineralModal,
  setShowMineralModal,
  editMode,
  setEditMode,
  editFormData,
  setEditFormData,
  editImage,
  setEditImage,
  shelves,
  loadStats,
  setMinerals,
  currentPage,
}: MapPageProps) {

  const [mapMinerals, setMapMinerals]   = useState<Mineral[]>([]);
  const [loading, setLoading]           = useState(true);
  const [mapError, setMapError]         = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [visible, setVisible]           = useState(false);

  const mapRef        = useRef<HTMLDivElement>(null);
  const mapInstance   = useRef<any>(null);
  const markersRef    = useRef<any[]>([]);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMapVisible = currentPage === 'map';

  /* ── Load minerals ── */
  const loadAllMinerals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/minerals?limit=999999');
      if (response.ok) {
        const data = await response.json();
        setMapMinerals(data.filter((m: Mineral) => m.latitude && m.longitude));
      }
    } catch {
      setMapError('Fehler beim Laden der Mineralien');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAllMinerals(); }, [loadAllMinerals]);

  useEffect(() => {
    if (isMapVisible && !loading && !mapInitialized) initializeLeafletAndMap();
  }, [isMapVisible, loading, mapInitialized]);

  useEffect(() => {
    if (mapInitialized && mapInstance.current && mapMinerals.length > 0) updateMarkers();
  }, [mapMinerals, mapInitialized]);

  useEffect(() => {
    if (!isMapVisible) cleanupMap();
  }, [isMapVisible]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => {
      clearTimeout(t);
      cleanupMap();
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
    };
  }, []);

  /* ── Leaflet bootstrap ── */
  const ensureLeafletLoaded = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (window.L) { resolve(); return; }
      if (!document.querySelector('link[href*="leaflet"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        css.crossOrigin = '';
        document.head.appendChild(css);
      }
      const existing = document.querySelector('script[src*="leaflet"]');
      if (existing) {
        const wait = () => window.L ? resolve() : setTimeout(wait, 100);
        wait(); return;
      }
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      s.crossOrigin = '';
      s.onload = () => setTimeout(() => window.L ? resolve() : reject(new Error('L not available')), 100);
      s.onerror = () => reject(new Error('Leaflet script failed'));
      document.head.appendChild(s);
    });

  const cleanupMap = useCallback(() => {
    if (initTimeoutRef.current) { clearTimeout(initTimeoutRef.current); initTimeoutRef.current = null; }
    markersRef.current.forEach(m => { try { mapInstance.current?.removeLayer(m); } catch {} });
    markersRef.current = [];
    if (mapInstance.current) { try { mapInstance.current.remove(); } catch {} mapInstance.current = null; }
    setMapInitialized(false);
  }, []);

  const initializeLeafletAndMap = useCallback(async () => {
    if (!mapRef.current) return;
    try {
      setMapError(null);
      await ensureLeafletLoaded();
      initTimeoutRef.current = setTimeout(createMap, 150);
    } catch {
      setMapError('Fehler beim Laden der Karte');
    }
  }, []);

  const createMap = useCallback(() => {
    if (!mapRef.current || !window.L || mapInstance.current) return;
    try {
      cleanupMap();
      const container = mapRef.current;
      const map = window.L.map(container, {
        center: [51.1657, 10.4515], zoom: 6,
        zoomControl: true, attributionControl: true, preferCanvas: false,
      });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      mapInstance.current = map;
      map.whenReady(() => {
        setTimeout(() => { if (mapInstance.current) { mapInstance.current.invalidateSize(); setMapInitialized(true); } }, 100);
      });
    } catch {
      setMapError('Fehler beim Erstellen der Karte');
    }
  }, [cleanupMap]);

  /* ── Markers ── */
  const getColorForMineral = (color?: string) => {
    const map: Record<string, string> = {
      rot: '#ef4444', blau: '#3b82f6', grün: '#22c55e', gelb: '#eab308',
      schwarz: '#374151', weiß: '#e2e8f0', braun: '#92400e',
      violett: '#7c3aed', grau: '#6b7280', orange: '#f97316',
      rosa: '#ec4899', silber: '#94a3b8',
    };
    return map[color?.toLowerCase() ?? ''] ?? '#1e40af';
  };

  const updateMarkers = useCallback(() => {
    if (!mapInstance.current || !window.L) return;
    try {
      markersRef.current.forEach(m => { try { mapInstance.current.removeLayer(m); } catch {} });
      markersRef.current = [];

      mapMinerals.forEach(mineral => {
        if (!mineral.latitude || !mineral.longitude) return;
        try {
          const col = getColorForMineral(mineral.color);
          const icon = window.L.divIcon({
            className: 'mp-marker',
            html: `<div class="mp-marker-dot" style="background:${col}">💎</div>`,
            iconSize: [22, 22], iconAnchor: [11, 11],
          });
          const marker = window.L.marker([mineral.latitude, mineral.longitude], { icon })
            .addTo(mapInstance.current);
          marker.bindPopup(`
            <div class="mp-popup">
              <p class="mp-popup-name">${mineral.name}</p>
              <p class="mp-popup-row"><span>Nr.</span> ${mineral.number}</p>
              <p class="mp-popup-row"><span>Farbe</span> ${mineral.color || '—'}</p>
              <p class="mp-popup-row"><span>Fundort</span> ${mineral.location || '—'}</p>
              <button class="mp-popup-btn" onclick="window.openMineralDetails(${mineral.id})">Details</button>
            </div>
          `);
          markersRef.current.push(marker);
        } catch {}
      });

      window.openMineralDetails = async (id: number) => {
        try {
          const r = await fetch(`/api/minerals/${id}`);
          if (r.ok) { setSelectedMineral(await r.json()); setShowMineralModal(true); }
        } catch {}
      };
    } catch {}
  }, [mapMinerals, setSelectedMineral, setShowMineralModal]);

  /* ── Edit / Delete ── */
  const handleEditMineral = (mineral: Mineral) => {
    setEditFormData({
      id: mineral.id, name: mineral.name, number: mineral.number,
      color: mineral.color || '', description: mineral.description || '',
      location: mineral.location || '', purchase_location: mineral.purchase_location || '',
      rock_type: mineral.rock_type || '', shelf_id: mineral.shelf_id || '',
      latitude: mineral.latitude || null, longitude: mineral.longitude || null,
    });
    setEditMode('mineral');
    setEditImage(null);
  };

  const handleDelete = async (type: 'mineral', id: number) => {
    if (!confirm('Möchten Sie dieses Mineral wirklich löschen?')) return;
    try {
      const r = await fetch(`/api/minerals/${id}`, { method: 'DELETE' });
      if (r.ok) {
        setShowMineralModal(false); setSelectedMineral(null);
        await loadAllMinerals();
        const all = await fetch('/api/minerals?limit=999999');
        if (all.ok) setMinerals(await all.json());
        loadStats();
        alert('Mineral erfolgreich gelöscht!');
      } else {
        alert('Fehler beim Löschen: ' + await r.text());
      }
    } catch { alert('Fehler beim Löschen.'); }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <section className="page active">
        <div className="mp-loading-screen">
          <div className="mp-loading-spinner" />
          <p className="mp-loading-text">Lade Mineralien…</p>
        </div>
      </section>
    );
  }

  /* ── Error state ── */
  if (mapError) {
    return (
      <section className="page active">
        <div className="mp-loading-screen">
          <p className="mp-error-text">{mapError}</p>
          <button className="hp-btn hp-btn--primary" onClick={() => {
            setMapError(null); setMapInitialized(false); initializeLeafletAndMap();
          }}>
            Erneut versuchen
          </button>
        </div>
      </section>
    );
  }

  /* ── Main render ── */
  return (
    <>
      <section className={`page active mp-root ${visible ? 'mp-visible' : ''}`}>

        {/* ── Header bar ── */}
        <div className="mp-header">
          <div className="mp-header-inner container">
            <div className="mp-header-text">
              <div className="hp-section-tag">Interaktiv</div>
              <h1 className="mp-title">Fundorte der Mineralien</h1>
              <p className="mp-subtitle">
                {mapMinerals.length} Mineral{mapMinerals.length !== 1 ? 'ien' : ''} mit
                verorteten Fundorten · Klick auf einen Marker für Details
              </p>
            </div>

            {/* Stats pills */}
            <div className="mp-pills">
              <div className="mp-pill">
                <span className="mp-pill-value">{mapMinerals.length}</span>
                <span className="mp-pill-label">Verortete Funde</span>
              </div>
              <div className="mp-pill">
                <span className="mp-pill-value">
                  {new Set(mapMinerals.map(m => m.location).filter(Boolean)).size}
                </span>
                <span className="mp-pill-label">Fundorte</span>
              </div>
              <div className="mp-pill">
                <span className="mp-pill-value">
                  {new Set(mapMinerals.map(m => m.name)).size}
                </span>
                <span className="mp-pill-label">Mineralarten</span>
              </div>
            </div>
          </div>

          {/* Decorative crystal shapes */}
          <div className="mp-header-deco" aria-hidden>
            <svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <polygon points="340,10 370,55 340,100 310,55" stroke="rgba(30,64,175,0.18)" strokeWidth="1.2" fill="rgba(30,64,175,0.05)" />
              <polygon points="370,5 390,30 370,55 350,30" stroke="rgba(14,165,233,0.14)" strokeWidth="1" fill="rgba(14,165,233,0.04)" />
              <polygon points="280,60 305,85 280,110 255,85" stroke="rgba(30,64,175,0.12)" strokeWidth="1" fill="rgba(30,64,175,0.03)" />
              <line x1="330" y1="0" x2="320" y2="120" stroke="rgba(30,64,175,0.1)" strokeWidth="1" strokeDasharray="5 8" />
            </svg>
          </div>
        </div>

        {/* ── Map area ── */}
        <div className="mp-map-wrapper">

          {/* Initializing overlay */}
          {!mapInitialized && !mapError && (
            <div className="mp-map-overlay-init">
              <div className="mp-loading-spinner" />
              <p className="mp-loading-text">Karte wird initialisiert…</p>
            </div>
          )}

          {/* Hint badge */}
          {mapInitialized && (
            <div className="mp-hint-badge">
              <span>📍</span>
              <span>Marker anklicken für Details</span>
            </div>
          )}

          <div ref={mapRef} className="mp-map-canvas" />
        </div>

        {/* ── Footer note ── */}
        <div className="mp-footer-note">
          <span>Kartendaten © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>-Mitwirkende</span>
          <span className="mp-footer-dot">·</span>
          <span>Einige Fundorte können ungenau sein</span>
        </div>

      </section>

      {showMineralModal && selectedMineral && (
        <MineralModal
          mineral={selectedMineral}
          isAuthenticated={isAuthenticated}
          onClose={() => setShowMineralModal(false)}
          onEdit={handleEditMineral}
          onDelete={handleDelete}
        />
      )}

      <style>{`
        .mp-marker-dot {
          width: 22px; height: 22px;
          border: 2.5px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          transition: transform 0.15s ease;
        }
        .mp-marker-dot:hover { transform: scale(1.25); }
        .mp-popup {
          font-family: var(--font-family, sans-serif);
          min-width: 180px;
          padding: 4px 0;
        }
        .mp-popup-name {
          font-size: 15px; font-weight: 700;
          color: #0f172a; margin-bottom: 8px;
          border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;
        }
        .mp-popup-row {
          font-size: 13px; color: #475569;
          margin: 3px 0; display: flex; gap: 6px;
        }
        .mp-popup-row span {
          font-weight: 600; color: #1e40af; min-width: 56px;
        }
        .mp-popup-btn {
          margin-top: 10px; width: 100%;
          padding: 7px 0;
          background: linear-gradient(135deg,#1e40af,#3b82f6);
          color: white; border: none;
          border-radius: 6px; cursor: pointer;
          font-size: 13px; font-weight: 600;
          transition: opacity 0.15s;
        }
        .mp-popup-btn:hover { opacity: 0.88; }
      `}</style>
    </>
  );
}