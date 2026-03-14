import { useEffect, useRef } from 'react';
import MapSelector from './MapSelector';
import ShelfSelector from './ShelfSelector';

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
  clearCaches?: (type: 'showcase' | 'shelf' | 'mineral', id: number) => void;
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
  loadMinerals,
  clearCaches
}: EditModalProps) {
  
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const isUndetermined = editMode === 'mineral' && !!formData.is_undetermined;

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

  // Toggle undetermined status in edit modal
  const handleUndeterminedToggle = (checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        is_undetermined: true,
        name: 'Unbestimmtes Mineral',
        description: '',
        location: '',
        purchase_location: '',
        rock_type: ''
        // color und suspected_name werden bewusst beibehalten
      });
    } else {
      setFormData({
        ...formData,
        is_undetermined: false,
        name: '',
        suspected_name: ''
      });
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key !== 'id' && formData[key] !== undefined) {
          if ((key === 'latitude' || key === 'longitude') && formData[key] === 0) {
            formDataToSend.append(key, '');
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
          entityName = 'Regal';
          break;
        case 'shelf':
          url = `/api/shelves/${formData.id}`;
          entityName = 'Box';
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
          if (clearCaches) {
            clearCaches('mineral', formData.id);
          }
          
          if (currentPage === 'collection') {
            if (loadMinerals) {
              await loadMinerals();
            } else {
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
          if (clearCaches) {
            clearCaches('showcase', formData.id);
          }
          
          if (formData.id) {
            try {
              const response = await fetch(`/api/showcases/${formData.id}`);
              if (response.ok) {
                const showcase = await response.json();
                setSelectedShowcase(showcase);
              }
            } catch (error) {
              console.error('Fehler beim Laden der Regal-Details:', error);
            }
          }
          
          const loadShowcases = async () => {
            try {
              const response = await fetch('/api/showcases');
              if (response.ok) {
                const data = await response.json();
                setShowcases(data);
              }
            } catch (error) {
              console.error('Fehler beim Laden der Regale:', error);
            }
          };
          await loadShowcases();
        } else if (editMode === 'shelf') {
          if (clearCaches) {
            clearCaches('shelf', formData.id);
          }
          
          if (formData.showcase_id) {
            if (clearCaches) {
              clearCaches('showcase', formData.showcase_id);
            }
            
            try {
              const response = await fetch(`/api/showcases/${formData.showcase_id}`);
              if (response.ok) {
                const showcase = await response.json();
                setSelectedShowcase(showcase);
              }
            } catch (error) {
              console.error('Fehler beim Laden der Regal-Details:', error);
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
          editMode === 'showcase' ? 'Regal bearbeiten' : 
          'Box bearbeiten'}
        </h2>
        
        <form onSubmit={handleUpdateSubmit}>
          {editMode === 'mineral' && (
            <>
              {/* ── Unbestimmt-Schalter im EditModal ── */}
              <div className="undetermined-toggle-card" style={{ marginBottom: '16px' }}>
                <div className="undetermined-toggle-content">
                  <div className="undetermined-toggle-text">
                    <span className="undetermined-toggle-label">Unbestimmtes Mineral</span>
                    <span className="undetermined-toggle-hint">
                      {isUndetermined
                        ? 'Mineral ist als unbestimmt markiert.'
                        : 'Als unbestimmt markieren – blendet alle inhaltlichen Felder aus.'}
                    </span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isUndetermined}
                    onChange={(e) => handleUndeterminedToggle(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* ── Vermutung (nur wenn Unbestimmt aktiv) ── */}
              {isUndetermined && (
                <div className="form-group suspected-name-group">
                  <label>Vermuteter Mineralname <span className="label-optional">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.suspected_name || ''}
                    onChange={(e) => setFormData({ ...formData, suspected_name: e.target.value })}
                    placeholder="z.B. Quarz, Pyrit, Amethyst – noch unsicher"
                    autoComplete="off"
                  />
                </div>
              )}

              {/* ── Name (versteckt wenn unbestimmt) ── */}
              {!isUndetermined && (
                <div className="form-group">
                  <label>Name des Minerals</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Steinnummer</label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  required
                />
              </div>
              {/* ── Farbe (immer sichtbar, auch bei unbestimmten Mineralien) ── */}
              <div className="form-group">
                <label>Farbe</label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </div>
              {/* ── Beschreibung (versteckt wenn unbestimmt) ── */}
              {!isUndetermined && (
                <div className="form-group">
                  <label>Beschreibung</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                  />
                </div>
              )}
              {/* ── Fundort (versteckt wenn unbestimmt) ── */}
              {!isUndetermined && (
                <div className="form-group">
                  <label>Fundort</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Fundort auf Karte</label>
                <MapSelector
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationSelect={(lat, lng) => {
                    setFormData({ ...formData, latitude: lat, longitude: lng });
                  }}
                />
                {formData.latitude && formData.longitude && formData.latitude !== 0 && formData.longitude !== 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    Koordinaten: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </div>
                )}
              </div>
              {/* ── Kaufort (versteckt wenn unbestimmt) ── */}
              {!isUndetermined && (
                <div className="form-group">
                  <label>Kaufort</label>
                  <input
                    type="text"
                    value={formData.purchase_location || ''}
                    onChange={(e) => setFormData({...formData, purchase_location: e.target.value})}
                  />
                </div>
              )}
              {/* ── Gesteinsart (versteckt wenn unbestimmt) ── */}
              {!isUndetermined && (
                <div className="form-group">
                  <label>Gesteinsart</label>
                  <input
                    type="text"
                    value={formData.rock_type || ''}
                    onChange={(e) => setFormData({...formData, rock_type: e.target.value})}
                  />
                </div>
              )}
              {/* Regal immer editierbar */}
              <div className="form-group">
                <label>Box</label>
                <ShelfSelector
                  shelves={shelves}
                  selectedShelfId={formData.shelf_id || ''}
                  onChange={(shelfId) => setFormData({...formData, shelf_id: shelfId})}
                />
              </div>
            </>
          )}

          {editMode === 'showcase' && (
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
                <label>Name der Box</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Box-Code</label>
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

          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
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