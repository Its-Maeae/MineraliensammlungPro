import React, { useState, useCallback, useEffect } from 'react';
import { ShelfSection } from '../types';

interface BoxSectionManagerProps {
  shelf: any;
  isAuthenticated: boolean;
  onSectionsChanged: () => void;
  onSectionClick: (section: ShelfSection) => void;
  externalEditSection?: ShelfSection | null;
  onExternalEditDone?: () => void;
}

interface SectionFormData {
  name: string;
  code: string;
  description: string;
  position_order: number;
}

const EMPTY_FORM: SectionFormData = { name: '', code: '', description: '', position_order: 0 };

export default function BoxSectionManager({
  shelf,
  isAuthenticated,
  onSectionsChanged,
  onSectionClick,
  externalEditSection,
  onExternalEditDone,
}: BoxSectionManagerProps) {
  const [sections, setSections] = useState<ShelfSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<ShelfSection | null>(null);
  const [formData, setFormData] = useState<SectionFormData>(EMPTY_FORM);
  const [formImage, setFormImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [swapping, setSwapping] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sections?shelf_id=${shelf.id}`);
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      }
    } catch (e) {
      setError('Sektionen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [shelf.id]);

  useEffect(() => { loadSections(); }, [loadSections]);

  // Open edit form when parent triggers it (e.g. from section-view admin buttons)
  useEffect(() => {
    if (externalEditSection) {
      openEdit(externalEditSection);
      onExternalEditDone?.();
    }
  }, [externalEditSection]);

  const openAdd = () => {
    setEditingSection(null);
    setFormData({ ...EMPTY_FORM, position_order: sections.length });
    setFormImage(null);
    setShowForm(true);
  };

  const openEdit = (section: ShelfSection) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      code: section.code,
      description: section.description || '',
      position_order: section.position_order,
    });
    setFormImage(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('code', formData.code);
      fd.append('description', formData.description);
      fd.append('position_order', formData.position_order.toString());
      if (!editingSection) fd.append('shelf_id', shelf.id.toString());
      if (formImage) fd.append('image', formImage);

      const url = editingSection ? `/api/sections/${editingSection.id}` : '/api/sections';
      const method = editingSection ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Fehler beim Speichern');
        return;
      }

      setShowForm(false);
      setEditingSection(null);
      setFormData(EMPTY_FORM);
      setFormImage(null);
      await loadSections();
      onSectionsChanged();
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (section: ShelfSection) => {
    if (!confirm(`Sektion "${section.name}" (${section.full_code}) wirklich löschen?`)) return;

    try {
      const res = await fetch(`/api/sections/${section.id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadSections();
        onSectionsChanged();
      } else {
        const d = await res.json();
        setError(d.error || 'Fehler beim Löschen');
      }
    } catch {
      setError('Verbindungsfehler');
    }
  };

  const handleSwap = async (sectionA: ShelfSection, sectionB: ShelfSection) => {
    setSwapping(sectionA.id);
    try {
      const res = await fetch(`/api/sections/${sectionA.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swap_with: sectionB.id }),
      });
      if (res.ok) {
        await loadSections();
      }
    } catch {
      setError('Fehler beim Tauschen');
    } finally {
      setSwapping(null);
    }
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    handleSwap(sections[idx], sections[idx - 1]);
  };

  const moveDown = (idx: number) => {
    if (idx === sections.length - 1) return;
    handleSwap(sections[idx], sections[idx + 1]);
  };

  return (
    <div className="section-manager">
      {/* Header */}
      <div className="section-manager-header">
        <div className="detail-label-minimal">
          Box-Sektionen {sections.length > 0 && `(${sections.length})`}
        </div>
        {isAuthenticated && (
          <button className="btn-minimal primary" onClick={openAdd} type="button"
            style={{ padding: '4px 12px', fontSize: 'var(--font-size-xs)' }}>
            + Sektion
          </button>
        )}
      </div>

      {error && (
        <div className="add-minerals-message error" style={{ marginBottom: 'var(--space-3)' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Grafische Anzeige der Sektionen */}
      {loading ? (
        <div style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)', padding: 'var(--space-4)' }}>
          Lade Sektionen...
        </div>
      ) : sections.length === 0 ? (
        <div className="sections-empty">
          <div className="sections-empty-box">
            <span style={{ fontSize: 24, opacity: 0.4 }}>▭</span>
            <p>Keine Sektionen – Box ist ungeteilt</p>
            {isAuthenticated && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-400)' }}>
                Klicke auf „+ Sektion" um Unterteilungen hinzuzufügen
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="sections-list">
          {sections.map((section, idx) => (
            <div key={section.id} className="section-list-item">
              <div className="section-list-left" onClick={() => onSectionClick(section)}>
                <span className="section-list-code">{section.full_code}</span>
                <span className="section-list-name">{section.name}</span>
                <span className="section-list-count">{section.mineral_count || 0} Mineralien</span>
              </div>
              {isAuthenticated && (
                <div className="section-list-actions">
                  <button
                    className="section-order-btn"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0 || swapping !== null}
                    title="Nach oben"
                  >↑</button>
                  <button
                    className="section-order-btn"
                    onClick={() => moveDown(idx)}
                    disabled={idx === sections.length - 1 || swapping !== null}
                    title="Nach unten"
                  >↓</button>
                  <button
                    className="section-edit-btn"
                    onClick={() => openEdit(section)}
                    title="Bearbeiten"
                  >✎</button>
                  <button
                    className="section-delete-btn"
                    onClick={() => handleDelete(section)}
                    title="Löschen"
                  >×</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formular: Sektion hinzufügen / bearbeiten */}
      {showForm && (
        <div className="section-form-overlay" onClick={() => setShowForm(false)}>
          <div className="section-form-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-minimal" onClick={() => setShowForm(false)}>×</button>

            <div className="modal-header-minimal">
              <h3 className="modal-title-minimal" style={{ fontSize: 'var(--font-size-lg)' }}>
                {editingSection ? 'Sektion bearbeiten' : 'Neue Sektion hinzufügen'}
              </h3>
              <div className="modal-subtitle-minimal">
                Box: {shelf.full_code} – {shelf.name || shelf.shelf_name}
              </div>
            </div>

            <div className="modal-body-minimal">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="sec-name">Sektionsname</label>
                  <input
                    id="sec-name"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Oben, Unten, Links, Rechts"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sec-code">Sektions-Code</label>
                  <input
                    id="sec-code"
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="z.B. A, B, 01, O, U"
                    required
                    maxLength={10}
                  />
                  <small style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-xs)', marginTop: 4, display: 'block' }}>
                    Vollständiger Code: {shelf.full_code}-{formData.code || '?'}
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="sec-desc">Beschreibung</label>
                  <textarea
                    id="sec-desc"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optionale Beschreibung der Sektion"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sec-img">Bild (optional)</label>
                  <input
                    id="sec-img"
                    type="file"
                    accept="image/*"
                    onChange={e => setFormImage(e.target.files?.[0] || null)}
                  />
                  {formImage && (
                    <small style={{ color: 'var(--gray-600)', marginTop: 4, display: 'block' }}>
                      {formImage.name}
                    </small>
                  )}
                </div>

                {error && (
                  <div className="add-minerals-message error">{error}</div>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
                  <button type="button" className="btn-minimal" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
                    Abbrechen
                  </button>
                  <button type="submit" className="btn-minimal primary" disabled={saving} style={{ flex: 1 }}>
                    {saving ? 'Speichern...' : editingSection ? 'Speichern' : 'Hinzufügen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}