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
  currentPage
}: MapPageProps) {

  const [mapMinerals, setMapMinerals] = useState<Mineral[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isMapVisible = currentPage === 'map';
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadAllMinerals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/minerals?limit=999999');
      if (response.ok) {
        const data = await response.json();
        setMapMinerals(data.filter((m: Mineral) => m.latitude && m.longitude));
      }
    } catch (error) {
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
    return () => {
      cleanupMap();
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
    };
  }, []);

  const initializeLeafletAndMap = useCallback(async () => {
    if (!mapRef.current) return;
    try {
      setMapError(null);
      await ensureLeafletLoaded();
      initTimeoutRef.current = setTimeout(() => { createMap(); }, 150);
    } catch (error) {
      setMapError('Fehler beim Laden der Karte');
    }
  }, []);

  const ensureLeafletLoaded = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.L) { resolve(); return; }

      if (!document.querySelector('link[href*="leaflet"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);
      }

      const existingScript = document.querySelector('script[src*="leaflet"]');
      if (existingScript) {
        const check = () => { window.L ? resolve() : setTimeout(check, 100); };
        check();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => setTimeout(() => window.L ? resolve() : reject(new Error('L not available')), 100);
      script.onerror = () => reject(new Error('Failed to load Leaflet'));
      document.head.appendChild(script);
    });
  };

  const cleanupMap = useCallback(() => {
    try {
      if (initTimeoutRef.current) { clearTimeout(initTimeoutRef.current); initTimeoutRef.current = null; }
      markersRef.current.forEach(marker => {
        try { if (mapInstance.current) mapInstance.current.removeLayer(marker); } catch {}
      });
      markersRef.current = [];
      if (mapInstance.current) {
        try { mapInstance.current.remove(); } catch {}
        mapInstance.current = null;
      }
      setMapInitialized(false);
    } catch {}
  }, []);

  const createMap = useCallback(() => {
    if (!mapRef.current || !window.L || mapInstance.current) return;
    try {
      cleanupMap();
      const container = mapRef.current;
      container.style.height = '100vh';
      container.style.width = '100%';
      const map = window.L.map(container, { center: [51.1657, 10.4515], zoom: 6, zoomControl: true, attributionControl: true, preferCanvas: false });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      mapInstance.current = map;
      map.whenReady(() => {
        setTimeout(() => { if (mapInstance.current) { mapInstance.current.invalidateSize(); setMapInitialized(true); } }, 100);
      });
    } catch {
      setMapError('Fehler beim Erstellen der Karte');
    }
  }, [cleanupMap]);

  const updateMarkers = useCallback(() => {
    if (!mapInstance.current || !window.L) return;
    try {
      markersRef.current.forEach(marker => { try { mapInstance.current.removeLayer(marker); } catch {} });
      markersRef.current = [];

      mapMinerals.forEach(mineral => {
        if (mineral.latitude && mineral.longitude) {
          try {
            const iconColor = getColorForMineral(mineral.color);
            const customIcon = window.L.divIcon({
              className: 'custom-mineral-marker',
              html: `<div style="width:18px;height:18px;background:${iconColor};border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.25);"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            });

            const marker = window.L.marker([mineral.latitude, mineral.longitude], { icon: customIcon }).addTo(mapInstance.current);
            marker.bindPopup(`
              <div style="padding:10px;max-width:200px;font-family:Inter,sans-serif;">
                <p style="margin:0 0 6px;font-weight:600;font-size:15px;color:#0f172a;">${mineral.name}</p>
                <p style="margin:3px 0;font-size:13px;color:#475569;"><strong>Nr.</strong> ${mineral.number}</p>
                <p style="margin:3px 0;font-size:13px;color:#475569;"><strong>Farbe:</strong> ${mineral.color || '—'}</p>
                <p style="margin:3px 0;font-size:13px;color:#475569;"><strong>Fundort:</strong> ${mineral.location || 'Unbekannt'}</p>
                <button onclick="window.openMineralDetails(${mineral.id})" style="margin-top:8px;padding:5px 12px;background:#1e40af;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-family:Inter,sans-serif;">
                  Details
                </button>
              </div>
            `);
            markersRef.current.push(marker);
          } catch {}
        }
      });

      window.openMineralDetails = async (id: number) => {
        try {
          const response = await fetch(`/api/minerals/${id}`);
          if (response.ok) {
            setSelectedMineral(await response.json());
            setShowMineralModal(true);
          }
        } catch {}
      };
    } catch {}
  }, [mapMinerals, setSelectedMineral, setShowMineralModal]);

  const getColorForMineral = (color?: string) => {
    const map: { [k: string]: string } = {
      'rot': '#ef4444', 'blau': '#3b82f6', 'grün': '#22c55e',
      'gelb': '#eab308', 'schwarz': '#374151', 'weiß': '#e2e8f0',
      'braun': '#92400e', 'violett': '#7c3aed', 'grau': '#6b7280'
    };
    return map[color?.toLowerCase() || ''] || '#1e40af';
  };

  const handleEditMineral = (mineral: Mineral) => {
    setEditFormData({ id: mineral.id, name: mineral.name, number: mineral.number, color: mineral.color || '', description: mineral.description || '', location: mineral.location || '', purchase_location: mineral.purchase_location || '', rock_type: mineral.rock_type || '', shelf_id: mineral.shelf_id || '', latitude: mineral.latitude || null, longitude: mineral.longitude || null });
    setEditMode('mineral');
    setEditImage(null);
  };

  const handleDelete = async (type: 'mineral', id: number) => {
    if (!confirm('Möchten Sie dieses Mineral wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/minerals/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setShowMineralModal(false);
        setSelectedMineral(null);
        await loadAllMinerals();
        const r = await fetch('/api/minerals?limit=999999');
        if (r.ok) setMinerals(await r.json());
        loadStats();
        alert('Mineral erfolgreich gelöscht!');
      } else {
        alert('Fehler beim Löschen: ' + await response.text());
      }
    } catch {
      alert('Fehler beim Löschen. Bitte erneut versuchen.');
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <section className="page active">
        <div className="cp-fullscreen-state">
          <div className="cp-loading">Lade Mineralien …</div>
        </div>
      </section>
    );
  }

  /* ── Error state ── */
  if (mapError) {
    return (
      <section className="page active">
        <div className="cp-fullscreen-state">
          <p className="cp-error-text">{mapError}</p>
          <button
            className="cp-btn-ghost"
            onClick={() => { setMapError(null); setMapInitialized(false); initializeLeafletAndMap(); }}
          >
            Erneut versuchen
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page active">
        <div style={{ height: '100vh', padding: 0, position: 'relative' }}>

          {/* Info panel */}
          <div className="map-info-panel">
            <p className="map-info-title">Fundorte</p>
            <p className="map-info-body">
              {mapMinerals.length} Mineralien mit Koordinaten.
              Einige Fundorte können ungenau sein.
            </p>
            <p className="map-info-credit">OpenStreetMap</p>
          </div>

          {/* Map container */}
          <div
            ref={mapRef}
            style={{ width: '100%', height: '100vh', zIndex: 1, backgroundColor: '#e8eef5' }}
          />

          {/* Initialization overlay */}
          {!mapInitialized && !mapError && (
            <div className="map-init-overlay">
              <p className="cp-loading">Karte wird geladen …</p>
              <div className="map-spinner" />
            </div>
          )}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
