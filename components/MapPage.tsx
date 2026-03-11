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

// Global variable to track Leaflet loading state
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
        const mineralsWithCoords = data.filter((mineral: Mineral) => 
          mineral.latitude && mineral.longitude
        );
        setMapMinerals(mineralsWithCoords);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mineralien:', error);
      setMapError('Fehler beim Laden der Mineralien');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllMinerals();
  }, [loadAllMinerals]);

  useEffect(() => {
    if (isMapVisible && !loading && !mapInitialized) {
      initializeLeafletAndMap();
    }
  }, [isMapVisible, loading, mapInitialized]);

  // Update markers when minerals change and map is ready
  useEffect(() => {
    if (mapInitialized && mapInstance.current && mapMinerals.length > 0) {
      updateMarkers();
    }
  }, [mapMinerals, mapInitialized]);

  useEffect(() => {
    if (!isMapVisible) {
      cleanupMap();
    }
  }, [isMapVisible]);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      cleanupMap();
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  const initializeLeafletAndMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setMapError(null);
      
      // Warte auf Leaflet
      await ensureLeafletLoaded();
      
      // Kurze Verzögerung für DOM readiness
      initTimeoutRef.current = setTimeout(() => {
        createMap();
      }, 150);
      
    } catch (error) {
      console.error('Error initializing Leaflet and Map:', error);
      setMapError('Fehler beim Laden der Karte');
    }
  }, []);

  const ensureLeafletLoaded = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.L) {
        resolve();
        return;
      }

      // CSS laden
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
        const checkLoaded = () => {
          if (window.L) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      script.onload = () => {
        setTimeout(() => {
          if (window.L) {
            resolve();
          } else {
            reject(new Error('Leaflet loaded but L object not available'));
          }
        }, 100);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Leaflet script'));
      };
      
      document.head.appendChild(script);
    });
  };

  const cleanupMap = useCallback(() => {
    try {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }

      markersRef.current.forEach(marker => {
        try {
          if (mapInstance.current) {
            mapInstance.current.removeLayer(marker);
          }
        } catch (e) {
        }
      });
      markersRef.current = [];

      // Map instance entfernen
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        mapInstance.current = null;
      }

      // Reset initialization state
      setMapInitialized(false);
    } catch (error) {
      console.error('Error cleaning up map:', error);
    }
  }, []);

  const createMap = useCallback(() => {
    if (!mapRef.current || !window.L || mapInstance.current) return;

    try {
      cleanupMap();

      const container = mapRef.current;
      container.style.height = '100vh';
      container.style.width = '100%';
      
      const map = window.L.map(container, {
        center: [51.1657, 10.4515],
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false
      });

      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });
      
      tileLayer.addTo(map);
      mapInstance.current = map;

      map.whenReady(() => {
        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
            setMapInitialized(true);
          }
        }, 100);
      });

    } catch (error) {
      console.error('Error creating map:', error);
      setMapError('Fehler beim Erstellen der Karte');
    }
  }, [cleanupMap]);

  const updateMarkers = useCallback(() => {
    if (!mapInstance.current || !window.L) {
      console.log('Map not ready for markers');
      return;
    }

    try {
      markersRef.current.forEach(marker => {
        try {
          mapInstance.current.removeLayer(marker);
        } catch (e) {
        }
      });
      markersRef.current = [];

      console.log('Adding markers for', mapMinerals.length, 'minerals');

      mapMinerals.forEach(mineral => {
        if (mineral.latitude && mineral.longitude) {
          try {
            const iconColor = getColorForMineral(mineral.color);
            const customIcon = window.L.divIcon({
              className: 'custom-mineral-marker',
              html: `<div style="
                width: 20px; 
                height: 20px; 
                background-color: ${iconColor}; 
                border: 2px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
              ">💎</div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            const marker = window.L.marker([mineral.latitude, mineral.longitude], {
              icon: customIcon
            }).addTo(mapInstance.current);

            const popupContent = `
              <div style="padding: 10px; max-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">${mineral.name}</h3>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Nummer:</strong> ${mineral.number}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Farbe:</strong> ${mineral.color || 'Nicht angegeben'}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Fundort:</strong> ${mineral.location || 'Unbekannt'}</p>
                <button 
                  onclick="window.openMineralDetails(${mineral.id})" 
                  style="margin-top: 8px; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                >
                  Details anzeigen
                </button>
              </div>
            `;

            marker.bindPopup(popupContent);
            markersRef.current.push(marker);
          } catch (error) {
            console.error('Error creating marker for mineral:', mineral.id, error);
          }
        }
      });

      window.openMineralDetails = async (id: number) => {
        try {
          const response = await fetch(`/api/minerals/${id}`);
          if (response.ok) {
            const mineral = await response.json();
            setSelectedMineral(mineral);
            setShowMineralModal(true);
          }
        } catch (error) {
          console.error('Fehler beim Laden der Mineral-Details:', error);
        }
      };

      console.log('Successfully added', markersRef.current.length, 'markers');
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [mapMinerals, setSelectedMineral, setShowMineralModal]);

  const getColorForMineral = (color?: string) => {
    const colorMap: { [key: string]: string } = {
      'rot': '#ff4444',
      'blau': '#4444ff',
      'grün': '#44ff44',
      'gelb': '#ffff44',
      'schwarz': '#444444',
      'weiß': '#ffffff',
      'braun': '#8b4513',
      'violett': '#8b44ff',
      'grau': '#888888'
    };
    
    return colorMap[color?.toLowerCase() || ''] || '#666666';
  };

  const handleEditMineral = (mineral: Mineral) => {
    setEditFormData({
      id: mineral.id,
      name: mineral.name,
      number: mineral.number,
      color: mineral.color || '',
      description: mineral.description || '',
      location: mineral.location || '',
      purchase_location: mineral.purchase_location || '',
      rock_type: mineral.rock_type || '',
      shelf_id: mineral.shelf_id || '',
      latitude: mineral.latitude || null,
      longitude: mineral.longitude || null
    });
    setEditMode('mineral');
    setEditImage(null);
  };

  const handleDelete = async (type: 'mineral', id: number) => {
    if (!confirm('Möchten Sie dieses Mineral wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/minerals/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowMineralModal(false);
        setSelectedMineral(null);
        
        await loadAllMinerals();
        
        const mineralsResponse = await fetch('/api/minerals?limit=999999');
        if (mineralsResponse.ok) {
          const data = await mineralsResponse.json();
          setMinerals(data);
        }
        
        loadStats();
        alert('Mineral erfolgreich gelöscht!');
      } else {
        const responseData = await response.text();
        alert('Fehler beim Löschen: ' + responseData);
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen. Bitte versuchen Sie es erneut.');
    }
  };

  if (loading) {
    return (
      <section className="page active">
        <div className="container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            fontSize: '18px',
            color: '#666'
          }}>
            Lade Mineralien...
          </div>
        </div>
      </section>
    );
  }

  if (mapError) {
    return (
      <section className="page active">
        <div className="container">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            fontSize: '18px',
            color: '#ff4444',
            textAlign: 'center'
          }}>
            <div>{mapError}</div>
            <button 
              onClick={() => {
                setMapError(null);
                setMapInitialized(false);
                initializeLeafletAndMap();
              }}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page active">
        <div className="container" style={{ height: '100vh', padding: 0, position: 'relative' }}>
          <div className='map_info_popup'>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Fundorte der Mineralien</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              {mapMinerals.length} Mineralien mit Koordinaten gefunden. Einige Fundorte könnnen ungenau sein oder nicht exakt übereinstimmen.
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
              Powered by OpenStreetMap
            </p>
          </div>
          
          <div 
            ref={mapRef} 
            style={{ 
              width: '100%', 
              height: '100vh',
              borderRadius: '0',
              zIndex: 1,
              backgroundColor: '#f0f0f0'
            }}
          />
          
          {!mapInitialized && !mapError && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 1001,
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
                Karte wird initialisiert...
              </div>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 2s linear infinite',
                margin: '0 auto'
              }} />
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}