import React, { useState, useMemo, useEffect, useRef } from 'react';

interface Shelf {
  id: number;
  name: string;
  showcase_name: string;
  showcase_code: string;
  code: string;
  full_code: string;
  mineral_count?: number;
}

interface ShelfSelectorProps {
  shelves: Shelf[];
  selectedShelfId: string | number;
  onChange: (shelfId: string) => void;
}

export default function ShelfSelector({ shelves, selectedShelfId, onChange }: ShelfSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Gruppiere Regale nach Vitrinen
  const groupedShelves = useMemo(() => {
    const groups: { [key: string]: Shelf[] } = {};
    
    shelves.forEach(shelf => {
      const showcaseName = shelf.showcase_name || 'Ohne Vitrine';
      if (!groups[showcaseName]) {
        groups[showcaseName] = [];
      }
      groups[showcaseName].push(shelf);
    });

    // Sortiere jede Gruppe nach position_order und name
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [shelves]);

  // Filtere Regale basierend auf Suchbegriff
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groupedShelves;

    const searchLower = searchTerm.toLowerCase();
    const filtered: { [key: string]: Shelf[] } = {};

    Object.entries(groupedShelves).forEach(([showcaseName, shelfList]) => {
      const matchingShelves = shelfList.filter(shelf => 
        shelf.name.toLowerCase().includes(searchLower) ||
        shelf.full_code.toLowerCase().includes(searchLower) ||
        showcaseName.toLowerCase().includes(searchLower)
      );

      if (matchingShelves.length > 0) {
        filtered[showcaseName] = matchingShelves;
      }
    });

    return filtered;
  }, [groupedShelves, searchTerm]);

  // Finde ausgewähltes Regal
  const selectedShelf = useMemo(() => 
    shelves.find(s => s.id.toString() === selectedShelfId?.toString()),
    [shelves, selectedShelfId]
  );

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (shelfId: number) => {
    onChange(shelfId.toString());
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      // Calculate position before opening
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If less than 400px below and more space above, open upwards
      if (spaceBelow < 400 && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="shelf-selector" ref={containerRef}>
      <div className="shelf-selector-trigger" onClick={handleToggle}>
        <div className="shelf-selector-value">
          {selectedShelf ? (
            <>
              <span className="shelf-selector-showcase">{selectedShelf.showcase_name}</span>
              <span className="shelf-selector-name">{selectedShelf.name}</span>
              <span className="shelf-selector-code">{selectedShelf.full_code}</span>
            </>
          ) : (
            <span className="shelf-selector-placeholder">Kein Regal zugeordnet</span>
          )}
        </div>
        <div className="shelf-selector-arrow">
          {isOpen ? '▲' : '▼'}
        </div>
      </div>

      {isOpen && (
        <div className={`shelf-selector-dropdown ${dropdownPosition === 'top' ? 'dropdown-top' : 'dropdown-bottom'}`}>
          <div className="shelf-selector-search">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Suche nach Regal oder Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shelf-selector-search-input"
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button 
                className="shelf-selector-search-clear"
                onClick={() => setSearchTerm('')}
                type="button"
              >
                ✕
              </button>
            )}
          </div>

          <div className="shelf-selector-options">
            {selectedShelf && (
              <div className="shelf-selector-clear-option">
                <button
                  type="button"
                  className="shelf-selector-clear-btn"
                  onClick={handleClear}
                >
                  <span>✕</span> Regal-Zuordnung entfernen
                </button>
              </div>
            )}

            {Object.keys(filteredGroups).length === 0 ? (
              <div className="shelf-selector-empty">
                Keine Regale gefunden für "{searchTerm}"
              </div>
            ) : (
              Object.entries(filteredGroups).map(([showcaseName, shelfList]) => (
                <div key={showcaseName} className="shelf-selector-group">
                  <div className="shelf-selector-group-header">
                    {showcaseName}
                  </div>
                  <div className="shelf-selector-group-items">
                    {shelfList.map(shelf => (
                      <div
                        key={shelf.id}
                        className={`shelf-selector-option ${
                          shelf.id.toString() === selectedShelfId?.toString() ? 'selected' : ''
                        }`}
                        onClick={() => handleSelect(shelf.id)}
                      >
                        <div className="shelf-selector-option-main">
                          <span className="shelf-selector-option-name">{shelf.name}</span>
                          <span className="shelf-selector-option-code">{shelf.full_code}</span>
                        </div>
                        {shelf.mineral_count !== undefined && (
                          <div className="shelf-selector-option-count">
                            {shelf.mineral_count} Mineralien
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}