import React from 'react';
import { Showcase } from '../types';

interface ShowcaseModalProps {
  showcase: Showcase;
  isAuthenticated: boolean;
  onClose: () => void;
  onEdit: (showcase: Showcase) => void;
  onDelete: (type: 'showcase', id: number) => void;
  setShowShelfForm: (show: boolean) => void;
  onOpenShelfDetails: (shelfId: number) => void;
}

export default function ShowcaseModal({ 
  showcase, 
  isAuthenticated, 
  onClose, 
  onEdit, 
  onDelete,
  setShowShelfForm,
  onOpenShelfDetails 
}: ShowcaseModalProps) {
  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content-mid showcase-modal">
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>{showcase.name}</h2>
        
        {showcase.image_path && (
          <div className="detail-image">
            <img src={`/uploads/${showcase.image_path}`} alt={showcase.name} />
          </div>
        )}
        
        <div className="detail-info">
          <div className="detail-item">
            <span className="detail-label">Code:</span>
            <span className="detail-value">{showcase.code}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Standort:</span>
            <span className="detail-value">{showcase.location || 'Nicht angegeben'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Anzahl Regale:</span>
            <span className="detail-value">{showcase.shelf_count || 0}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Anzahl Mineralien:</span>
            <span className="detail-value">{showcase.mineral_count || 0}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Hinzugefügt:</span>
            <span className="detail-value">
              {new Date(showcase.created_at).toLocaleDateString('de-DE')}
            </span>
          </div>
        </div>
        
        {showcase.description && (
          <div style={{ marginTop: '20px' }}>
            <h3>Beschreibung</h3>
            <p style={{ marginTop: '10px', color: '#555', lineHeight: '1.6' }}>
              {showcase.description}
            </p>
          </div>
        )}

        {isAuthenticated && (
          <div className="admin-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => setShowShelfForm(true)}>
                Neues Regal hinzufügen
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => onEdit(showcase)}
            >
              Bearbeiten
            </button>
            <button 
              className="btn error-btn"
              onClick={() => onDelete('showcase', showcase.id)}
            >
              Löschen
            </button>
          </div>
        )}

        {/* Regale der Vitrine anzeigen */}
        {showcase.shelves && showcase.shelves.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h3>Regale in dieser Vitrine</h3>
            <div className="shelves-grid">
              {showcase.shelves.map((shelf: any) => (
                <div 
                  key={shelf.id} 
                  className="shelf-card clickable"
                  onClick={() => onOpenShelfDetails(shelf.id)}
                >
                  {shelf.image_path && (
                    <div className="shelf-image">
                      <img src={`/uploads/${shelf.image_path}`} alt={shelf.name} />
                    </div>
                  )}
                  <div className="shelf-info">
                    <h4>{shelf.name}</h4>
                    <p><strong>Code:</strong> {shelf.full_code}</p>
                    <p><strong>Mineralien:</strong> {shelf.mineral_count || 0}</p>
                    {shelf.description && (
                      <p><strong>Beschreibung:</strong> {shelf.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}