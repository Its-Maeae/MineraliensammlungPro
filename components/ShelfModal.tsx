import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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

// Virtualisierter Mineral Grid mit Lazy Loading
const VirtualizedMineralGrid = React.memo(({ 
  minerals, 
  onMineralClick 
}: { 
  minerals: Mineral[]; 
  onMineralClick: (id: number) => void;
}) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Cleanup old observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer for infinite scroll
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < minerals.length) {
          setVisibleCount(prev => Math.min(prev + 10, minerals.length));
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleCount, minerals.length]);

  const visibleMinerals = useMemo(
    () => minerals.slice(0, visibleCount),
    [minerals, visibleCount]
  );

  return (
    <>
      <div className="shelf-minerals-grid">
        {visibleMinerals.map(mineral => (
          <MineralCard 
            key={mineral.id}
            mineral={mineral}
            onClick={onMineralClick}
          />
        ))}
      </div>
      {visibleCount < minerals.length && (
        <div ref={sentinelRef} style={{ height: '20px', margin: '20px 0' }}>
          <div className="loading">Lade weitere Mineralien...</div>
        </div>
      )}
    </>
  );
});

// Memoized Mineral Card Component
const MineralCard = React.memo(({ 
  mineral, 
  onClick 
}: { 
  mineral: Mineral; 
  onClick: (id: number) => void;
}) => {
  const handleClick = useCallback(() => {
    onClick(mineral.id);
  }, [mineral.id, onClick]);

  return (
    <div 
      className="mineral-card-small" 
      onClick={handleClick}
    >
      <div className="mineral-image-small">
        {mineral.image_path ? (
          <img 
            src={`/uploads/${mineral.image_path}`} 
            alt={mineral.name}
            loading="lazy"
          />
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
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return prevProps.mineral.id === nextProps.mineral.id &&
         prevProps.mineral.image_path === nextProps.mineral.image_path;
});

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
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [rockTypeFilter, setRockTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const modalOverlayRef = useRef<HTMLDivElement>(null);

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

  // Memoize filter options - optimiert
  const filterOptions = useMemo(() => {
    if (minerals.length === 0) {
      return { colors: [], locations: [], rock_types: [] };
    }

    const colors = new Set<string>();
    const locations = new Set<string>();
    const rockTypes = new Set<string>();
    
    for (const mineral of minerals) {
      if (mineral.color) colors.add(mineral.color);
      if (mineral.location) locations.add(mineral.location);
      if (mineral.rock_type) rockTypes.add(mineral.rock_type);
    }
    
    return {
      colors: Array.from(colors).sort(),
      locations: Array.from(locations).sort(),
      rock_types: Array.from(rockTypes).sort()
    };
  }, [minerals]);

  // Optimierte Filter- und Sortier-Funktion
  const filteredMinerals = useMemo(() => {
    if (minerals.length === 0) return [];

    // Früher Ausstieg wenn keine Filter aktiv
    const hasFilters = searchTerm || colorFilter || locationFilter || rockTypeFilter;
    
    let filtered = minerals;

    if (hasFilters) {
      const searchLower = searchTerm.toLowerCase();
      filtered = minerals.filter(mineral => {
        if (searchTerm) {
          const nameMatch = mineral.name.toLowerCase().includes(searchLower);
          const numberMatch = mineral.number.toLowerCase().includes(searchLower);
          if (!nameMatch && !numberMatch) return false;
        }
        
        if (colorFilter && mineral.color !== colorFilter) return false;
        if (locationFilter && mineral.location !== locationFilter) return false;
        if (rockTypeFilter && mineral.rock_type !== rockTypeFilter) return false;
        
        return true;
      });
    }

    // Sortierung nur wenn nötig
    if (sortBy !== 'name' || hasFilters) {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'number':
            const numA = parseInt(a.number.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(b.number.match(/\d+/)?.[0] || '0', 10);
            return numA !== numB ? numA - numB : a.number.localeCompare(b.number);
          case 'color':
            return (a.color || '').localeCompare(b.color || '');
          default:
            return a.name.localeCompare(b.name);
        }
      });
    }

    return filtered;
  }, [minerals, searchTerm, colorFilter, locationFilter, rockTypeFilter, sortBy]);

  const hasActiveFilters = searchTerm || colorFilter || locationFilter || rockTypeFilter;

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setColorFilter('');
    setLocationFilter('');
    setRockTypeFilter('');
  }, []);

  const handleMineralClick = useCallback((id: number) => {
    setShowShelfMineralsModal(false);
    onOpenMineralDetails(id);
  }, [setShowShelfMineralsModal, onOpenMineralDetails]);

  return (
    <div className="modal" style={{ display: 'flex' }} ref={modalOverlayRef}>
      <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>Regal: {shelf.shelf_name}</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
          {shelf.showcase_name} - {shelf.full_code}
        </p>

        {isAuthenticated && (
          <div className="admin-buttons">
            <button className="btn btn-secondary" onClick={() => onEdit(shelf)}>
              Bearbeiten
            </button>
            <button className="btn btn-primary" onClick={() => setShowQRGenerator(!showQRGenerator)}>
              {showQRGenerator ? 'QR-Code ausblenden' : 'QR-Code generieren'}
            </button>
            <button className="btn error-btn" onClick={() => onDelete('shelf', shelf.id)}>
              Löschen
            </button>
          </div>
        )}

        {isAuthenticated && showQRGenerator && (
          <div style={{ 
            marginBottom: 'var(--space-4)', 
            padding: 'var(--space-3)', 
            backgroundColor: 'var(--gray-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)'
          }}>
            <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-lg)' }}>
              QR-Code für direkten Zugriff
            </h3>
            <QRCodeGenerator 
              shelfId={shelf.id}
              shelfName={shelf.shelf_name}
              fullCode={shelf.full_code}
            />
          </div>
        )}
        
        {shelf.image_path && (
          <div className="detail-image" style={{ marginBottom: 'var(--space-4)' }}>
            <img src={`/uploads/${shelf.image_path}`} alt={shelf.shelf_name} loading="lazy" />
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-lg)' }}>
            Mineralien in diesem Regal ({filteredMinerals.length} von {minerals.length})
          </h3>

          {minerals.length > 0 && (
            <>
              <div className="shelf-search-filter-compact">
                <div className="shelf-search-input">
                  <input 
                    id="shelf-search"
                    type="text" 
                    className="search-input" 
                    placeholder="Nach Name oder Steinnummer suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="shelf-filters-inline">
                  <select 
                    id="shelf-color-filter"
                    className="filter-select" 
                    value={colorFilter} 
                    onChange={(e) => setColorFilter(e.target.value)}
                  >
                    <option value="">Alle Farben</option>
                    {filterOptions.colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                  
                  <select 
                    id="shelf-location-filter"
                    className="filter-select" 
                    value={locationFilter} 
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <option value="">Alle Fundorte</option>
                    {filterOptions.locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  
                  <select 
                    id="shelf-rocktype-filter"
                    className="filter-select" 
                    value={rockTypeFilter} 
                    onChange={(e) => setRockTypeFilter(e.target.value)}
                  >
                    <option value="">Alle Gesteinsarten</option>
                    {filterOptions.rock_types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  
                  <select 
                    id="shelf-sort"
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Nach Name</option>
                    <option value="number">Nach Nummer</option>
                    <option value="color">Nach Farbe</option>
                  </select>

                  {hasActiveFilters && (
                    <button 
                      onClick={clearFilters}
                      className="clear-filters-compact"
                      title="Filter zurücksetzen"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {hasActiveFilters && (
                  <div className="active-filters-compact">
                    {searchTerm && <span className="filter-tag-compact">🔍 {searchTerm}</span>}
                    {colorFilter && <span className="filter-tag-compact">🎨 {colorFilter}</span>}
                    {locationFilter && <span className="filter-tag-compact">📍 {locationFilter}</span>}
                    {rockTypeFilter && <span className="filter-tag-compact">🪨 {rockTypeFilter}</span>}
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
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          <VirtualizedMineralGrid 
            minerals={filteredMinerals}
            onMineralClick={handleMineralClick}
          />
        )}
      </div>
    </div>
  );
}