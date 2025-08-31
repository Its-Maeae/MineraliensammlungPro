import React, { useState, useEffect, useMemo } from 'react';
import { Mineral } from '../types';
import QRCodeGenerator from './QRCodeGenerator';

interface ShelfModalProps {
  shelf: any;
  minerals: Mineral[];
  loading: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onEdit: (shelf: any) => void;
  onDelete: (type: 'shelf', id: number) => void;
  onOpenMineralDetails: (id: number) => void;
  setShowShelfMineralsModal: (show: boolean) => void;
}

export default function ShelfModal({ 
  shelf, 
  minerals, 
  loading, 
  isAuthenticated, 
  onClose, 
  onEdit, 
  onDelete, 
  onOpenMineralDetails,
  setShowShelfMineralsModal 
}: ShelfModalProps) {
  const [showQRGenerator, setShowQRGenerator] = React.useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [rockTypeFilter, setRockTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Generate filter options from minerals in this shelf
  const filterOptions = useMemo(() => {
    const colors = new Set<string>();
    const locations = new Set<string>();
    const rockTypes = new Set<string>();
    
    minerals.forEach(mineral => {
      if (mineral.color) colors.add(mineral.color);
      if (mineral.location) locations.add(mineral.location);
      if (mineral.rock_type) rockTypes.add(mineral.rock_type);
    });
    
    return {
      colors: Array.from(colors).sort(),
      locations: Array.from(locations).sort(),
      rock_types: Array.from(rockTypes).sort()
    };
  }, [minerals]);

  // Filter and sort minerals
  const filteredMinerals = useMemo(() => {
    let filtered = minerals.filter(mineral => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = mineral.name.toLowerCase().includes(searchLower);
        const numberMatch = mineral.number.toLowerCase().includes(searchLower);
        if (!nameMatch && !numberMatch) return false;
      }
      
      // Color filter
      if (colorFilter && mineral.color !== colorFilter) return false;
      
      // Location filter
      if (locationFilter && mineral.location !== locationFilter) return false;
      
      // Rock type filter
      if (rockTypeFilter && mineral.rock_type !== rockTypeFilter) return false;
      
      return true;
    });

    // Sort minerals
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return a.number.localeCompare(b.number);
        case 'color':
          return (a.color || '').localeCompare(b.color || '');
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [minerals, searchTerm, colorFilter, locationFilter, rockTypeFilter, sortBy]);

  // Check if filters are active
  const hasActiveFilters = searchTerm || colorFilter || locationFilter || rockTypeFilter;

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setColorFilter('');
    setLocationFilter('');
    setRockTypeFilter('');
  };

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content shelf-minerals-modal-large">
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>Regal: {shelf.shelf_name}</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-6)' }}>
          {shelf.showcase_name} - {shelf.full_code}
        </p>

        {isAuthenticated && (
          <div className="admin-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => onEdit(shelf)}
            >
              Bearbeiten
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowQRGenerator(!showQRGenerator)}
            >
              {showQRGenerator ? 'QR-Code ausblenden' : 'QR-Code generieren'}
            </button>
            <button 
              className="btn error-btn"
              onClick={() => onDelete('shelf', shelf.id)}
            >
              Löschen
            </button>
          </div>
        )}

        {/* QR-Code Generator Sektion */}
        {isAuthenticated && showQRGenerator && (
          <div style={{ 
            marginBottom: 'var(--space-6)', 
            padding: 'var(--space-4)', 
            backgroundColor: 'var(--gray-50)',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--gray-200)'
          }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>QR-Code für direkten Zugriff</h3>
            <QRCodeGenerator 
              shelfId={shelf.id}
              shelfName={shelf.shelf_name}
              fullCode={shelf.full_code}
            />
          </div>
        )}
        
        {shelf.image_path && (
          <div className="detail-image" style={{ marginBottom: 'var(--space-6)' }}>
            <img src={`/uploads/${shelf.image_path}`} alt={shelf.shelf_name} />
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>
            Mineralien in diesem Regal ({filteredMinerals.length} von {minerals.length})
          </h3>

          {minerals.length > 0 && (
            <>
              {/* Search and Filter Section */}
              <div className="shelf-search-filter-container" style={{
                marginBottom: 'var(--space-4)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--gray-50)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--gray-200)'
              }}>
                {/* Search */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label htmlFor="shelf-search" style={{ 
                    display: 'block', 
                    marginBottom: 'var(--space-2)',
                    fontWeight: '500'
                  }}>
                    Suche
                  </label>
                  <input 
                    id="shelf-search"
                    type="text" 
                    className="search-input" 
                    placeholder="Nach Name oder Steinnummer suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-2)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--border-radius)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>
                
                {/* Filters */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 'var(--space-3)'
                }}>
                  <div>
                    <label htmlFor="shelf-color-filter" style={{ 
                      display: 'block', 
                      marginBottom: 'var(--space-1)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500'
                    }}>
                      Farbe
                    </label>
                    <select 
                      id="shelf-color-filter"
                      className="filter-select" 
                      value={colorFilter} 
                      onChange={(e) => setColorFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-2)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--border-radius)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="">Alle</option>
                      {filterOptions.colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="shelf-location-filter" style={{ 
                      display: 'block', 
                      marginBottom: 'var(--space-1)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500'
                    }}>
                      Fundort
                    </label>
                    <select 
                      id="shelf-location-filter"
                      className="filter-select" 
                      value={locationFilter} 
                      onChange={(e) => setLocationFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-2)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--border-radius)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="">Alle</option>
                      {filterOptions.locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="shelf-rocktype-filter" style={{ 
                      display: 'block', 
                      marginBottom: 'var(--space-1)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500'
                    }}>
                      Gesteinsart
                    </label>
                    <select 
                      id="shelf-rocktype-filter"
                      className="filter-select" 
                      value={rockTypeFilter} 
                      onChange={(e) => setRockTypeFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-2)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--border-radius)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="">Alle</option>
                      {filterOptions.rock_types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="shelf-sort" style={{ 
                      display: 'block', 
                      marginBottom: 'var(--space-1)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500'
                    }}>
                      Sortierung
                    </label>
                    <select 
                      id="shelf-sort"
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-2)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--border-radius)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="name">Name</option>
                      <option value="number">Steinnummer</option>
                      <option value="color">Farbe</option>
                    </select>
                  </div>
                </div>
                
                {/* Active Filters Info */}
                {hasActiveFilters && (
                  <div style={{ 
                    marginTop: 'var(--space-3)', 
                    padding: 'var(--space-3)',
                    backgroundColor: 'white',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--blue-200)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)'
                    }}>
                      <div>
                        <strong style={{ fontSize: 'var(--font-size-sm)' }}>Aktive Filter:</strong>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
                          {searchTerm && (
                            <span style={{
                              fontSize: 'var(--font-size-xs)',
                              padding: '2px 6px',
                              backgroundColor: 'var(--blue-100)',
                              color: 'var(--blue-800)',
                              borderRadius: '3px'
                            }}>
                              Suche: {searchTerm}
                            </span>
                          )}
                          {colorFilter && (
                            <span style={{
                              fontSize: 'var(--font-size-xs)',
                              padding: '2px 6px',
                              backgroundColor: 'var(--green-100)',
                              color: 'var(--green-800)',
                              borderRadius: '3px'
                            }}>
                              Farbe: {colorFilter}
                            </span>
                          )}
                          {locationFilter && (
                            <span style={{
                              fontSize: 'var(--font-size-xs)',
                              padding: '2px 6px',
                              backgroundColor: 'var(--purple-100)',
                              color: 'var(--purple-800)',
                              borderRadius: '3px'
                            }}>
                              Fundort: {locationFilter}
                            </span>
                          )}
                          {rockTypeFilter && (
                            <span style={{
                              fontSize: 'var(--font-size-xs)',
                              padding: '2px 6px',
                              backgroundColor: 'var(--orange-100)',
                              color: 'var(--orange-800)',
                              borderRadius: '3px'
                            }}>
                              Gesteinsart: {rockTypeFilter}
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={clearFilters}
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          padding: '4px 8px',
                          backgroundColor: 'var(--red-500)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Filter zurücksetzen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {loading ? (
          <div className="loading">Lade Mineralien...</div>
        ) : minerals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--gray-500)' }}>
            <p>Dieses Regal ist noch leer</p>
            <p>Keine Mineralien zugeordnet</p>
          </div>
        ) : filteredMinerals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--gray-500)' }}>
            <p>Keine Mineralien entsprechen den Filterkriterien</p>
            <button 
              onClick={clearFilters}
              style={{
                marginTop: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--blue-500)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer'
              }}
            >
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          <div className="shelf-minerals-grid">
            {filteredMinerals.map(mineral => (
              <div 
                key={mineral.id} 
                className="mineral-card-small" 
                onClick={() => {
                  setShowShelfMineralsModal(false);
                  onOpenMineralDetails(mineral.id);
                }}
              >
                <div className="mineral-image-small">
                  {mineral.image_path ? (
                    <img src={`/uploads/${mineral.image_path}`} alt={mineral.name} />
                  ) : (
                    <div className="placeholder">📸</div>
                  )}
                </div>
                <div className="mineral-info-small">
                  <h4>{mineral.name}</h4>
                  <p><strong>Nr:</strong> {mineral.number}</p>
                  <p><strong>Farbe:</strong> {mineral.color || 'Nicht angegeben'}</p>
                  {mineral.location && (
                    <p><strong>Fundort:</strong> {mineral.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}