import React, { useEffect, useState } from 'react';
import { Stats } from '../types';
import MapSelector from './MapSelector';

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
}

interface ShelfOption {
  id: number;
  name: string;
  showcase_name: string;
  full_code: string;
}

const FORM_STORAGE_KEY = 'mineralFormData';
const IMAGE_STORAGE_KEY = 'mineralFormImage';

const EXAMPLE_ROCK_TYPES = [
  'Magmatisch',
  'Sedimentär',
  'Metamorph',
  'Plutonit',
  'Vulkanit',
  'Klastisch',
  'Chemisch',
  'Organogen',
  'Gneis',
  'Schiefer',
  'Marmor',
  'Quarzit'
];

export default function AdminPage({ isAuthenticated, onSuccess, showPage }: AdminPageProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    if (!confirm('Möchten Sie sich wirklich abmelden?')) {
      return;
    }

    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Erfolgreich abgemeldet');
        window.location.reload();
      } else {
        alert('Fehler beim Abmelden');
      }
    } catch (error) {
      console.error('Logout-Fehler:', error);
      alert('Fehler beim Abmelden');
    } finally {
      setLoggingOut(false);
    }
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
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 className="page-title">Verwaltung</h1>
            <p className="page-description">Neue Mineralien zur Sammlung hinzufügen</p>
          </div>
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-secondary"
            style={{ height: 'fit-content' }}
          >
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

function SimpleAutocomplete({ 
  value, 
  onChange, 
  existingValues,
  id,
  placeholder
}: { 
  value: string; 
  onChange: (value: string) => void; 
  existingValues: string[];
  id: string;
  placeholder: string;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (value.trim().length === 0) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTerm = value.toLowerCase();
    const filtered: string[] = [];

    if (existingValues && existingValues.length > 0) {
      existingValues.forEach(val => {
        if (val && val.toLowerCase().includes(searchTerm)) {
          filtered.push(val);
        }
      });
    }

    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [value, existingValues]);

  const handleSelect = (val: string) => {
    onChange(val);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => {
          if (value.trim().length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        required
        autoComplete="off"
        style={{ width: '100%' }}
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="autocomplete-item"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion);
              }}
            >
              <span className="autocomplete-value">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RockTypeAutocomplete({ 
  value, 
  onChange, 
  existingRockTypes 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  existingRockTypes: string[] 
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Array<{type: string, source: string}>>([]);

  useEffect(() => {
    if (value.trim().length === 0) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTerm = value.toLowerCase();
    const allSuggestions: Array<{type: string, source: string}> = [];

    if (existingRockTypes && existingRockTypes.length > 0) {
      existingRockTypes.forEach(type => {
        if (type && type.toLowerCase().includes(searchTerm)) {
          allSuggestions.push({ type, source: 'database' });
        }
      });
    }

    EXAMPLE_ROCK_TYPES.forEach(type => {
      if (type.toLowerCase().includes(searchTerm)) {
        const alreadyInDatabase = existingRockTypes && existingRockTypes.some(
          existing => existing && existing.toLowerCase() === type.toLowerCase()
        );
        if (!alreadyInDatabase) {
          allSuggestions.push({ type, source: 'example' });
        }
      }
    });

    setFilteredSuggestions(allSuggestions);
    setShowSuggestions(allSuggestions.length > 0);
  }, [value, existingRockTypes]);

  const handleSelect = (type: string) => {
    onChange(type);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        id="rock_type"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => {
          if (value.trim().length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={handleBlur}
        placeholder="z.B. magmatisch, sedimentär, metamorph"
        required
        autoComplete="off"
        style={{ width: '100%' }}
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="autocomplete-item"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion.type);
              }}
            >
              <span className="autocomplete-value">{suggestion.type}</span>
              <span className={`autocomplete-source ${suggestion.source}`}>
                {suggestion.source === 'database' ? 'Aus Datenbank' : 'Beispiel'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MineralForm({ onSuccess, showPage }: { onSuccess: () => void; showPage?: (page: string) => void }) {
  const getInitialFormData = (): MineralFormData => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Fehler beim Laden der gespeicherten Formulardaten:', e);
        }
      }
    }
    return {
      name: '',
      number: '',
      color: '',
      description: '',
      location: '',
      purchase_location: '',
      rock_type: '',
      shelf_id: '',
      latitude: null,
      longitude: null
    };
  };

  const [formData, setFormData] = useState<MineralFormData>(getInitialFormData);
  const [image, setImage] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string>('');
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

  useEffect(() => {
    loadShelves();
    loadExistingRockTypes();
    loadFilterOptions();
    
    if (typeof window !== 'undefined') {
      const savedImageName = sessionStorage.getItem(IMAGE_STORAGE_KEY);
      if (savedImageName) {
        setImageName(savedImageName);
      }
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

  const loadShelves = async () => {
    try {
      const response = await fetch('/api/shelves');
      if (response.ok) {
        const data = await response.json();
        setShelves(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Regale:', error);
    }
  };

  const loadExistingRockTypes = async () => {
    try {
      const response = await fetch('/api/filter-options');
      if (response.ok) {
        const data = await response.json();
        setExistingRockTypes(data.rock_types || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Gesteinsarten:', error);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await fetch('/api/filter-options');
      if (response.ok) {
        const data = await response.json();
        setExistingColors(data.colors || []);
        setExistingLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Filteroptionen:', error);
    }
  };

  const checkMineralNumber = async (number: string) => {
    if (!number.trim()) {
      setNumberExists(false);
      return;
    }

    try {
      setCheckingNumber(true);
      const response = await fetch(`/api/minerals/check-number?number=${encodeURIComponent(number.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        setNumberExists(data.exists);
      }
    } catch (error) {
      console.error('Fehler beim Überprüfen der Nummer:', error);
    } finally {
      setCheckingNumber(false);
    }
  };

  const handleNumberChange = (value: string) => {
    setFormData(prevData => ({ ...prevData, number: value }));
    
    if (numberCheckTimeout) {
      clearTimeout(numberCheckTimeout);
    }
    
    const timeout = setTimeout(() => {
      checkMineralNumber(value);
    }, 500);
    
    setNumberCheckTimeout(timeout);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prevData => ({
      ...prevData,
      latitude: lat,
      longitude: lng
    }));
  };

  const generateAIDescription = async () => {
    if (!formData.name.trim()) {
      alert('Bitte geben Sie zuerst einen Mineralnamen ein.');
      return;
    }

    setGeneratingAI(true);

    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mineralName: formData.name.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prevData => ({ 
          ...prevData, 
          description: data.description 
        }));
      } else {
        const error = await response.text();
        alert('Fehler bei der KI-Generierung: ' + error);
      }
    } catch (error) {
      console.error('Fehler bei der KI-Generierung:', error);
      alert('Fehler bei der KI-Generierung');
    } finally {
      setGeneratingAI(false);
    }
  };

  useEffect(() => {
    return () => {
      if (numberCheckTimeout) {
        clearTimeout(numberCheckTimeout);
      }
    };
  }, [numberCheckTimeout]);

  const clearFormData = () => {
    const emptyData: MineralFormData = {
      name: '',
      number: '',
      color: '',
      description: '',
      location: '',
      purchase_location: '',
      rock_type: '',
      shelf_id: '',
      latitude: null,
      longitude: null
    };
    setFormData(emptyData);
    setImage(null);
    setImageName('');
    setImagePreview(null);
    setNumberExists(false);
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(FORM_STORAGE_KEY);
      sessionStorage.removeItem(IMAGE_STORAGE_KEY);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== SESSION DEBUG START ===');
    
    try {
      const sessionCheck = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Session Check Status:', sessionCheck.status);
      const sessionData = await sessionCheck.json();
      console.log('Session Check Response:', sessionData);
      
      if (!sessionCheck.ok) {
        alert('Session ist nicht gültig! Bitte melden Sie sich erneut an.\n\nDetails: ' + JSON.stringify(sessionData));
        return;
      }
    } catch (error) {
      console.error('Session Check Error:', error);
      alert('Fehler beim Prüfen der Session. Bitte neu anmelden.');
      return;
    }
    
    console.log('Session ist gültig!');
    console.log('Cookies:', document.cookie);
    
    if (numberExists) {
      alert('Diese Steinnummer existiert bereits. Bitte wählen Sie eine andere Nummer.');
      return;
    }

    if (!formData.number.trim()) {
      alert('Bitte geben Sie eine Steinnummer ein.');
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          form.append(key, value.toString());
        }
      });
      if (image) {
        form.append('image', image);
      }

      console.log('Sende Request zu /api/minerals...');
      console.log('FormData Felder:', Array.from(form.keys()));

      const response = await fetch('/api/minerals', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });

      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Erfolg:', result);
        clearFormData();
        onSuccess();
        alert('Mineral erfolgreich hinzugefügt!');
      } else {
        const errorText = await response.text();
        console.error('Fehler Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        alert('Fehler beim Hinzufügen:\n\n' + JSON.stringify(errorData, null, 2));
      }
    } catch (error) {
      console.error('Exception beim Hinzufügen des Minerals:', error);
      alert('Fehler beim Hinzufügen des Minerals: ' + error);
    } finally {
      setLoading(false);
    }
    
    console.log('=== SESSION DEBUG END ===');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    processImageFile(file);
  };

  const processImageFile = (file: File | null) => {
    setImage(file);
    setImageName(file ? file.name : '');
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    } else {
      alert('Bitte nur Bilddateien hochladen');
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageName('');
    setImagePreview(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name des Minerals</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prevData => ({ ...prevData, name: e.target.value }))}
          placeholder="z.B. Quarz, Pyrit, Amethyst"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="number">Steinnummer</label>
        <div className="number-input-container">
          <input
            type="text"
            id="number"
            value={formData.number}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder="Eindeutige Identifikationsnummer"
            className={`number-input ${numberExists ? 'error' : formData.number.trim() && !checkingNumber && !numberExists ? 'success' : ''}`}
            required
            autoComplete='off'
          />
          <div className="number-validation-indicator">
            {checkingNumber && (
              <span className="checking-indicator">
                <span className="spinner"></span>
                Überprüfe...
              </span>
            )}
            {!checkingNumber && formData.number.trim() && numberExists && (
              <span className="error-indicator">
                Diese Nummer existiert bereits
              </span>
            )}
            {!checkingNumber && formData.number.trim() && !numberExists && (
              <span className="success-indicator">
                Nummer verfügbar
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="color">Farbe</label>
        <SimpleAutocomplete
          id="color"
          value={formData.color}
          onChange={(value) => setFormData(prevData => ({ ...prevData, color: value }))}
          existingValues={existingColors}
          placeholder="Hauptfarbe des Minerals"
        />
      </div>

     <div className="form-group">
        <label htmlFor="description">Beschreibung</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prevData => ({ ...prevData, description: e.target.value }))}
          placeholder="Detaillierte Beschreibung, Besonderheiten, chemische Formel..."
          required
        />
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '4px 8px' }}
            onClick={() => setFormData(prevData => ({ 
              ...prevData, 
              description: prevData.description + (prevData.description ? '\n\n' : '') + 'Quelle: Buch: Mineralien Bestimmen, Kennenlernen, Sammeln (Rupert Hochleitner) '
            }))}
          >
            Quelle: Hochleitner
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '4px 8px' }}
            onClick={() => setFormData(prevData => ({ 
              ...prevData, 
              description: prevData.description + (prevData.description ? '\n\n' : '') + 'Quelle: Buch: Minerale Arthia (Jaroslav Svenek und Ladislav Pros)'
            }))}
          >
            Quelle: Svenek/Pros
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '11px', padding: '4px 8px' }}
            onClick={generateAIDescription}
            disabled={!formData.name.trim() || generatingAI}
          >
            {generatingAI ? 'Generiere...' : 'KI-Beschreibung'}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="location">Fundort (Text)</label>
        <SimpleAutocomplete
          id="location"
          value={formData.location}
          onChange={(value) => setFormData(prevData => ({ ...prevData, location: value }))}
          existingValues={existingLocations}
          placeholder="Geographische Herkunft"
        />
      </div>

      <div className="form-group">
        <label htmlFor="purchase_location">Kaufort</label>
        <input
          type="text"
          id="purchase_location"
          value={formData.purchase_location}
          onChange={(e) => setFormData(prevData => ({ ...prevData, purchase_location: e.target.value }))}
          placeholder="Wo wurde es erworben?"
          required
          autoComplete='off'
        />
      </div>

      <div className="form-group">
        <label htmlFor="rock_type">Gesteinsart</label>
        <RockTypeAutocomplete
          value={formData.rock_type}
          onChange={(value) => setFormData(prevData => ({ ...prevData, rock_type: value }))}
          existingRockTypes={existingRockTypes}
        />
      </div>

      <div className="form-group">
        <label htmlFor="shelf_id">Regal</label>
        <select
          id="shelf_id"
          value={formData.shelf_id}
          onChange={(e) => setFormData(prevData => ({ ...prevData, shelf_id: e.target.value }))}
        >
          <option value="">Kein Regal zugeordnet</option>
          {shelves.map(shelf => (
            <option key={shelf.id} value={shelf.id}>
              {shelf.showcase_name} - {shelf.name} ({shelf.full_code})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Fundort auf Karte markieren (optional)</label>
        <MapSelector
          latitude={formData.latitude}
          longitude={formData.longitude}
          onLocationSelect={handleLocationSelect}
        />
        {formData.latitude && formData.longitude && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            Koordinaten: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="image">Bild hochladen</label>
        <div 
          className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image')?.click()}
        >
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Vorschau" className="image-preview" />
              <button 
                type="button" 
                className="remove-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
              >
                ✕
              </button>
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
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          type="submit" 
          disabled={loading || numberExists || checkingNumber || !formData.number.trim()} 
          className="btn btn-primary btn-large"
        >
          {loading ? 'Wird hinzugefügt...' : 'Mineral hinzufügen'}
        </button>
        
        <button 
          type="button"
          onClick={clearFormData}
          className="btn btn-secondary btn-large"
          disabled={loading}
        >
          Formular leeren
        </button>

        <button 
          type="button"
          onClick={() => {
            console.log('Security Button clicked, showPage:', showPage);
            if (showPage) {
              showPage('security');
            } else {
              alert('showPage function nicht verfügbar!');
            }
          }}
          className="btn btn-secondary btn-large"
        >
          Security-Logs
        </button>
      </div>
    </form>
  );
}