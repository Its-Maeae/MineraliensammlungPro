import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mineral } from '../types';

const genId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

interface AddMineralsToBoxModalProps {
  /**
   * shelf object. When a section is targeted, it carries extra fields:
   *   _sectionId: number
   *   _sectionCode: string  (full code like "V01-01-A")
   */
  shelf: any;
  onClose: () => void;
  onMineralsAdded: () => void;
}

interface MineralEntry {
  id: string;
  number: string;
  status: 'idle' | 'loading' | 'success' | 'error' | 'already_assigned';
  mineral?: Mineral;
  errorMessage?: string;
}

export default function AddMineralsToBoxModal({ shelf, onClose, onMineralsAdded }: AddMineralsToBoxModalProps) {
  const [entries, setEntries] = useState<MineralEntry[]>([
    { id: genId(), number: '', status: 'idle' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const lastInputRef = useRef<HTMLInputElement>(null);

  // Are we targeting a section or the box directly?
  const targetSectionId: number | undefined = shelf._sectionId;
  const targetCode: string = shelf._sectionCode ?? shelf.full_code;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (modalOverlayRef.current && target === modalOverlayRef.current) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 100);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handleClickOutside); };
  }, [onClose]);

  const lookupMineral = useCallback(async (number: string): Promise<{ mineral?: Mineral; error?: string }> => {
    if (!number.trim()) return { error: 'Leere Nummer' };
    try {
      const res = await fetch(`/api/minerals?search=${encodeURIComponent(number.trim())}&limit=50`);
      if (!res.ok) return { error: 'Fehler beim Suchen' };
      const data: Mineral[] = await res.json();
      const exact = data.find(m => m.number.toLowerCase() === number.trim().toLowerCase());
      if (!exact) return { error: `Nr. ${number} nicht gefunden` };
      return { mineral: exact };
    } catch {
      return { error: 'Verbindungsfehler' };
    }
  }, []);

  const handleNumberBlur = useCallback(async (id: string, number: string) => {
    if (!number.trim()) return;

    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'loading' } : e));
    const { mineral, error } = await lookupMineral(number);

    if (error) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'error', errorMessage: error } : e));
      return;
    }

    // Check if already in target section
    if (targetSectionId && mineral!.section_id === targetSectionId) {
      setEntries(prev => prev.map(e => e.id === id ? {
        ...e, status: 'error', mineral, errorMessage: 'Bereits in dieser Sektion'
      } : e));
      return;
    }

    // Check if in box (no section target) and already there
    if (!targetSectionId && mineral!.shelf_id === shelf.id && !mineral!.section_id) {
      setEntries(prev => prev.map(e => e.id === id ? {
        ...e, status: 'error', mineral, errorMessage: 'Bereits direkt in dieser Box'
      } : e));
      return;
    }

    // Warn if already assigned elsewhere
    const assignedElsewhere =
      targetSectionId
        ? (mineral!.section_id && mineral!.section_id !== targetSectionId)
        : (mineral!.shelf_id && mineral!.shelf_id !== shelf.id);

    if (assignedElsewhere) {
      const where = mineral!.section_id
        ? `${mineral!.showcase_code}-${mineral!.shelf_code}-${mineral!.section_code}`
        : `${mineral!.showcase_code}-${mineral!.shelf_code}`;
      setEntries(prev => prev.map(e => e.id === id ? {
        ...e, status: 'already_assigned', mineral,
        errorMessage: `Bereits in ${where} zugeordnet`
      } : e));
      return;
    }

    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'success', mineral } : e));
  }, [lookupMineral, shelf.id, targetSectionId]);

  const handleNumberChange = (id: string, value: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, number: value, status: 'idle', mineral: undefined, errorMessage: undefined } : e
    ));
  };

  const addRow = () => {
    setEntries(prev => [...prev, { id: genId(), number: '', status: 'idle' }]);
    setTimeout(() => lastInputRef.current?.focus(), 50);
  };

  const removeRow = (id: string) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.id !== id);
      return filtered.length === 0 ? [{ id: genId(), number: '', status: 'idle' }] : filtered;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const current = entries.find(en => en.id === id);
      if (current?.number.trim()) {
        handleNumberBlur(id, current.number);
        addRow();
      }
    }
  };

  const handleSave = async () => {
    const toAssign = entries.filter(e => e.status === 'success' && e.mineral);
    if (toAssign.length === 0) {
      setGlobalMessage({ type: 'error', text: 'Keine gültigen Mineralien zum Hinzufügen.' });
      return;
    }

    setIsSaving(true);
    setGlobalMessage(null);
    let successCount = 0;
    let failCount = 0;

    for (const entry of toAssign) {
      try {
        const formData = new FormData();
        formData.append('name', entry.mineral!.name);
        formData.append('number', entry.mineral!.number);
        formData.append('color', entry.mineral!.color || '');
        formData.append('description', entry.mineral!.description || '');
        formData.append('location', entry.mineral!.location || '');
        formData.append('purchase_location', entry.mineral!.purchase_location || '');
        formData.append('rock_type', entry.mineral!.rock_type || '');
        // Always set shelf_id
        formData.append('shelf_id', shelf.id.toString());
        // Set section_id if targeting a section, else clear it
        if (targetSectionId) {
          formData.append('section_id', targetSectionId.toString());
        } else {
          formData.append('section_id', '');
        }
        if (entry.mineral!.latitude != null) formData.append('latitude', entry.mineral!.latitude.toString());
        if (entry.mineral!.longitude != null) formData.append('longitude', entry.mineral!.longitude.toString());
        formData.append('is_undetermined', entry.mineral!.is_undetermined ? 'true' : 'false');
        if (entry.mineral!.suspected_name) formData.append('suspected_name', entry.mineral!.suspected_name);

        const res = await fetch(`/api/minerals/${entry.mineral!.id}`, { method: 'PUT', body: formData });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setIsSaving(false);

    if (successCount > 0) {
      setGlobalMessage({
        type: 'success',
        text: `${successCount} Mineral${successCount > 1 ? 'ien' : ''} erfolgreich hinzugefügt${failCount > 0 ? `, ${failCount} fehlgeschlagen` : ''}.`,
      });
      onMineralsAdded();
      setTimeout(() => onClose(), 1500);
    } else {
      setGlobalMessage({ type: 'error', text: 'Fehler beim Hinzufügen der Mineralien.' });
    }
  };

  const validCount = entries.filter(e => e.status === 'success').length;

  return (
    <div className="modal-minimal add-minerals-overlay" ref={modalOverlayRef}>
      <div className="modal-content-minimal add-minerals-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-minimal" onClick={onClose}>×</button>

        <div className="modal-header-minimal">
          <h2 className="modal-title-minimal">
            Mineralien hinzufügen
            <span className="regal-code-badge">{targetCode}</span>
          </h2>
          <div className="modal-subtitle-minimal">
            {targetSectionId
              ? `Sektion ${targetCode} · Steinnummern eingeben`
              : `Direkt in Box ${shelf.full_code} · Steinnummern eingeben`}
          </div>
          {targetSectionId && (
            <div className="remove-mode-hint" style={{ marginTop: 8 }}>
              Mineralien werden der Sektion <strong>{targetCode}</strong> zugeordnet.
            </div>
          )}
        </div>

        <div className="modal-body-minimal">
          <div className="add-minerals-list">
            {entries.map((entry, index) => (
              <div key={entry.id} className={`add-mineral-row status-${entry.status}`}>
                <div className="add-mineral-row-number">
                  <span className="row-index">{index + 1}</span>
                </div>

                <div className="add-mineral-input-wrap">
                  <input
                    ref={index === entries.length - 1 ? lastInputRef : undefined}
                    type="text"
                    className="add-mineral-input"
                    placeholder="Steinnummer..."
                    value={entry.number}
                    onChange={e => handleNumberChange(entry.id, e.target.value)}
                    onBlur={e => handleNumberBlur(entry.id, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, entry.id)}
                    autoFocus={index === entries.length - 1 && index > 0}
                  />
                </div>

                <div className="add-mineral-status">
                  {entry.status === 'loading' && <span className="status-spinner">⟳</span>}
                  {entry.status === 'success' && <span className="status-ok" title={entry.mineral?.name}>✓</span>}
                  {(entry.status === 'error' || entry.status === 'already_assigned') && (
                    <span className="status-err" title={entry.errorMessage}>✕</span>
                  )}
                </div>

                <div className="add-mineral-info">
                  {entry.status === 'success' && entry.mineral && (
                    <span className="mineral-preview-name">{entry.mineral.name}</span>
                  )}
                  {(entry.status === 'error' || entry.status === 'already_assigned') && (
                    <span className="mineral-preview-error">{entry.errorMessage}</span>
                  )}
                </div>

                <button className="remove-row-btn" onClick={() => removeRow(entry.id)} type="button">−</button>
              </div>
            ))}
          </div>

          <button className="add-row-btn" onClick={addRow} type="button">+ Zeile hinzufügen</button>

          {globalMessage && (
            <div className={`add-minerals-message ${globalMessage.type}`}>{globalMessage.text}</div>
          )}
        </div>

        <div className="admin-buttons-minimal">
          <button className="btn-minimal" onClick={onClose} type="button">Abbrechen</button>
          <button
            className="btn-minimal primary"
            onClick={handleSave}
            disabled={isSaving || validCount === 0}
            type="button"
          >
            {isSaving
              ? 'Wird gespeichert...'
              : validCount > 0
                ? `${validCount} Mineral${validCount > 1 ? 'ien' : ''} hinzufügen`
                : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );
}