import { useEffect, useRef } from 'react';
import MapSelector from './MapSelector';

interface EditModalProps {
  editMode: 'mineral' | 'showcase' | 'shelf';
  formData: any;
  setFormData: (data: any) => void;
  image: File | null;
  setImage: (image: File | null) => void;
  shelves: any[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onClose: () => void;
  setEditMode: (mode: 'mineral' | 'showcase' | 'shelf' | null) => void;
  setSelectedMineral: (mineral: any) => void;
  setShowMineralModal: (show: boolean) => void;
  setSelectedShowcase: (showcase: any) => void;
  setShowShelfMineralsModal: (show: boolean) => void;
  setSelectedShelf: (shelf: any) => void;
  currentPage: string;
  setMinerals: (minerals: any[]) => void;
  setShowcases: (showcases: any[]) => void;
  loadStats: () => void;
  loadMinerals?: () => Promise<void>;
}

export default function EditModal({ 
  editMode, 
  formData, 
  setFormData, 
  image, 
  setImage, 
  shelves, 
  loading, 
  setLoading,
  onClose,
  setEditMode,
  setSelectedMineral,
  setShowMineralModal,
  setSelectedShowcase,
  setShowShelfMineralsModal,
  setSelectedShelf,
  currentPage,
  setMinerals,
  setShowcases,
  loadStats,
  loadMinerals
}: EditModalProps) {
  
  // Ref für das Modal-Overlay
  const modalOverlayRef = useRef<HTMLDivElement>(null);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Prüfe ob direkt auf den modal-overlay geklickt wurde
      if (modalOverlayRef.current && target === modalOverlayRef.current) {
        onClose();
      }
    };

    // Kurze Verzögerung um Konflikt mit öffnendem Click zu vermeiden
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Handle all form fields including coordinates
      Object.keys(formData).forEach(key => {
        if (key !== 'id' && formData[key] !== undefined) {
          // Special handling for coordinates - convert 0 values to null for clearing
          if ((key === 'latitude' || key === 'longitude') && formData[key] === 0) {
            formDataToSend.append(key, ''); // Send empty string to indicate clearing
          } else if (formData[key] !== null) {
            formDataToSend.append(key, formData[key].toString());
          }
        }
      });
      
      if (image) {
        formDataToSend.append('image', image);
      }

      let url = '';
      let entityName = '';
      switch (editMode) {
        case 'mineral':
          url = `/api/minerals/${formData.id}`;
          entityName = 'Mineral';
          break;
        case 'showcase':
          url = `/api/showcases/${formData.id}`;
          entityName = 'Vitrine';
          break;
        case 'shelf':
          url = `/api/shelves/${formData.id}`;
          entityName = 'Regal';
          break;
      }

      const response = await fetch(url, {
        method: 'PUT',
        body: formDataToSend
      });

      const responseData = await response.json();

      if (response.ok) {
        setEditMode(null);
        setImage(null);
        setFormData({});
        
        if (editMode === 'mineral') {
          if (currentPage === 'collection') {
            // Verwende die übergebene loadMinerals Funktion mit aktuellen Filtern
            if (loadMinerals) {
              await loadMinerals();
            } else {
              // Fallback: Lade ohne Filter
              const response = await fetch('/api/minerals');
              if (response.ok) {
                const data = await response.json();
                setMinerals(data);
              }
            }
          }
          setShowMineralModal(false);
          setSelectedMineral(null);
        } else if (editMode === 'showcase') {
          // Reload showcases
          const loadShowcases = async () => {
            try {
              const response = await fetch('/api/showcases');
              if (response.ok) {
                const data = await response.json();
                setShowcases(data);
              }
            } catch (error) {
              console.error('Fehler beim Laden der Vitrinen:', error);
            }
          };
          await loadShowcases();
          
          // Reload current showcase details if it was open
          if (formData.id) {
            try {
              const response = await fetch(`/api/showcases/${formData.id}`);
              if (response.ok) {
                const showcase = await response.json();
                setSelectedShowcase(showcase);
              }
            } catch (error) {
              console.error('Fehler beim Laden der Vitrine-Details:', error);
            }
          }
        } else if (editMode === 'shelf') {
          // Reload shelf's showcase if needed
          if (formData.showcase_id) {
            try {
              const response = await fetch(`/api/showcases/${formData.showcase_id}`);
              if (response.ok) {
                const showcase = await response.json();
                setSelectedShowcase(showcase);
              }
            } catch (error) {
              console.error('Fehler beim Laden der Vitrine-Details:', error);
            }
          }
          setShowShelfMineralsModal(false);
          setSelectedShelf(null);
        }
        
        loadStats();
        alert(`${entityName} erfolgreich aktualisiert!`);
      } else {
        alert('Fehler: ' + (responseData.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      ref={modalOverlayRef}
      className="modal" 
      style={{ display: 'flex' }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>
          {editMode === 'mineral' ? 'Mineral bearbeiten' : 
          editMode === 'showcase' ? 'Vitrine bearbeiten' : 
          'Regal bearbeiten'}
        </h2>
        
        <form onSubmit={handleUpdateSubmit}>
          {editMode === 'mineral' && (
            <>
              <div className="form-group">
                <label>Name des Minerals</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Steinnummer</label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Farbe</label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Fundort</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Fundort auf Karte</label>
                <MapSelector
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationSelect={(lat, lng) => {
                    console.log('MapSelector coordinates changed:', lat, lng);
                    setFormData({
                      ...formData, 
                      latitude: lat, 
                      longitude: lng
                    });
                  }}
                />
                {formData.latitude && formData.longitude && formData.latitude !== 0 && formData.longitude !== 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    Koordinaten: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Kaufort</label>
                <input
                  type="text"
                  value={formData.purchase_location || ''}
                  onChange={(e) => setFormData({...formData, purchase_location: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Gesteinsart</label>
                <input
                  type="text"
                  value={formData.rock_type || ''}
                  onChange={(e) => setFormData({...formData, rock_type: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Regal</label>
                <select
                  value={formData.shelf_id || ''}
                  onChange={(e) => setFormData({...formData, shelf_id: e.target.value})}
                >
                  <option value="">Kein Regal zugeordnet</option>
                  {shelves.map(shelf => (
                    <option key={shelf.id} value={shelf.id}>
                      {shelf.showcase_name} - {shelf.name} ({shelf.full_code})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {editMode === 'showcase' && (
            <>
              <div className="form-group">
                <label>Name der Vitrine</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Vitrine-Code</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Standort</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                />
              </div>
            </>
          )}

          {editMode === 'shelf' && (
            <>
              <div className="form-group">
                <label>Name des Regals</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Regal-Code</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Position/Reihenfolge</label>
                <input
                  type="number"
                  value={formData.position_order || 0}
                  onChange={(e) => setFormData({...formData, position_order: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Bild ersetzen (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
            {image && (
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                Neues Bild: {image.name}
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
              {loading ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}