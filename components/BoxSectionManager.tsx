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
    } catch {
      setError('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, [shelf.id]);

  useEffect(() => { loadSections(); }, [loadSections]);

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

      if (!res.ok) { setError(data.error || 'Fehler beim Speichern'); return; }

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
      if (res.ok) { await loadSections(); onSectionsChanged(); }
      else { const d = await res.json(); setError(d.error || 'Fehler beim Löschen'); }
    } catch { setError('Verbindungsfehler'); }
  };

  const handleSwap = async (sectionA: ShelfSection, sectionB: ShelfSection) => {
    setSwapping(sectionA.id);
    try {
      const res = await fetch(`/api/sections/${sectionA.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swap_with: sectionB.id }),
      });
      if (res.ok) await loadSections();
    } catch { setError('Fehler beim Tauschen'); }
    finally { setSwapping(null); }
  };

  const moveUp = (idx: number) => { if (idx > 0) handleSwap(sections[idx], sections[idx - 1]); };
  const moveDown = (idx: number) => { if (idx < sections.length - 1) handleSwap(sections[idx], sections[idx + 1]); };

  // Don't render while loading
  if (loading) return null;

  // No sections: only admins see the "+ Sektion" button, no empty state message
  if (sections.length === 0) {
    if (!isAuthenticated) return null;
    return (
      <div className="section-manager">
        <div className="section-manager-header">
          <div className="detail-label-minimal">Sektionen</div>
          <button className="btn-minimal primary" onClick={openAdd} type="button"
            style={{ padding: '4px 12px', fontSize: 'var(--font-size-xs)' }}>
            + Sektion
          </button>
        </div>
        {showForm && (
          <SectionFormModal
            editingSection={editingSection}
            formData={formData}
            setFormData={setFormData}
            saving={saving}
            error={error}
            shelf={shelf}
            onSubmit={handleSubmit}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="section-manager">
      <div className="section-manager-header">
        <div className="detail-label-minimal">Sektionen</div>
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

      <div className="sections-tiles">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className="section-tile"
            onClick={() => onSectionClick(section)}
          >
            <div className="section-tile-code">{section.code}</div>
            <div className="section-tile-name">{section.name}</div>
            <div className="section-tile-count">{section.mineral_count || 0}</div>
            {isAuthenticated && (
              <div className="section-tile-actions" onClick={e => e.stopPropagation()}>
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
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <SectionFormModal
          editingSection={editingSection}
          formData={formData}
          setFormData={setFormData}
          saving={saving}
          error={error}
          shelf={shelf}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────
interface SectionFormModalProps {
  editingSection: any;
  formData: SectionFormData;
  setFormData: (d: SectionFormData) => void;
  saving: boolean;
  error: string | null;
  shelf: any;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function SectionFormModal({ editingSection, formData, setFormData, saving, error, shelf, onSubmit, onClose }: SectionFormModalProps) {
  return (
    <div className="section-form-overlay" onClick={onClose}>
      <div className="section-form-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-minimal" onClick={onClose}>×</button>

        <div className="modal-header-minimal">
          <h3 className="modal-title-minimal" style={{ fontSize: 'var(--font-size-lg)' }}>
            {editingSection ? 'Sektion bearbeiten' : 'Neue Sektion'}
          </h3>
          <div className="modal-subtitle-minimal">{shelf.full_code} – {shelf.name || shelf.shelf_name}</div>
        </div>

        <div className="modal-body-minimal">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="sec-name">Name</label>
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
              <label htmlFor="sec-code">Code</label>
              <input
                id="sec-code"
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="z.B. A, B, O, U"
                required
                maxLength={10}
              />
              <small style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 4, display: 'block' }}>
                Code: {shelf.full_code}-{formData.code || '?'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="sec-desc">
                Beschreibung <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                id="sec-desc"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {error && <div className="add-minerals-message error">{error}</div>}

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
              <button type="button" className="btn-minimal" onClick={onClose} style={{ flex: 1 }}>Abbrechen</button>
              <button type="submit" className="btn-minimal primary" disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Speichern...' : editingSection ? 'Speichern' : 'Hinzufügen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}