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
  const modalOverlayRef = useRef<HTMLDivElement>(null);

  const isUndetermined = !!(mineral as any).is_undetermined;

  const locationCode = (() => {
    if (!mineral.shelf_code) return 'Nicht zugeordnet';
    const base = `${mineral.showcase_code}-${mineral.shelf_code}`;
    if ((mineral as any).section_code) return `${base}-${(mineral as any).section_code}`;
    return base;
  })();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (modalOverlayRef.current && target === modalOverlayRef.current) {
        onClose();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (isImageMaximized) {
      const scrollY = window.scrollY;
      const htmlElement = document.documentElement;
      const originalScrollBehavior = htmlElement.style.scrollBehavior;
      htmlElement.style.scrollBehavior = 'auto';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        htmlElement.style.scrollBehavior = originalScrollBehavior;
      };
    }
  }, [isImageMaximized]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newZoom = Math.min(Math.max(1, zoom + delta), 5);
    if (newZoom === 1) setPosition({ x: 0, y: 0 });
    setZoom(newZoom);
  };

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
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const newDistance = getTouchDistance(e.touches);
      const scale = newDistance / touchDistance;
      const newZoom = Math.min(Math.max(1, zoom * scale), 5);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      setZoom(newZoom);
      setTouchDistance(newDistance);
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      e.preventDefault();
      setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 5));
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 1);
    if (newZoom === 1) setPosition({ x: 0, y: 0 });
    setZoom(newZoom);
  };
  const handleResetZoom = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };

  return (
    <>
      <div ref={modalOverlayRef} className="modal" style={{ display: 'flex' }}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close-button" onClick={onClose}>&times;</span>

          <h2>
            {mineral.name}
            {isUndetermined && (
              <span className="undetermined-badge-inline">Unbestimmt</span>
            )}
          </h2>

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
                <div className="image-zoom-hint">Klicken zum Vergrößern</div>
              </div>
            </div>
          )}

          <div className="detail-info">
            <div className="detail-item">
              <span className="detail-label">Steinnummer:</span>
              <span className="detail-value">{mineral.number}</span>
            </div>

            {!isUndetermined && (
              <>
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
              </>
            )}

            {isUndetermined && mineral.color && (
              <div className="detail-item">
                <span className="detail-label">Farbe:</span>
                <span className="detail-value">{mineral.color}</span>
              </div>
            )}

            <div className="detail-item">
              <span className="detail-label">Standort:</span>
              <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>{locationCode}</span>
                {(mineral as any).section_code && (
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-600)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1px 6px',
                    fontWeight: 500
                  }}>
                    Sektion
                  </span>
                )}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Hinzugefügt:</span>
              <span className="detail-value">
                {new Date(mineral.created_at).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>

          {!isUndetermined && (
            <div style={{ marginTop: '20px' }}>
              <h3>Beschreibung</h3>
              <p style={{ marginTop: '10px', color: '#555', lineHeight: '1.6' }}>
                {mineral.description || 'Keine Beschreibung verfügbar.'}
              </p>
            </div>
          )}

          {isUndetermined && (mineral as any).suspected_name && (
            <div className="suspected-name-detail">
              <span className="suspected-name-label">Vermuteter Name:</span>
              <span className="suspected-name-value">{(mineral as any).suspected_name}</span>
            </div>
          )}

          {isAuthenticated && (
            <div className="admin-buttons">
              <button className="btn btn-secondary" onClick={() => onEdit(mineral)}>
                Bearbeiten
              </button>
              <button className="btn error-btn" onClick={() => onDelete('mineral', mineral.id)}>
                Löschen
              </button>
            </div>
          )}
        </div>
      </div>

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

          <div className="zoom-controls">
            <button className="zoom-btn" onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} disabled={zoom >= 5} title="Vergrößern">+</button>
            <button className="zoom-btn" onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} disabled={zoom <= 1} title="Verkleinern">−</button>
            <button className="zoom-btn" onClick={(e) => { e.stopPropagation(); handleResetZoom(); }} disabled={zoom === 1} title="Zurücksetzen">↺</button>
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
            onClick={(e) => e.stopPropagation()}
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