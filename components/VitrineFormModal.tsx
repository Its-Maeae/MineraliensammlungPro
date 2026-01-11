import React from 'react';
import { useEffect, useRef } from 'react';

interface VitrineFormData {
  name: string;
  code: string;
  location: string;
  description: string;
}

interface VitrineFormModalProps {
  formData: VitrineFormData;
  setFormData: (data: VitrineFormData) => void;
  image: File | null;
  setImage: (image: File | null) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function VitrineFormModal({ 
  formData, 
  setFormData, 
  image, 
  setImage, 
  loading, 
  onSubmit, 
  onClose 
}: VitrineFormModalProps) {

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
    <div className="modal" style={{ display: 'flex' }} ref={modalOverlayRef}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>Neue Vitrine hinzufügen</h2>
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="vitrine-name">Name der Vitrine</label>
            <input
              type="text"
              id="vitrine-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="z.B. Hauptsammlung, Edelsteine, Kristalle"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="vitrine-code">Vitrine-Code</label>
            <input
              type="text"
              id="vitrine-code"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              placeholder="z.B. V1, HAUPT, EDL"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="vitrine-location">Standort</label>
            <input
              type="text"
              id="vitrine-location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="z.B. Wohnzimmer, Keller, Arbeitszimmer"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vitrine-description">Beschreibung</label>
            <textarea
              id="vitrine-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Beschreibung der Vitrine, Thema, Besonderheiten..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vitrine-image">Bild der Vitrine</label>
            <input
              type="file"
              id="vitrine-image"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
            {image && (
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                Ausgewählt: {image.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Wird hinzugefügt...' : 'Vitrine hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}