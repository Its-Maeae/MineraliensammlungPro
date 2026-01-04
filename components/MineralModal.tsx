import React, { useState, useEffect, useRef } from 'react';
import { Mineral } from '../types';

interface MineralModalProps {
  mineral: Mineral;
  isAuthenticated: boolean;
  onClose: () => void;
  onEdit: (mineral: Mineral) => void;
  onDelete: (type: 'mineral', id: number) => void;
}

export default function MineralModal({ mineral, isAuthenticated, onClose, onEdit, onDelete }: MineralModalProps) {
  const [isImageMaximized, setIsImageMaximized] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Verhindere Scrollen im Hintergrund, wenn Bild maximiert ist
  useEffect(() => {
    if (isImageMaximized) {
      // Verhindere Scroll auf body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Reset zoom und position beim Öffnen
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isImageMaximized]);

  // Zoom mit Mausrad (Desktop)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? -0.2 : 0.2; // 20% Schritte
    const newZoom = Math.min(Math.max(1, zoom + delta), 5);
    
    // Wenn zurück auf Zoom 1, zentriere das Bild
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
    
    setZoom(newZoom);
  };

  // Touch-Events für Pinch-Zoom (Mobile)
  const [touchDistance, setTouchDistance] = useState(0);

  const getTouchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setTouchDistance(getTouchDistance(e.touches));
    } else if (e.touches.length === 1 && zoom > 1) {
      // Dragging vorbereiten
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const newDistance = getTouchDistance(e.touches);
      const scale = newDistance / touchDistance;
      const newZoom = Math.min(Math.max(1, zoom * scale), 5);
      
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      
      setZoom(newZoom);
      setTouchDistance(newDistance);
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      e.preventDefault();
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Maus-Dragging (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom-Buttons
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.2, 5); // 20% Schritte
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 1); // 20% Schritte
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <>
      <div className="modal" style={{ display: 'flex' }}>
        <div className="modal-content">
          <span className="close-button" onClick={onClose}>&times;</span>
          <h2>{mineral.name}</h2>
          
          {mineral.image_path && (
            <div className="detail-image">
              <div>
                <img 
                  src={`/uploads/${mineral.image_path}`} 
                  alt={mineral.name}
                  onClick={() => setIsImageMaximized(true)}
                  style={{ cursor: 'pointer' }}
                  title="Klicken zum Vergrößern"
                />
                <div className="image-zoom-hint">
                  Klicken zum Vergrößern
                </div>
              </div>
            </div>
          )}
          
          <div className="detail-info">
            <div className="detail-item">
              <span className="detail-label">Steinnummer:</span>
              <span className="detail-value">{mineral.number}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Farbe:</span>
              <span className="detail-value">{mineral.color || 'Nicht angegeben'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fundort:</span>
              <span className="detail-value">{mineral.location || 'Unbekannt'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Kaufort:</span>
              <span className="detail-value">{mineral.purchase_location || 'Nicht angegeben'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Gesteinsart:</span>
              <span className="detail-value">{mineral.rock_type || 'Nicht angegeben'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Regal:</span>
              <span className="detail-value">
                {mineral.shelf_code 
                  ? `${mineral.showcase_code}-${mineral.shelf_code}` 
                  : 'Nicht zugeordnet'
                }
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hinzugefügt:</span>
              <span className="detail-value">
                {new Date(mineral.created_at).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h3>Beschreibung</h3>
            <p style={{ marginTop: '10px', color: '#555', lineHeight: '1.6' }}>
              {mineral.description || 'Keine Beschreibung verfügbar.'}
            </p>
          </div>

          {isAuthenticated && (
            <div className="admin-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => onEdit(mineral)}
              >
                Bearbeiten
              </button>
              <button 
                className="btn error-btn"
                onClick={() => onDelete('mineral', mineral.id)}
              >
                Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Maximiertes Bild mit Zoom */}
      {isImageMaximized && mineral.image_path && (
        <div 
          ref={containerRef}
          className="image-maximized-overlay"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            touchAction: 'none'
          }}
        >
          <button 
            className="image-maximized-close"
            onClick={() => setIsImageMaximized(false)}
            aria-label="Schließen"
          >
            ✕
          </button>
          
          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button 
              className="zoom-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoom >= 5}
              title="Vergrößern"
            >
              +
            </button>
            <button 
              className="zoom-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoom <= 1}
              title="Verkleinern"
            >
              −
            </button>
            <button 
              className="zoom-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
              }}
              disabled={zoom === 1}
              title="Zurücksetzen"
            >
              ↺
            </button>
            <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
          </div>

          <img 
            ref={imageRef}
            src={`/uploads/${mineral.image_path}`} 
            alt={mineral.name}
            className="image-maximized"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            draggable={false}
          />
          
          {zoom > 1 && (
            <div className="zoom-hint">
              {window.innerWidth > 768 
                ? 'Mausrad zum Zoomen • Ziehen zum Verschieben' 
                : 'Pinch zum Zoomen • Ziehen zum Verschieben'}
            </div>
          )}
        </div>
      )}
    </>
  );
}