import { useEffect, useRef, useState, useCallback } from 'react';
import MapSelector from './MapSelector';
import ShelfSelector from './ShelfSelector';

// ── Inline SectionSelector ────────────────────────────────────────────────────
// Lädt Sektionen der gewählten Box und zeigt sie als Dropdown an.

interface SectionOption {
  id: number;
  name: string;
  code: string;
  full_code: string;
  mineral_count?: number;
}

function SectionSelector({
  shelfId,
  selectedSectionId,
  onChange,
}: {
  shelfId: string | number;
  selectedSectionId: string | number;
  onChange: (sectionId: string) => void;
}) {
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shelfId) {
      setSections([]);
      return;
    }
    setLoading(true);
    fetch(`/api/sections?shelf_id=${shelfId}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: SectionOption[]) => setSections(data))
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, [shelfId]);

  if (!shelfId) return null;
  if (loading) return <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginTop: 4 }}>Lade Sektionen...</div>;
  if (sections.length === 0) return null;

  return (
    <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
      <label htmlFor="edit-section">Sektion <span style={{ fontWeight: 400, color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)' }}>(optional)</span></label>
      <select
        id="edit-section"
        value={selectedSectionId?.toString() || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: 'var(--space-2) var(--space-3)',
          border: '1px solid var(--gray-300)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          background: 'var(--white)',
          color: 'var(--gray-900)',
        }}
      >
        <option value="">Keine Sektion (direkt in Box)</option>
        {sections.map(s => (
          <option key={s.id} value={s.id.toString()}>
            {s.full_code} – {s.name}
            {s.mineral_count !== undefined ? ` (${s.mineral_count} Mineralien)` : ''}
          </option>
        ))}
      </select>
      {selectedSectionId && (
        <small style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 4, display: 'block' }}>
          Code: {sections.find(s => s.id.toString() === selectedSectionId.toString())?.full_code}
        </small>
      )}
    </div>
  );
}

// ── EditModal ─────────────────────────────────────────────────────────────────

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
  clearCaches,
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

  // ── Wenn Box wechselt → section_id zurücksetzen ──────────────────────────
  const handleShelfChange = useCallback((shelfId: string) => {
    setFormData({ ...formData, shelf_id: shelfId, section_id: '' });
  }, [formData, setFormData]);

  const handleUndeterminedToggle = (checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        is_undetermined: true,
        name: 'Unbestimmtes Mineral',
        description: '',
        location: '',
        purchase_location: '',
        rock_type: '',
      });
    } else {
      setFormData({
        ...formData,
        is_undetermined: false,
        name: '',
        suspected_name: '',
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

      // section_id explizit senden, auch wenn leer (damit es gecleart werden kann)
      if (editMode === 'mineral') {
        formDataToSend.set('section_id', formData.section_id?.toString() || '');
        formDataToSend.set('shelf_id', formData.shelf_id?.toString() || '');
      }

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

      const response = await fetch(url, { method: 'PUT', body: formDataToSend });
      const responseData = await response.json();

      if (response.ok) {
        setEditMode(null);
        setImage(null);
        setFormData({});

        if (editMode === 'mineral') {
          if (clearCaches) clearCaches('mineral', formData.id);
          if (currentPage === 'collection') {
            if (loadMinerals) {
              await loadMinerals();
            } else {
              const r = await fetch('/api/minerals');
              if (r.ok) setMinerals(await r.json());
            }
          }
          setShowMineralModal(false);
          setSelectedMineral(null);
        } else if (editMode === 'showcase') {
          if (clearCaches) clearCaches('showcase', formData.id);
          if (formData.id) {
            try {
              const r = await fetch(`/api/showcases/${formData.id}`);
              if (r.ok) setSelectedShowcase(await r.json());
            } catch {}
          }
          try {
            const r = await fetch('/api/showcases');
            if (r.ok) setShowcases(await r.json());
          } catch {}
        } else if (editMode === 'shelf') {
          if (clearCaches) clearCaches('shelf', formData.id);
          if (formData.showcase_id) {
            if (clearCaches) clearCaches('showcase', formData.showcase_id);
            try {
              const r = await fetch(`/api/showcases/${formData.showcase_id}`);
              if (r.ok) setSelectedShowcase(await r.json());
            } catch {}
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
    <div ref={modalOverlayRef} className="modal" style={{ display: 'flex' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>
          {editMode === 'mineral' ? 'Mineral bearbeiten' :
            editMode === 'showcase' ? 'Regal bearbeiten' :
              'Box bearbeiten'}
        </h2>

        <form onSubmit={handleUpdateSubmit}>
          {editMode === 'mineral' && (
            <>
              {/* ── Unbestimmt-Schalter ── */}
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

              {/* ── Vermuteter Name (nur wenn unbestimmt) ── */}
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

              {/* ── Name ── */}
              {!isUndetermined && (
                <div className="form-group">
                  <label>Name des Minerals</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Steinnummer</label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </div>

              {/* ── Farbe (immer sichtbar) ── */}
              <div className="form-group">
                <label>Farbe</label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>

              {!isUndetermined && (
                <>
                  <div className="form-group">
                    <label>Beschreibung</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fundort</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </>
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

              {!isUndetermined && (
                <>
                  <div className="form-group">
                    <label>Kaufort</label>
                    <input
                      type="text"
                      value={formData.purchase_location || ''}
                      onChange={(e) => setFormData({ ...formData, purchase_location: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gesteinsart</label>
                    <input
                      type="text"
                      value={formData.rock_type || ''}
                      onChange={(e) => setFormData({ ...formData, rock_type: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* ── Box-Zuordnung ── */}
              <div className="form-group">
                <label>Box</label>
                <ShelfSelector
                  shelves={shelves}
                  selectedShelfId={formData.shelf_id || ''}
                  onChange={handleShelfChange}
                />
              </div>

              {/* ── Sektions-Zuordnung (erscheint automatisch wenn Box Sektionen hat) ── */}
              <SectionSelector
                shelfId={formData.shelf_id || ''}
                selectedSectionId={formData.section_id || ''}
                onChange={(sectionId) => setFormData({ ...formData, section_id: sectionId })}
              />

              {/* ── Standort-Vorschau ── */}
              {formData.shelf_id && (
                <div style={{
                  marginTop: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--gray-600)',
                }}>
                  Standort-Code: {
                    (() => {
                      const shelf = shelves.find(s => s.id.toString() === formData.shelf_id?.toString());
                      if (!shelf) return '–';
                      if (formData.section_id) return `${shelf.full_code}-[Sektion]`;
                      return shelf.full_code;
                    })()
                  }
                </div>
              )}
            </>
          )}

          {editMode === 'showcase' && (
            <>
              <div className="form-group">
                <label>Name des Regals</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Regal-Code</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Standort</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Box-Code</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Position/Reihenfolge</label>
                <input
                  type="number"
                  value={formData.position_order || 0}
                  onChange={(e) => setFormData({ ...formData, position_order: parseInt(e.target.value) || 0 })}
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}