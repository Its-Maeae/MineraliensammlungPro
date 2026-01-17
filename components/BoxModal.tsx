import React, { useEffect, useRef } from 'react';
import { Mineral } from '../types';
import QRCodeGenerator from './QRCodeGenerator';

interface BoxModalProps {
  shelf: any;
  minerals: Mineral[];
  loading: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onEdit: (shelf: any) => void;
  onDelete: (type: 'shelf', id: number) => void;
  onOpenMineralDetails: (id: number) => void;
  setShowShelfMineralsModal: (show: boolean) => void;
}

export default function BoxModal({ 
  shelf, 
  minerals, 
  loading, 
  isAuthenticated, 
  onClose, 
  onEdit, 
  onDelete, 
  onOpenMineralDetails,
  setShowShelfMineralsModal 
}: BoxModalProps) {
  const [showQRGenerator, setShowQRGenerator] = React.useState(false);
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
    setShowShelfMineralsModal(false);
    onOpenMineralDetails(id);
  };

  return (
    <div className="modal-minimal" ref={modalOverlayRef}>
      <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-minimal" onClick={onClose}>×</button>
        
        <div className="modal-header-minimal">
          <h2 className="modal-title-minimal">
            Box {shelf.shelf_name}
            <span className="regal-code-badge">{shelf.full_code}</span>
          </h2>
          <div className="modal-subtitle-minimal">{shelf.showcase_name}</div>
        </div>
        
        <div className="modal-body-minimal">
          {shelf.image_path && (
            <div className="detail-image-minimal">
              <img src={`/uploads/${shelf.image_path}`} alt={shelf.shelf_name} />
            </div>
          )}

          <div className="stats-minimal">
            <div className="stat-minimal">
              <span className="stat-value-minimal">{minerals.length}</span>
              <span className="stat-label-minimal">Mineralien</span>
            </div>
          </div>

          {shelf.description && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div className="detail-label-minimal">Beschreibung</div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', marginTop: 'var(--space-2)', lineHeight: 1.5 }}>
                {shelf.description}
              </p>
            </div>
          )}

          {isAuthenticated && showQRGenerator && (
            <>
              <div className="section-divider"></div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div className="detail-label-minimal">QR-Code für direkten Zugriff</div>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <QRCodeGenerator 
                    shelfId={shelf.id}
                    shelfName={shelf.shelf_name}
                    fullCode={shelf.full_code}
                  />
                </div>
              </div>
            </>
          )}

          <div className="section-divider"></div>
          
          <div className="detail-label-minimal">Mineralien in dieser Box ({minerals.length})</div>
          
          {loading ? (
            <div className="loading">Lade Mineralien...</div>
          ) : minerals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>
              Diese Box ist noch leer
            </div>
          ) : (
            <div className="mineralien-simple-grid">
              {minerals.map(mineral => (
                <div 
                  key={mineral.id} 
                  className="mineral-card-simple" 
                  onClick={() => handleMineralClick(mineral.id)}
                >
                  <div className="mineral-image-simple">
                    {mineral.image_path ? (
                      <img 
                        src={`/uploads/${mineral.image_path}`} 
                        alt={mineral.name}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--gray-300)' }}></div>
                    )}
                  </div>
                  <div className="mineral-info-simple">
                    <div className="mineral-name-simple">{mineral.name}</div>
                    <div className="mineral-number-simple">Nr. {mineral.number}</div>
                    {mineral.color && (
                      <div className="mineral-number-simple">{mineral.color}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="admin-buttons-minimal">
            <button 
              className="btn-minimal primary" 
              onClick={() => setShowQRGenerator(!showQRGenerator)}>
              {showQRGenerator ? 'QR-Code ausblenden' : 'QR-Code generieren'}
            </button>
            <button 
              className="btn-minimal"
              onClick={() => onEdit(shelf)}>
              Bearbeiten
            </button>
            <button 
              className="btn-minimal danger" 
              onClick={() => onDelete('shelf', shelf.id)}>
              Löschen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}