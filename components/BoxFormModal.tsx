import React, { useEffect, useRef } from 'react';

interface BoxFormData {
  name: string;
  code: string;
  description: string;
  position_order: number;
}

interface BoxFormModalProps {
  shelf: any;
  formData: BoxFormData;
  setFormData: (data: BoxFormData) => void;
  image: File | null;
  setImage: (image: File | null) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function BoxFormModal({ 
  shelf,
  formData, 
  setFormData, 
  image, 
  setImage, 
  loading, 
  onSubmit, 
  onClose 
}: BoxFormModalProps) {

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
      <div className="modal-container-new" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-new" onClick={onClose}>×</button>
        
        <div className="modal-header-new">
          <h2 className="modal-title">Neue Box zu Regal "{shelf.name}" hinzufügen</h2>
        </div>
        
        <form onSubmit={onSubmit} className="form-new">
          <div className="form-group-new">
            <label className="form-label-new">Name der Box</label>
            <input
              type="text"
              className="form-input-new"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="z.B. Box A, Quarz-Sammlung"
              required
            />
          </div>

          <div className="form-group-new">
            <label className="form-label-new">Box-Code</label>
            <input
              type="text"
              className="form-input-new"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              placeholder="z.B. A, B1, C2"
              required
            />
          </div>

          <div className="form-group-new">
            <label className="form-label-new">Beschreibung</label>
            <textarea
              className="form-textarea-new"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Beschreibung der Box"
              rows={3}
            />
          </div>

          <div className="form-group-new">
            <label className="form-label-new">Position</label>
            <input
              type="number"
              className="form-input-new"
              value={formData.position_order}
              onChange={(e) => setFormData({...formData, position_order: parseInt(e.target.value) || 0})}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="form-group-new">
            <label className="form-label-new">Bild der Box</label>
            <input
              type="file"
              className="form-file-new"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
            {image && (
              <div className="file-selected">{image.name}</div>
            )}
          </div>

          <div className="form-actions-new">
            <button 
              type="button" 
              className="btn-new btn-secondary-new"
              onClick={onClose}
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              className="btn-new btn-primary-new"
              disabled={loading}
            >
              {loading ? 'Wird hinzugefügt...' : 'Box hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}