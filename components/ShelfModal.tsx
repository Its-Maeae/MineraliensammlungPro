import React, { useEffect, useRef } from 'react';

interface ShelfModalProps {
  shelf: any;
  isAuthenticated: boolean;
  onClose: () => void;
  onEdit: (shelf: any) => void;
  onDelete: (type: 'showcase', id: number) => void;
  setShowBoxForm: (show: boolean) => void;
  onOpenBoxDetails: (boxId: number) => void;
}

export default function ShelfModal({ 
  shelf, 
  isAuthenticated, 
  onClose, 
  onEdit, 
  onDelete,
  setShowBoxForm,
  onOpenBoxDetails 
}: ShelfModalProps) {

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

  return (
    <div className="modal-overlay-new" ref={modalOverlayRef}>
      <div className="modal-container-new modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-new" onClick={onClose}>×</button>
        
        <div className="modal-header-new">
          <div className="modal-code">{shelf.code}</div>
          <h2 className="modal-title">{shelf.name}</h2>
        </div>

        {shelf.image_path && (
          <div className="modal-image-new">
            <img src={`/uploads/${shelf.image_path}`} alt={shelf.name} loading="lazy" />
          </div>
        )}

        {shelf.description && (
          <div className="modal-description">{shelf.description}</div>
        )}

        {isAuthenticated && (
          <div className="modal-actions">
            <button className="btn-new btn-secondary-new" onClick={() => setShowBoxForm(true)}>
              Neue Box
            </button>
            <button className="btn-new btn-secondary-new" onClick={() => onEdit(shelf)}>
              Bearbeiten
            </button>
            <button className="btn-new btn-danger-new" onClick={() => onDelete('showcase', shelf.id)}>
              Löschen
            </button>
          </div>
        )}

        {shelf.boxes && shelf.boxes.length > 0 && (
          <>
            <div className="modal-section-divider"></div>
            <div className="modal-section-title">Boxen in diesem Regal</div>
            <div className="boxes-grid-modal">
              {shelf.boxes.map((box: any) => (
                <div 
                  key={box.id} 
                  className="box-card-modal"
                  onClick={() => onOpenBoxDetails(box.id)}
                >
                  <div className="box-card-header">
                    <div className="box-card-code">{box.full_code}</div>
                    <div className="box-card-count">{box.mineral_count || 0}</div>
                  </div>
                  <div className="box-card-name">{box.name}</div>
                  {box.description && (
                    <div className="box-card-description">{box.description}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {(!shelf.boxes || shelf.boxes.length === 0) && (
          <div className="empty-state-small">
            <div className="empty-icon-small">□</div>
            <p>Keine Boxen in diesem Regal</p>
          </div>
        )}
      </div>
    </div>
  );
}