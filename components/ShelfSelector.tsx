import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

interface Shelf {
  id: number;
  name: string;
  showcase_name: string;
  showcase_code: string;
  code: string;
  full_code: string;
  mineral_count?: number;
}

interface Section {
  id: number;
  name: string;
  code: string;
  full_code: string;
  mineral_count?: number;
}

export interface ShelfSelectorValue {
  shelf_id: string;
  section_id: string;
}

interface ShelfSelectorProps {
  shelves: Shelf[];
  selectedShelfId: string | number;
  selectedSectionId?: string | number;
  onChange: (value: ShelfSelectorValue) => void;
}

export default function ShelfSelector({
  shelves,
  selectedShelfId,
  selectedSectionId = '',
  onChange,
}: ShelfSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const [expandedShelfId, setExpandedShelfId] = useState<number | null>(null);
  const [sectionsMap, setSectionsMap] = useState<Record<number, Section[]>>({});
  const [loadingShelfId, setLoadingShelfId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const groupedShelves = useMemo(() => {
    const groups: { [key: string]: Shelf[] } = {};
    shelves.forEach(shelf => {
      const showcaseName = shelf.showcase_name || 'Ohne Vitrine';
      if (!groups[showcaseName]) groups[showcaseName] = [];
      groups[showcaseName].push(shelf);
    });
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    return groups;
  }, [shelves]);

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
      if (matchingShelves.length > 0) filtered[showcaseName] = matchingShelves;
    });
    return filtered;
  }, [groupedShelves, searchTerm]);

  const selectedShelf = useMemo(() =>
    shelves.find(s => s.id.toString() === selectedShelfId?.toString()),
    [shelves, selectedShelfId]
  );

  const selectedSection = useMemo(() => {
    if (!selectedSectionId || !selectedShelfId) return null;
    const sections = sectionsMap[Number(selectedShelfId)];
    return sections?.find(s => s.id.toString() === selectedSectionId.toString()) ?? null;
  }, [sectionsMap, selectedShelfId, selectedSectionId]);

  // Load sections for a shelf
  const loadSections = useCallback(async (shelfId: number) => {
    if (sectionsMap[shelfId] !== undefined) return; // already loaded
    setLoadingShelfId(shelfId);
    try {
      const res = await fetch(`/api/sections?shelf_id=${shelfId}`);
      if (res.ok) {
        const data: Section[] = await res.json();
        setSectionsMap(prev => ({ ...prev, [shelfId]: data }));
      } else {
        setSectionsMap(prev => ({ ...prev, [shelfId]: [] }));
      }
    } catch {
      setSectionsMap(prev => ({ ...prev, [shelfId]: [] }));
    } finally {
      setLoadingShelfId(null);
    }
  }, [sectionsMap]);

  // When a shelf is selected or the dropdown opens, pre-load sections for the selected shelf
  useEffect(() => {
    if (selectedShelfId) {
      loadSections(Number(selectedShelfId));
    }
  }, [selectedShelfId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Expand the currently selected shelf when opening
  useEffect(() => {
    if (isOpen && selectedShelfId) {
      setExpandedShelfId(Number(selectedShelfId));
      loadSections(Number(selectedShelfId));
    }
  }, [isOpen]);

  const handleShelfClick = (shelf: Shelf) => {
    const shelfId = shelf.id;
    const sections = sectionsMap[shelfId];

    // Load sections if not yet loaded
    if (sections === undefined) {
      loadSections(shelfId);
      setExpandedShelfId(shelfId);
      return;
    }

    // If shelf has sections, toggle expand instead of selecting directly
    if (sections.length > 0) {
      setExpandedShelfId(expandedShelfId === shelfId ? null : shelfId);
      return;
    }

    // No sections → select the shelf directly
    onChange({ shelf_id: shelfId.toString(), section_id: '' });
    setIsOpen(false);
    setSearchTerm('');
    setExpandedShelfId(null);
  };

  const handleShelfDirectSelect = (shelf: Shelf, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ shelf_id: shelf.id.toString(), section_id: '' });
    setIsOpen(false);
    setSearchTerm('');
    setExpandedShelfId(null);
  };

  const handleSectionSelect = (shelf: Shelf, section: Section) => {
    onChange({ shelf_id: shelf.id.toString(), section_id: section.id.toString() });
    setIsOpen(false);
    setSearchTerm('');
    setExpandedShelfId(null);
  };

  const handleClear = () => {
    onChange({ shelf_id: '', section_id: '' });
    setIsOpen(false);
    setSearchTerm('');
    setExpandedShelfId(null);
  };

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropdownPosition(spaceBelow < 400 && spaceAbove > spaceBelow ? 'top' : 'bottom');
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
              {selectedSection ? (
                <span className="shelf-selector-code">{selectedSection.full_code}</span>
              ) : (
                <span className="shelf-selector-code">{selectedShelf.full_code}</span>
              )}
              {selectedSection && (
                <span className="shelf-selector-section-name">{selectedSection.name}</span>
              )}
            </>
          ) : (
            <span className="shelf-selector-placeholder">Kein Regal zugeordnet</span>
          )}
        </div>
        <div className="shelf-selector-arrow">{isOpen ? '▲' : '▼'}</div>
      </div>

      {isOpen && (
        <div className={`shelf-selector-dropdown ${dropdownPosition === 'top' ? 'dropdown-top' : 'dropdown-bottom'}`}>
          <div className="shelf-selector-search">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Suche nach Box, Sektion oder Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shelf-selector-search-input"
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button className="shelf-selector-search-clear" onClick={() => setSearchTerm('')} type="button">✕</button>
            )}
          </div>

          <div className="shelf-selector-options">
            {selectedShelf && (
              <div className="shelf-selector-clear-option">
                <button type="button" className="shelf-selector-clear-btn" onClick={handleClear}>
                  <span>✕</span> Zuordnung entfernen
                </button>
              </div>
            )}

            {Object.keys(filteredGroups).length === 0 ? (
              <div className="shelf-selector-empty">Keine Boxen gefunden für "{searchTerm}"</div>
            ) : (
              Object.entries(filteredGroups).map(([showcaseName, shelfList]) => (
                <div key={showcaseName} className="shelf-selector-group">
                  <div className="shelf-selector-group-header">{showcaseName}</div>
                  <div className="shelf-selector-group-items">
                    {shelfList.map(shelf => {
                      const sections = sectionsMap[shelf.id];
                      const hasSections = sections && sections.length > 0;
                      const isExpanded = expandedShelfId === shelf.id;
                      const isShelfSelected = shelf.id.toString() === selectedShelfId?.toString();
                      const isLoadingSections = loadingShelfId === shelf.id;

                      return (
                        <div key={shelf.id}>
                          {/* ── Shelf row ── */}
                          <div
                            className={`shelf-selector-option ${isShelfSelected && !selectedSectionId ? 'selected' : ''} ${hasSections ? 'has-sections' : ''}`}
                            onClick={() => handleShelfClick(shelf)}
                          >
                            <div className="shelf-selector-option-main">
                              <span className="shelf-selector-option-name">{shelf.name}</span>
                              <span className="shelf-selector-option-code">{shelf.full_code}</span>
                            </div>
                            <div className="shelf-selector-option-right">
                              {shelf.mineral_count !== undefined && (
                                <div className={`shelf-selector-option-count ${isShelfSelected && !selectedSectionId ? 'selected' : ''}`}>
                                  {shelf.mineral_count}
                                </div>
                              )}
                              {isLoadingSections && <span className="shelf-selector-loading">⟳</span>}
                              {hasSections && !isLoadingSections && (
                                <button
                                  className="shelf-selector-direct-btn"
                                  onClick={(e) => handleShelfDirectSelect(shelf, e)}
                                  title="Box direkt auswählen (ohne Sektion)"
                                  type="button"
                                >
                                  Box
                                </button>
                              )}
                              {sections !== undefined && (
                                <span className="shelf-selector-expand-icon">
                                  {isExpanded ? '▾' : '▸'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ── Section rows ── */}
                          {isExpanded && hasSections && (
                            <div className="shelf-selector-sections">
                              {sections.map(section => {
                                const isSectionSelected =
                                  isShelfSelected &&
                                  section.id.toString() === selectedSectionId?.toString();
                                return (
                                  <div
                                    key={section.id}
                                    className={`shelf-selector-section-option ${isSectionSelected ? 'selected' : ''}`}
                                    onClick={() => handleSectionSelect(shelf, section)}
                                  >
                                    <div className="shelf-selector-section-indicator" />
                                    <div className="shelf-selector-option-main">
                                      <span className="shelf-selector-option-name">{section.name}</span>
                                      <span className="shelf-selector-option-code">{section.full_code}</span>
                                    </div>
                                    {section.mineral_count !== undefined && (
                                      <div className={`shelf-selector-option-count ${isSectionSelected ? 'selected' : ''}`}>
                                        {section.mineral_count}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
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