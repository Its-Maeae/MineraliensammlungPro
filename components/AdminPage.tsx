import React, { useEffect, useState } from 'react';
import MapSelector from './MapSelector';
import ShelfSelector from './ShelfSelector';

interface AdminPageProps {
  isAuthenticated: boolean;
  onSuccess: () => void;
  showPage?: (page: string) => void;
}

interface MineralFormData {
  name: string;
  number: string;
  color: string;
  description: string;
  location: string;
  purchase_location: string;
  rock_type: string;
  shelf_id: string;
  latitude: number | null;
  longitude: number | null;
  is_undetermined: boolean;
  suspected_name: string;
}

interface ShelfOption {
  id: number;
  name: string;
  showcase_name: string;
  showcase_code: string;
  code: string;
  full_code: string;
  mineral_count?: number;
}

const FORM_STORAGE_KEY = 'mineralFormData';
const IMAGE_STORAGE_KEY = 'mineralFormImage';

const EXAMPLE_ROCK_TYPES = [
  'Magmatisch', 'Sedimentär', 'Metamorph', 'Plutonit', 'Vulkanit',
  'Klastisch', 'Chemisch', 'Organogen', 'Gneis', 'Schiefer', 'Marmor', 'Quarzit'
];

export default function AdminPage({ isAuthenticated, onSuccess, showPage }: AdminPageProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Möchten Sie sich wirklich abmelden?')) return;
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (response.ok) { alert('Erfolgreich abgemeldet'); window.location.reload(); }
      else alert('Fehler beim Abmelden');
    } catch { alert('Fehler beim Abmelden'); }
    finally { setLoggingOut(false); }
  };

  if (!isAuthenticated) {
    return (
      <section className="page active">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Zugriff verweigert</h1>
            <p className="page-description">Sie müssen angemeldet sein, um diese Seite zu sehen.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page active">
      <div className="container">
        <div className="admin-page-header">
          <div>
            <h1 className="page-title">Verwaltung</h1>
            <p className="page-description">Neue Mineralien zur Sammlung hinzufügen</p>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} className="btn btn-secondary">
            {loggingOut ? 'Wird abgemeldet...' : 'Abmelden'}
          </button>
        </div>

        <div className="admin-form-container">
          <MineralForm onSuccess={onSuccess} showPage={showPage} />
        </div>
      </div>
    </section>
  );
}

// ─── Autocomplete für einfache Textfelder ───────────────────────────────────

function SimpleAutocomplete({
  value, onChange, existingValues, id, placeholder, disabled
}: {
  value: string; onChange: (v: string) => void; existingValues: string[];
  id: string; placeholder: string; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);

  useEffect(() => {
    if (!value.trim()) { setFiltered([]); setShow(false); return; }
    const term = value.toLowerCase();
    const result = existingValues.filter(v => v && v.toLowerCase().includes(term));
    setFiltered(result);
    setShow(result.length > 0);
  }, [value, existingValues]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text" id={id} value={value} placeholder={placeholder}
        disabled={disabled} required={!disabled} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => { if (value.trim()) setShow(true); }}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        style={{ width: '100%' }}
      />
      {!disabled && show && filtered.length > 0 && (
        <div className="autocomplete-dropdown">
          {filtered.map((s, i) => (
            <div key={i} className="autocomplete-item"
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setShow(false); }}>
              <span className="autocomplete-value">{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Autocomplete für Gesteinsarten ─────────────────────────────────────────

function RockTypeAutocomplete({
  value, onChange, existingRockTypes, disabled
}: {
  value: string; onChange: (v: string) => void;
  existingRockTypes: string[]; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [filtered, setFiltered] = useState<Array<{ type: string; source: string }>>([]);

  useEffect(() => {
    if (!value.trim()) { setFiltered([]); setShow(false); return; }
    const term = value.toLowerCase();
    const result: Array<{ type: string; source: string }> = [];
    existingRockTypes.forEach(t => {
      if (t && t.toLowerCase().includes(term)) result.push({ type: t, source: 'database' });
    });
    EXAMPLE_ROCK_TYPES.forEach(t => {
      if (t.toLowerCase().includes(term) &&
          !existingRockTypes.some(e => e?.toLowerCase() === t.toLowerCase())) {
        result.push({ type: t, source: 'example' });
      }
    });
    setFiltered(result);
    setShow(result.length > 0);
  }, [value, existingRockTypes]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text" id="rock_type" value={value}
        placeholder="z.B. magmatisch, sedimentär, metamorph"
        disabled={disabled} required={!disabled} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => { if (value.trim()) setShow(true); }}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        style={{ width: '100%' }}
      />
      {!disabled && show && filtered.length > 0 && (
        <div className="autocomplete-dropdown">
          {filtered.map((s, i) => (
            <div key={i} className="autocomplete-item"
              onMouseDown={(e) => { e.preventDefault(); onChange(s.type); setShow(false); }}>
              <span className="autocomplete-value">{s.type}</span>
              <span className={`autocomplete-source ${s.source}`}>
                {s.source === 'database' ? 'Aus Datenbank' : 'Beispiel'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hauptformular ───────────────────────────────────────────────────────────

function MineralForm({ onSuccess, showPage }: { onSuccess: () => void; showPage?: (page: string) => void }) {
  const getInitialFormData = (): MineralFormData => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (saved) { try { return JSON.parse(saved); } catch {} }
    }
    return {
      name: '', number: '', color: '', description: '', location: '',
      purchase_location: '', rock_type: '', shelf_id: '',
      latitude: null, longitude: null, is_undetermined: false, suspected_name: ''
    };
  };

  const [formData, setFormData] = useState<MineralFormData>(getInitialFormData);
  const [image, setImage] = useState<File | null>(null);
  const [imageName, setImageName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [shelves, setShelves] = useState<ShelfOption[]>([]);
  const [existingRockTypes, setExistingRockTypes] = useState<string[]>([]);
  const [existingColors, setExistingColors] = useState<string[]>([]);
  const [existingLocations, setExistingLocations] = useState<string[]>([]);
  const [numberExists, setNumberExists] = useState(false);
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [numberCheckTimeout, setNumberCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const isUndetermined = formData.is_undetermined;

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [shelvesRes, filterRes] = await Promise.all([
          fetch('/api/shelves'),
          fetch('/api/filter-options')
        ]);
        if (shelvesRes.ok) setShelves(await shelvesRes.json());
        if (filterRes.ok) {
          const data = await filterRes.json();
          setExistingColors(data.colors || []);
          setExistingLocations(data.locations || []);
          setExistingRockTypes(data.rock_types || []);
        }
      } catch {}
    };
    loadAll();

    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(IMAGE_STORAGE_KEY);
      if (saved) setImageName(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && imageName) {
      sessionStorage.setItem(IMAGE_STORAGE_KEY, imageName);
    }
  }, [imageName]);

  const handleUndeterminedToggle = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        name: 'Unbestimmtes Mineral',
        description: '', location: '',
        purchase_location: '', rock_type: '',
        is_undetermined: true
        // color und suspected_name werden bewusst beibehalten
      }));
    } else {
      setFormData(prev => ({ ...prev, name: '', is_undetermined: false, suspected_name: '' }));
    }
  };

  const checkMineralNumber = async (number: string) => {
    if (!number.trim()) { setNumberExists(false); return; }
    try {
      setCheckingNumber(true);
      const res = await fetch(`/api/minerals/check-number?number=${encodeURIComponent(number.trim())}`);
      if (res.ok) setNumberExists((await res.json()).exists);
    } catch {}
    finally { setCheckingNumber(false); }
  };

  const handleNumberChange = (value: string) => {
    setFormData(prev => ({ ...prev, number: value }));
    if (numberCheckTimeout) clearTimeout(numberCheckTimeout);
    setNumberCheckTimeout(setTimeout(() => checkMineralNumber(value), 500));
  };

  const generateAIDescription = async () => {
    if (!formData.name.trim()) { alert('Bitte zuerst einen Mineralnamen eingeben.'); return; }
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mineralName: formData.name.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, description: data.description }));
      } else {
        alert('Fehler bei der KI-Generierung: ' + await res.text());
      }
    } catch { alert('Fehler bei der KI-Generierung'); }
    finally { setGeneratingAI(false); }
  };

  useEffect(() => () => { if (numberCheckTimeout) clearTimeout(numberCheckTimeout); }, [numberCheckTimeout]);

  const clearFormData = () => {
    setFormData({
      name: '', number: '', color: '', description: '', location: '',
      purchase_location: '', rock_type: '', shelf_id: '',
      latitude: null, longitude: null, is_undetermined: false, suspected_name: ''
    });
    setImage(null); setImageName(''); setImagePreview(null); setNumberExists(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(FORM_STORAGE_KEY);
      sessionStorage.removeItem(IMAGE_STORAGE_KEY);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const check = await fetch('/api/auth/check', { method: 'GET', credentials: 'include' });
      if (!check.ok) { alert('Session abgelaufen. Bitte neu anmelden.'); return; }
    } catch { alert('Fehler beim Prüfen der Session.'); return; }

    if (numberExists) { alert('Diese Steinnummer existiert bereits.'); return; }
    if (!formData.number.trim()) { alert('Bitte eine Steinnummer eingeben.'); return; }

    setLoading(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) form.append(key, value.toString());
      });
      if (image) form.append('image', image);

      const res = await fetch('/api/minerals', { method: 'POST', body: form, credentials: 'include' });
      if (res.ok) {
        const wasUndetermined = formData.is_undetermined;
        clearFormData();
        // Schalter-Zustand wiederherstellen
        if (wasUndetermined) {
          setFormData(prev => ({ ...prev, is_undetermined: true, name: 'Unbestimmtes Mineral' }));
        }
        onSuccess();
        alert('Mineral erfolgreich hinzugefügt!');
      } else {
        const text = await res.text();
        let err: any;
        try { err = JSON.parse(text); } catch { err = { error: text }; }
        alert('Fehler: ' + JSON.stringify(err, null, 2));
      }
    } catch (err) {
      alert('Fehler beim Hinzufügen: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const processImageFile = (file: File | null) => {
    setImage(file);
    setImageName(file ? file.name : '');
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Name (versteckt wenn unbestimmt) ── */}
      {!isUndetermined && (
        <div className="form-group">
          <label htmlFor="name">Name des Minerals</label>
          <input
            type="text" id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="z.B. Quarz, Pyrit, Amethyst"
            required
          />
        </div>
      )}

      {/* ── Steinnummer ── */}
      <div className="form-group">
        <label htmlFor="number">Steinnummer</label>
        <div className="number-input-container">
          <input
            type="text" id="number"
            value={formData.number}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder="Eindeutige Identifikationsnummer"
            className={`number-input ${numberExists ? 'error' : formData.number.trim() && !checkingNumber && !numberExists ? 'success' : ''}`}
            required autoComplete="off"
          />
          <div className="number-validation-indicator">
            {checkingNumber && (
              <span className="checking-indicator"><span className="spinner" />Überprüfe...</span>
            )}
            {!checkingNumber && formData.number.trim() && numberExists && (
              <span className="error-indicator">Diese Nummer existiert bereits</span>
            )}
            {!checkingNumber && formData.number.trim() && !numberExists && (
              <span className="success-indicator">Nummer verfügbar</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Farbe (immer sichtbar, auch bei unbestimmten Mineralien) ── */}
      <div className="form-group">
        <label htmlFor="color">Farbe</label>
        <SimpleAutocomplete
          id="color"
          value={formData.color}
          onChange={(v) => setFormData(prev => ({ ...prev, color: v }))}
          existingValues={existingColors}
          placeholder="Hauptfarbe des Minerals"
        />
      </div>

      {/* ── Beschreibung (versteckt wenn unbestimmt) ── */}
      {!isUndetermined && (
        <div className="form-group">
          <label htmlFor="description">Beschreibung</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detaillierte Beschreibung, Besonderheiten, chemische Formel..."
            required
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={() => setFormData(prev => ({
                ...prev,
                description: prev.description + (prev.description ? '\n\n' : '') +
                  'Quelle: Buch: Mineralien Bestimmen, Kennenlernen, Sammeln (Rupert Hochleitner) '
              }))}>
              Quelle: Hochleitner
            </button>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={() => setFormData(prev => ({
                ...prev,
                description: prev.description + (prev.description ? '\n\n' : '') +
                  'Quelle: Buch: Minerale Arthia (Jaroslav Svenek und Ladislav Pros)'
              }))}>
              Quelle: Svenek/Pros
            </button>
            <button type="button" className="btn btn-primary" style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={generateAIDescription}
              disabled={!formData.name.trim() || generatingAI}>
              {generatingAI ? 'Generiere...' : 'KI-Beschreibung'}
            </button>
          </div>
        </div>
      )}

      {/* ── Fundort (versteckt wenn unbestimmt) ── */}
      {!isUndetermined && (
        <div className="form-group">
          <label htmlFor="location">Fundort</label>
          <SimpleAutocomplete
            id="location"
            value={formData.location}
            onChange={(v) => setFormData(prev => ({ ...prev, location: v }))}
            existingValues={existingLocations}
            placeholder="Geographische Herkunft"
          />
        </div>
      )}

      {/* ── Kaufort (versteckt wenn unbestimmt) ── */}
      {!isUndetermined && (
        <div className="form-group">
          <label htmlFor="purchase_location">Kaufort</label>
          <input
            type="text" id="purchase_location"
            value={formData.purchase_location}
            onChange={(e) => setFormData(prev => ({ ...prev, purchase_location: e.target.value }))}
            placeholder="Wo wurde es erworben?"
            required
            autoComplete="off"
          />
        </div>
      )}

      {/* ── Gesteinsart (versteckt wenn unbestimmt) ── */}
      {!isUndetermined && (
        <div className="form-group">
          <label htmlFor="rock_type">Gesteinsart</label>
          <RockTypeAutocomplete
            value={formData.rock_type}
            onChange={(v) => setFormData(prev => ({ ...prev, rock_type: v }))}
            existingRockTypes={existingRockTypes}
          />
        </div>
      )}

      {/* ── Regal ── */}
      <div className="form-group">
        <label htmlFor="shelf_id">Regal</label>
        <ShelfSelector
          shelves={shelves}
          selectedShelfId={formData.shelf_id}
          onChange={(shelfId) => setFormData(prev => ({ ...prev, shelf_id: shelfId }))}
        />
      </div>

      {/* ── Fundort auf Karte ── */}
      <div className="form-group">
        <label>Fundort auf Karte (optional)</label>
        <MapSelector
          latitude={formData.latitude}
          longitude={formData.longitude}
          onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
        />
        {formData.latitude && formData.longitude && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            Koordinaten: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
          </div>
        )}
      </div>

      {/* ── Bild ── */}
      <div className="form-group">
        <label htmlFor="image">Bild hochladen</label>
        <div
          className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault(); setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith('image/')) processImageFile(file);
            else alert('Bitte nur Bilddateien hochladen');
          }}
          onClick={() => document.getElementById('image')?.click()}
        >
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Vorschau" className="image-preview" />
              <button type="button" className="remove-image-btn"
                onClick={(e) => { e.stopPropagation(); processImageFile(null); }}>✕</button>
              <div className="image-name">{imageName}</div>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">📷</div>
              <p>Klicken oder Bild hierher ziehen</p>
              <span className="upload-hint">JPG, PNG oder GIF</span>
            </div>
          )}
        </div>
        <input type="file" id="image" accept="image/*"
          onChange={(e) => processImageFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }} />
      </div>

      {/* ── Aktions-Buttons ── */}
      <div className="admin-action-buttons">
        <button
          type="submit"
          disabled={loading || numberExists || checkingNumber || !formData.number.trim()}
          className="btn btn-primary btn-large">
          {loading ? 'Wird hinzugefügt...' : 'Mineral hinzufügen'}
        </button>
        <button type="button" onClick={clearFormData}
          className="btn btn-secondary btn-large" disabled={loading}>
          Formular leeren
        </button>
        <button type="button" onClick={() => showPage?.('security')}
          className="btn btn-secondary btn-large">
          Security-Logs
        </button>
      </div>

      {/* ── Unbestimmt-Schalter – klein, oben, klar ── */}
      <div className="undetermined-toggle-row">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isUndetermined}
            onChange={(e) => handleUndeterminedToggle(e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
        <span className="undetermined-toggle-row-label">Unbestimmtes Mineral</span>
      </div>

      {/* ── Vermutung (nur wenn Unbestimmt aktiv) ── */}
      {isUndetermined && (
        <div className="form-group suspected-name-group">
          <label htmlFor="suspected_name">Vermuteter Mineralname <span className="label-optional">(optional)</span></label>
          <input
            type="text"
            id="suspected_name"
            value={formData.suspected_name}
            onChange={(e) => setFormData((prev: MineralFormData) => ({ ...prev, suspected_name: e.target.value }))}
            placeholder="z.B. Quarz, Pyrit, Amethyst – noch unsicher"
            autoComplete="off"
          />
          <p className="form-hint">Wird auf der Karte und im Detail als Hinweis angezeigt.</p>
        </div>
      )}

    </form>
  );
}