import React, { useEffect, useRef, useState } from 'react';

interface MapSelectorProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function MapSelector({ latitude, longitude, onLocationSelect }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const loadLeaflet = () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);
      }

      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => {
          setMapLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setMapLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstance.current && window.L) {
      initializeMap();
    }
  }, [mapLoaded]);

  useEffect(() => {
    if (mapInstance.current && mapLoaded) {
      if (latitude && longitude && latitude !== 0 && longitude !== 0) {
        updateMarker(latitude, longitude);
      } else if (latitude === 0 || longitude === 0 || !latitude || !longitude) {
        clearMarker();
      }
    }
  }, [latitude, longitude, mapLoaded]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;

    const initialLat = (latitude && longitude && latitude !== 0 && longitude !== 0) ? latitude : 51.1657;
    const initialLng = (latitude && longitude && latitude !== 0 && longitude !== 0) ? longitude : 10.4515;
    const initialZoom = (latitude && longitude && latitude !== 0 && longitude !== 0) ? 12 : 6;

    const map = window.L.map(mapRef.current).setView(
      [initialLat, initialLng],
      initialZoom
    );

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstance.current = map;

    map.on('click', (event: any) => {
      const lat = event.latlng.lat;
      const lng = event.latlng.lng;
      updateMarker(lat, lng);
      onLocationSelect(lat, lng);
    });

    if (latitude && longitude && latitude !== 0 && longitude !== 0) {
      updateMarker(latitude, longitude);
    }
  };

  const updateMarker = (lat: number, lng: number) => {
    if (!mapInstance.current || !window.L) return;

    if (markerRef.current) {
      mapInstance.current.removeLayer(markerRef.current);
    }

    const marker = window.L.marker([lat, lng], {
      draggable: true
    }).addTo(mapInstance.current);

    marker.bindPopup(`
      <div style="text-align: center;">
        <strong>Fundort</strong><br>
        <small>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}</small>
      </div>
    `).openPopup();

    marker.on('dragend', (event: any) => {
      const newLat = event.target.getLatLng().lat;
      const newLng = event.target.getLatLng().lng;
      
      marker.setPopupContent(`
        <div style="text-align: center;">
          <strong>Fundort</strong><br>
          <small>Lat: ${newLat.toFixed(6)}<br>Lng: ${newLng.toFixed(6)}</small>
        </div>
      `);
      
      onLocationSelect(newLat, newLng);
    });

    markerRef.current = marker;

    mapInstance.current.setView([lat, lng], Math.max(mapInstance.current.getZoom(), 12), {
      animate: true,
      duration: 0.5
    });
  };

  const clearMarker = () => {
    if (markerRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  const clearLocation = () => {
    clearMarker();
    // Signal that coordinates should be cleared (using 0 as the clear signal)
    onLocationSelect(0, 0);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ width: '100%', height: '300px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
        {!mapLoaded && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: '#f5f5f5',
            borderRadius: '4px'
          }}>
            Karte wird geladen...
          </div>
        )}
      </div>
      
      {mapLoaded && (
        <div style={{ 
          marginTop: '8px', 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <span>Tipp: Klicken Sie auf die Karte oder ziehen Sie den Marker</span>
          {latitude && longitude && latitude !== 0 && longitude !== 0 && (
            <button
              type="button"
              onClick={clearLocation}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Position löschen
            </button>
          )}
        </div>
      )}
    </div>
  );
}