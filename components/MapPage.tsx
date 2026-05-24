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

  const [mapMinerals, setMapMinerals]       = useState<Mineral[]>([]);
  const [loading, setLoading]               = useState(true);
  const [mapError, setMapError]             = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [visible, setVisible]               = useState(false);

  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstance    = useRef<any>(null);
  const markersRef     = useRef<any[]>([]);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMapVisible = currentPage === 'map';

  const loadAllMinerals = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch('/api/minerals?limit=999999');
      if (r.ok) {
        const data = await r.json();
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
    const t = setTimeout(() => setVisible(true), 60);
    return () => {
      clearTimeout(t);
      cleanupMap();
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
    };
  }, []);

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
      if (existing) { const w = () => window.L ? resolve() : setTimeout(w, 100); w(); return; }
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
      if (!container.clientHeight) {
        container.style.height = `${window.innerHeight - 80}px`;
      }
      const map = window.L.map(container, {
        center: [51.1657, 10.4515], zoom: 6,
        zoomControl: true, attributionControl: true,
      });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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

  const colorMap: Record<string, string> = {
    rot:'#ef4444', blau:'#3b82f6', grün:'#22c55e', gelb:'#eab308',
    schwarz:'#374151', weiß:'#f1f5f9', braun:'#92400e',
    violett:'#7c3aed', grau:'#6b7280', orange:'#f97316',
    rosa:'#ec4899', silber:'#94a3b8',
  };
  const getColor = (c?: string) => colorMap[c?.toLowerCase() ?? ''] ?? '#32353f';

  const updateMarkers = useCallback(() => {
    if (!mapInstance.current || !window.L) return;
    markersRef.current.forEach(m => { try { mapInstance.current.removeLayer(m); } catch {} });
    markersRef.current = [];

    mapMinerals.forEach(mineral => {
      if (!mineral.latitude || !mineral.longitude) return;
      try {
        const col = getColor(mineral.color);
        const icon = window.L.divIcon({
          className: '',
          html: `<div class="mp-dot" style="--c:${col}"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7],
        });
        const marker = window.L.marker([mineral.latitude, mineral.longitude], { icon })
          .addTo(mapInstance.current);

        const imgHtml = mineral.image_path
          ? `<img class="mp-popup-img" src="/uploads/${mineral.image_path}" alt="${mineral.name}" />`
          : `<div class="mp-popup-img mp-popup-img--placeholder">💎</div>`;

        const colorHtml = mineral.color
          ? `<div class="mp-popup-row">
               <span>Farbe</span>
               <span class="mp-popup-row-text">${mineral.color}</span>
             </div>`
          : '';

        const locationHtml = mineral.location
          ? `<div class="mp-popup-row">
               <span>Fundort</span>
               <span class="mp-popup-row-text">${mineral.location}</span>
             </div>`
          : '';

        marker.bindPopup(`
          <div class="mp-popup">
            ${imgHtml}
            <div class="mp-popup-body">
              <p class="mp-popup-name">${mineral.name}</p>
              <p class="mp-popup-nr">Nr. ${mineral.number}</p>
              ${colorHtml}
              ${locationHtml}
              <button class="mp-popup-btn" onclick="window.openMineralDetails(${mineral.id})">Details ansehen</button>
            </div>
          </div>
        `, { maxWidth: 220 });
        markersRef.current.push(marker);
      } catch {}
    });

    window.openMineralDetails = async (id: number) => {
      try {
        const r = await fetch(`/api/minerals/${id}`);
        if (r.ok) { setSelectedMineral(await r.json()); setShowMineralModal(true); }
      } catch {}
    };
  }, [mapMinerals, setSelectedMineral, setShowMineralModal]);

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
        loadStats(); alert('Mineral erfolgreich gelöscht!');
      } else { alert('Fehler beim Löschen: ' + await r.text()); }
    } catch { alert('Fehler beim Löschen.'); }
  };

  if (loading) return (
    <section className="page active mp-root mp-visible">
      <div className="mp-state-screen">
        <div className="mp-spinner" />
        <span>Lade Mineralien…</span>
      </div>
    </section>
  );

  if (mapError) return (
    <section className="page active mp-root mp-visible">
      <div className="mp-state-screen">
        <span className="mp-state-error">{mapError}</span>
        <button className="btn btn-primary" onClick={() => {
          setMapError(null); setMapInitialized(false); initializeLeafletAndMap();
        }}>Erneut versuchen</button>
      </div>
    </section>
  );

  return (
    <>
      <section className={`page active mp-root ${visible ? 'mp-visible' : ''}`}>
        <div className="mp-topbar">
          <div className="mp-topbar-center">
            <h1 className="mp-topbar-title">Fundortkarte</h1>
            <div className="mp-topbar-stats">
              <span className="mp-stat-chip">
                {mapMinerals.length} Fundorte
              </span>
            </div>
          </div>
        </div>

        <div className="mp-map-area">
          {!mapInitialized && (
            <div className="mp-map-init">
              <div className="mp-spinner" />
              <span>Karte wird initialisiert…</span>
            </div>
          )}
          <div ref={mapRef} className="mp-map-canvas" style={{ height: '100%', minHeight: 400 }} />
        </div>

        <div className="mp-attribution">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
          &nbsp;·&nbsp;Einige Fundorte können ungenau sein
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
        .mp-dot {
          width: 14px; height: 14px;
          background: var(--c, #1e40af);
          border: 2px solid rgba(232, 221, 221, 0.9);
          border-radius: 50%;
          transition: transform 0.12s ease;
        }
        .mp-dot:hover { transform: scale(1.4); }

        /* ── Popup shell ── */
        .mp-popup {
          font-family: var(--font-family, system-ui, sans-serif);
          width: 200px;
          overflow: hidden;
        }

        /* ── Preview image ── */
        .mp-popup-img {
          display: block;
          width: 100%;
          height: 110px;
          object-fit: cover;
          border-radius: 6px 6px 0 0;
          margin: -12px -14px 0;
          width: calc(100% + 28px);
        }
        .mp-popup-img--placeholder {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          background: #f1f5f9;
          border-radius: 6px 6px 0 0;
          margin: -12px -14px 0;
          width: calc(100% + 28px);
        }

        /* ── Body ── */
        .mp-popup-body {
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .mp-popup-name {
          font-size: 14px; font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.3;
        }
        .mp-popup-nr {
          font-size: 11px;
          color: #94a3b8;
          margin: 0;
          font-weight: 500;
        }

        /* ── Row: color + location ── */
        .mp-popup-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #475569;
        }
        .mp-popup-swatch {
          width: 12px; height: 12px;
          border-radius: 3px;
          border: 1px solid rgba(0,0,0,0.12);
          flex-shrink: 0;
        }
        .mp-popup-icon {
          font-size: 11px;
          flex-shrink: 0;
          line-height: 1;
        }
        .mp-popup-row-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Button ── */
        .mp-popup-btn {
          margin-top: 8px; width: 100%;
          padding: 7px 0;
          background: var(--primary-color);
          color: #fff; border: none;
          border-radius: 6px; cursor: pointer;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.01em;
          transition: opacity 0.15s;
        }
        .mp-popup-btn:hover { opacity: 0.85; }
      `}</style>
    </>
  );
}