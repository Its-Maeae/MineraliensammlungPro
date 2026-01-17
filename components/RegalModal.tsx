import React, { useEffect, useRef } from 'react';
import { Showcase } from '../types';

interface RegalModalProps {
  showcase: Showcase;
  isAuthenticated: boolean;
  onClose: () => void;
  onEdit: (showcase: Showcase) => void;
  onDelete: (type: 'showcase', id: number) => void;
  setShowShelfForm: (show: boolean) => void;
  onOpenShelfDetails: (shelfId: number) => void;
}

export default function RegalModal({ 
  showcase, 
  isAuthenticated, 
  onClose, 
  onEdit, 
  onDelete,
  setShowShelfForm,
  onOpenShelfDetails 
}: RegalModalProps) {

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
    <div className="modal-minimal" ref={modalOverlayRef}>
      <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-minimal" onClick={onClose}>×</button>
        
        <div className="modal-header-minimal">
          <h2 className="modal-title-minimal">
            {showcase.name}
            <span className="regal-code-badge">{showcase.code}</span>
          </h2>
          {showcase.location && (
            <div className="modal-subtitle-minimal">{showcase.location}</div>
          )}
        </div>
        
        <div className="modal-body-minimal">
          {showcase.image_path && (
            <div className="detail-image-minimal">
              <img src={`/uploads/${showcase.image_path}`} alt={showcase.name} />
            </div>
          )}
          
          <div className="stats-minimal">
            <div className="stat-minimal">
              <span className="stat-value-minimal">{showcase.shelf_count || 0}</span>
              <span className="stat-label-minimal">Boxen</span>
            </div>
            <div className="stat-minimal">
              <span className="stat-value-minimal">{showcase.mineral_count || 0}</span>
              <span className="stat-label-minimal">Mineralien</span>
            </div>
          </div>

          {showcase.description && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div className="detail-label-minimal">Beschreibung</div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', marginTop: 'var(--space-2)', lineHeight: 1.5 }}>
                {showcase.description}
              </p>
            </div>
          )}

          <div className="section-divider"></div>

          {showcase.shelves && showcase.shelves.length > 0 && (
            <div>
              <div className="detail-label-minimal">Boxen in diesem Regal</div>
              <div className="boxen-grid-modal">
                {showcase.shelves.map((box: any) => (
                  <div 
                    key={box.id} 
                    className="box-card-modal"
                    onClick={() => onOpenShelfDetails(box.id)}
                  >
                    <div className="box-card-code">{box.full_code}</div>
                    <div className="box-card-name">{box.name}</div>
                    <div className="box-card-count">{box.mineral_count || 0} Mineralien</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="admin-buttons-minimal">
            <button 
              className="btn-minimal primary"
              onClick={() => setShowShelfForm(true)}>
                Neue Box hinzufügen
            </button>
            <button 
              className="btn-minimal"
              onClick={() => onEdit(showcase)}
            >
              Bearbeiten
            </button>
            <button 
              className="btn-minimal danger"
              onClick={() => onDelete('showcase', showcase.id)}
            >
              Löschen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}