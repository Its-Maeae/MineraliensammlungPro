import React, { useEffect, useState } from 'react';
import { Stats } from '../types';
import MapSelector from './MapSelector';

interface AdminPageProps {
  isAuthenticated: boolean;
  onSuccess: () => void;
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

export default function AdminPage({ isAuthenticated, onSuccess }: AdminPageProps) {
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
        <div className="page-header">
          <h1 className="page-title">Verwaltung</h1>
          <p className="page-description">Neue Mineralien zur Sammlung hinzufügen</p>
        </div>
        
        <div className="admin-form-container">
          <MineralForm onSuccess={onSuccess} />
        </div>
      </div>
    </section>
  );
}

function MineralForm({ onSuccess }: { onSuccess: () => void }) {
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
  const [loading, setLoading] = useState(false);
  const [shelves, setShelves] = useState<ShelfOption[]>([]);
  const [numberExists, setNumberExists] = useState(false);
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [numberCheckTimeout, setNumberCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadShelves();
    
    // Gespeicherten Bildnamen laden
    if (typeof window !== 'undefined') {
      const savedImageName = sessionStorage.getItem(IMAGE_STORAGE_KEY);
      if (savedImageName) {
        setImageName(savedImageName);
      }
    }
  }, []);

  // Formulardaten im SessionStorage speichern
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  // Bildnamen im SessionStorage speichern
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
      } else {
        console.error('Fehler beim Überprüfen der Nummer:', response.statusText);
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
    setNumberExists(false);
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(FORM_STORAGE_KEY);
      sessionStorage.removeItem(IMAGE_STORAGE_KEY);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      const response = await fetch('/api/minerals', {
        method: 'POST',
        body: form
      });

      if (response.ok) {
        clearFormData();
        onSuccess();
        alert('Mineral erfolgreich hinzugefügt!');
      } else {
        const error = await response.text();
        alert('Fehler: ' + error);
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Minerals:', error);
      alert('Fehler beim Hinzufügen des Minerals');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setImageName(file ? file.name : '');
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
        <input
          type="text"
          id="color"
          value={formData.color}
          onChange={(e) => setFormData(prevData => ({ ...prevData, color: e.target.value }))}
          placeholder="Hauptfarbe des Minerals"
          required
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
            onClick={() => setFormData(prevData => ({ 
              ...prevData, 
              description: prevData.description + (prevData.description ? '\n\n' : '') + 'Quelle: Buch: Mineralien Bestimmen, Kennenlernen, Sammeln (Rupert Hochleitner)'
            }))}
          >
            Quelle: Mineralien Bestimmen (Hochleitner)
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setFormData(prevData => ({ 
              ...prevData, 
              description: prevData.description + (prevData.description ? '\n\n' : '') + 'Quelle: Buch: Minerale Arthia (Jaroslav Svenek und Ladislav Pros) S.176'
            }))}
          >
            Quelle: Minerale Arthia (Svenek/Pros) S.176
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="location">Fundort (Text)</label>
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prevData => ({ ...prevData, location: e.target.value }))}
          placeholder="Geographische Herkunft"
          required
        />
      </div>

      <div className="form-group">
        <label>Fundort auf Karte markieren (optional)</label>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          Klicken Sie auf die Karte, um den genauen Fundort zu markieren
        </p>
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
        <label htmlFor="purchase_location">Kaufort</label>
        <input
          type="text"
          id="purchase_location"
          value={formData.purchase_location}
          onChange={(e) => setFormData(prevData => ({ ...prevData, purchase_location: e.target.value }))}
          placeholder="Wo wurde es erworben?"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="rock_type">Gesteinsart</label>
        <input
          type="text"
          id="rock_type"
          value={formData.rock_type}
          onChange={(e) => setFormData(prevData => ({ ...prevData, rock_type: e.target.value }))}
          placeholder="z.B. magmatisch, sedimentär, metamorph"
          required
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
        <label htmlFor="image">Bild hochladen</label>
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imageName && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            Ausgewähltes Bild: {imageName}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
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
      </div>
    </form>
  );
}