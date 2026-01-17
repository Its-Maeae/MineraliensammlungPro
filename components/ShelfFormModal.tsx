import React from 'react';
import { useEffect, useRef } from 'react';

interface ShelfFormData {
  name: string;
  code: string;
  description: string;
  position_order: number;
}

interface ShelfFormModalProps {
  showcase: any;
  formData: ShelfFormData;
  setFormData: (data: ShelfFormData) => void;
  image: File | null;
  setImage: (image: File | null) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function ShelfFormModal({ 
  showcase,
  formData, 
  setFormData, 
  image, 
  setImage, 
  loading, 
  onSubmit, 
  onClose 
}: ShelfFormModalProps) {

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
          <h2 className="modal-title-minimal">Neue Box für {showcase.name} hinzufügen</h2>
        </div>
        
        <div className="modal-body-minimal">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="shelf-name">Name der Box</label>
              <input
                type="text"
                id="shelf-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="z.B. Obere Box, Edelsteine, Kristalle"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="shelf-code">Box-Code</label>
              <input
                type="text"
                id="shelf-code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="z.B. 01, 02, 03"
                required
              />
              <small style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)', display: 'block' }}>
                Vollständiger Code wird: {showcase.code}-{formData.code}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="shelf-description">Beschreibung</label>
              <textarea
                id="shelf-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Beschreibung der Box, Inhalt, Besonderheiten..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="shelf-position">Position/Reihenfolge</label>
              <input
                type="number"
                id="shelf-position"
                value={formData.position_order}
                onChange={(e) => setFormData({...formData, position_order: parseInt(e.target.value) || 0})}
                placeholder="0"
                min="0"
              />
              <small style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)', display: 'block' }}>
                Bestimmt die Anzeigereihenfolge (0 = erste Box)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="shelf-image">Bild der Box</label>
              <input
                type="file"
                id="shelf-image"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              {image && (
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                  Ausgewählt: {image.name}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button 
                type="button" 
                className="btn-minimal"
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Abbrechen
              </button>
              <button 
                type="submit" 
                className="btn-minimal primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Wird hinzugefügt...' : 'Box hinzufügen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}