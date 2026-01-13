import React, { useEffect, useRef } from 'react';
import { Mineral } from '../types';

interface BoxModalProps {
  box: any;
  minerals: Mineral[];
  isAuthenticated: boolean;
  onClose: () => void;
  onEdit: (box: any) => void;
  onDelete: (type: 'shelf', id: number) => void;
  onOpenMineralDetails: (id: number) => void;
  setShowBoxModal: (show: boolean) => void;
}

export default function BoxModal({ 
  box, 
  minerals,
  isAuthenticated, 
  onClose, 
  onEdit, 
  onDelete,
  onOpenMineralDetails,
  setShowBoxModal
}: BoxModalProps) {

  const modalOverlayRef = useRef<HTMLDivElement>(null);

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

  const handleMineralClick = (id: number) => {
    setShowBoxModal(false);
    onOpenMineralDetails(id);
  };

  return (
    <div className="modal-overlay-new" ref={modalOverlayRef}>
      <div className="modal-container-new modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-new" onClick={onClose}>×</button>
        
        <div className="modal-header-new">
          <div className="modal-code">{box.full_code}</div>
          <h2 className="modal-title">{box.name}</h2>
        </div>

        {box.image_path && (
          <div className="modal-image-new">
            <img src={`/uploads/${box.image_path}`} alt={box.name} loading="lazy" />
          </div>
        )}

        {box.description && (
          <div className="modal-description">{box.description}</div>
        )}

        {isAuthenticated && (
          <div className="modal-actions">
            <button className="btn-new btn-secondary-new" onClick={() => onEdit(box)}>
              Bearbeiten
            </button>
            <button className="btn-new btn-danger-new" onClick={() => onDelete('shelf', box.id)}>
              Löschen
            </button>
          </div>
        )}

        <>
          <div className="modal-section-divider"></div>
          <div className="modal-section-title">
            Mineralien in dieser Box ({minerals.length})
          </div>
        </>

        {minerals.length === 0 ? (
          <div className="empty-state-small">
            <div className="empty-icon-small">□</div>
            <p>Keine Mineralien in dieser Box</p>
          </div>
        ) : (
          <div className="minerals-grid-modal">
            {minerals.map(mineral => (
              <div 
                key={mineral.id} 
                className="mineral-card-modal"
                onClick={() => handleMineralClick(mineral.id)}
              >
                <div className="mineral-card-image">
                  {mineral.image_path ? (
                    <img 
                      src={`/uploads/${mineral.image_path}`} 
                      alt={mineral.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="mineral-placeholder">□</div>
                  )}
                </div>
                <div className="mineral-card-content">
                  <div className="mineral-card-name">{mineral.name}</div>
                  <div className="mineral-card-meta">
                    <span>Nr. {mineral.number}</span>
                    {mineral.color && <span>{mineral.color}</span>}
                  </div>
                  {mineral.location && (
                    <div className="mineral-card-location">{mineral.location}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}