import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Mineral } from '../types';
import MineralModal from './MineralModal';
import EditModal from './EditModal';
import SteinDesTages from './SteinDesTages';

interface FilterOptions {
  colors: string[];
  locations: string[];
  rock_types: string[];
}

interface CollectionPageProps {
  minerals: Mineral[];
  setMinerals: (minerals: Mineral[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  colorFilter: string;
  setColorFilter: (color: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  rockTypeFilter: string;
  setRockTypeFilter: (type: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  // ── Von index.tsx nach unten gereicht ──
  showUndetermined: 'all' | 'only' | 'hide';
  setShowUndetermined: (val: 'all' | 'only' | 'hide') => void;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  selectedMineral: Mineral | null;
  setSelectedMineral: (mineral: Mineral | null) => void;
  showMineralModal: boolean;
  setShowMineralModal: (show: boolean) => void;
  isAuthenticated: boolean;
  editMode: 'mineral' | 'showcase' | 'shelf' | null;
  setEditMode: (mode: 'mineral' | 'showcase' | 'shelf' | null) => void;
  editFormData: any;
  setEditFormData: (data: any) => void;
  editImage: File | null;
  setEditImage: (image: File | null) => void;
  shelves: any[];
  loadStats: () => void;
  showPage?: (page: string) => void;
  clearCaches?: (type: 'showcase' | 'shelf' | 'mineral', id: number) => void;
  reloadTrigger?: number;
}

export default function CollectionPage({
  minerals,
  setMinerals,
  loading,
  setLoading,
  searchTerm,
  setSearchTerm,
  colorFilter,
  setColorFilter,
  locationFilter,
  setLocationFilter,
  rockTypeFilter,
  setRockTypeFilter,
  sortBy,
  setSortBy,
  showUndetermined,
  setShowUndetermined,
  filterOptions,
  setFilterOptions,
  hasActiveFilters,
  clearFilters,
  selectedMineral,
  setSelectedMineral,
  showMineralModal,
  setShowMineralModal,
  isAuthenticated,
  editMode,
  setEditMode,
  editFormData,
  setEditFormData,
  editImage,
  setEditImage,
  shelves,
  loadStats,
  showPage,
  clearCaches,
  reloadTrigger,
}: CollectionPageProps) {

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  // Ref damit append-Aufrufe immer den aktuellen minerals-Array sehen
  const mineralsRef = useRef<Mineral[]>(minerals);
  useEffect(() => { mineralsRef.current = minerals; }, [minerals]);

  // loadMinerals baut seinen fetch aus den Props auf.
  // Da showUndetermined jetzt ein Prop ist, wird loadMinerals bei jeder
  // Änderung eines Filters (inkl. showUndetermined) neu erstellt,
  // und der useEffect darunter feuert dann den neuen Fetch.
  const loadMinerals = useCallback(async (pageNum: number, append: boolean = false) => {
    if (append) setIsLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        color: colorFilter,
        location: locationFilter,
        rock_type: rockTypeFilter,
        sort: sortBy,
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        undetermined: showUndetermined,
      });

      const response = await fetch(`/api/minerals?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (append) setMinerals([...mineralsRef.current, ...data]);
        else setMinerals(data);
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mineralien:', error);
    } finally {
      if (append) setIsLoadingMore(false);
      else setLoading(false);
    }
  // setLoading / setMinerals sind stabile Props-Referenzen aus useState
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, colorFilter, locationFilter, rockTypeFilter, sortBy, showUndetermined]);

  const loadFilterOptions = async () => {
    try {
      const response = await fetch('/api/filter-options');
      if (response.ok) setFilterOptions(await response.json());
    } catch (error) {
      console.error('Fehler beim Laden der Filteroptionen:', error);
    }
  };

  const openMineralDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/minerals/${id}`);
      if (response.ok) {
        setSelectedMineral(await response.json());
        setShowMineralModal(true);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mineral-Details:', error);
    }
  };

  const handleEditMineral = (mineral: Mineral) => {
    setEditFormData({
      id: mineral.id,
      name: mineral.name,
      number: mineral.number,
      color: mineral.color || '',
      description: mineral.description || '',
      location: mineral.location || '',
      purchase_location: mineral.purchase_location || '',
      rock_type: mineral.rock_type || '',
      shelf_id: mineral.shelf_id || '',
      latitude: mineral.latitude || null,
      longitude: mineral.longitude || null,
      is_undetermined: (mineral as any).is_undetermined || false,
      suspected_name: (mineral as any).suspected_name || '',
    });
    setEditMode('mineral');
    setEditImage(null);
  };

  const handleDelete = async (type: 'mineral' | 'showcase' | 'shelf', id: number) => {
    const confirmMessage = {
      mineral: 'Möchten Sie dieses Mineral wirklich löschen?',
      showcase: 'Möchten Sie diese Vitrine wirklich löschen? Alle zugehörigen Regale werden ebenfalls gelöscht!',
      shelf: 'Möchten Sie dieses Regal wirklich löschen? Alle zugeordneten Mineralien werden nicht gelöscht, aber ihre Regal-Zuordnung entfernt!',
    };

    if (!confirm(confirmMessage[type])) return;

    try {
      setLoading(true);
      const urls = {
        mineral: `/api/minerals/${id}`,
        showcase: `/api/showcases/${id}`,
        shelf: `/api/shelves/${id}`,
      };
      const response = await fetch(urls[type], { method: 'DELETE' });

      if (response.ok) {
        if (type === 'mineral') {
          setShowMineralModal(false);
          setSelectedMineral(null);
        }
        loadStats();
        setPage(1);
        loadMinerals(1, false);
        const names = { mineral: 'Mineral', showcase: 'Vitrine', shelf: 'Regal' };
        alert(`${names[type]} erfolgreich gelöscht!`);
      } else {
        alert('Fehler beim Löschen: ' + await response.text());
      }
    } catch (error) {
      alert('Fehler beim Löschen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadMinerals(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, page, loadMinerals]);

  useEffect(() => { loadFilterOptions(); }, []);

  // Dieser Effect feuert bei JEDER Filteränderung – inkl. showUndetermined,
  // weil loadMinerals als useCallback von allen Filterwerten abhängt.
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadMinerals(1, false);
  }, [loadMinerals]);

  // Nach externem Reload (z.B. nach Bearbeiten eines Minerals)
  useEffect(() => {
    if (reloadTrigger !== undefined && reloadTrigger > 0) {
      setMinerals([]);
      setPage(1);
      setHasMore(true);
      loadMinerals(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadTrigger]);

  return (
    <>
      <section className="page active">
        <div className="container">
          <div className="page-header">
            <div className="page-header-content">
              <div>
                <h1 className="page-title">Sammlungsübersicht</h1>
              </div>
              {showPage ? (
                <button
                  className="btn btn-secondary btn-large"
                  onClick={() => showPage('statistics')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span></span><span>Statistiken anzeigen</span>
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => window.location.href = '/?page=statistics'}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span></span><span>Statistiken anzeigen</span>
                </button>
              )}
            </div>
          </div>

          {/* <SteinDesTages onOpenMineral={openMineralDetails} /> */}

          <div className="search-filter-container">
            <div className="search-section">
              <h3>Suche</h3>
              <input
                type="text"
                className="search-input"
                placeholder="Nach Name, Vermutung oder Steinnummer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-section">
              <h3>Filter</h3>
              <select
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
                className="filter-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">Alle Fundorte</option>
                {filterOptions.locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={rockTypeFilter}
                onChange={(e) => setRockTypeFilter(e.target.value)}
              >
                <option value="">Alle Gesteinsarten</option>
                {filterOptions.rock_types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* Unbestimmt-Filter als Checkbox – an/abwählbar */}
              <div className="undetermined-filter-group">
                <label className="undetermined-filter-option">
                  <input
                    type="checkbox"
                    checked={showUndetermined === 'only'}
                    onChange={(e) => setShowUndetermined(e.target.checked ? 'only' : 'all')}
                  />
                  Nur unbestimmte
                </label>
              </div>
            </div>
          </div>

          {/* Aktive-Filter-Leiste – hasActiveFilters ist true wenn showUndetermined !== 'all' */}
          {hasActiveFilters && (
            <div className="filter-info show">
              <strong>Aktive Filter:</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {searchTerm && <span className="filter-tag">Suche: {searchTerm}</span>}
                {colorFilter && <span className="filter-tag">Farbe: {colorFilter}</span>}
                {locationFilter && <span className="filter-tag">Fundort: {locationFilter}</span>}
                {rockTypeFilter && <span className="filter-tag">Gesteinsart: {rockTypeFilter}</span>}
                {showUndetermined === 'only' && (
                  <span className="filter-tag filter-tag-undetermined">Nur unbestimmte</span>
                )}
                {showUndetermined === 'hide' && (
                  <span className="filter-tag filter-tag-undetermined">Unbestimmte ausgeblendet</span>
                )}
              </div>
              {/* clearFilters() setzt in index.tsx auch showUndetermined auf 'all' zurück */}
              <button className="clear-filters" onClick={clearFilters}>
                Filter zurücksetzen
              </button>
            </div>
          )}

          <div className="sort-section">
            <label htmlFor="sortBy">Sortieren nach:</label>
            <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="number">Steinnummer</option>
              <option value="color">Farbe</option>
            </select>
          </div>

          <div className="minerals-grid">
            {loading && minerals.length === 0 ? (
              <div className="loading">Lade Mineralien/Gesteine...</div>
            ) : minerals.length === 0 ? (
              <div className="loading">Keine Mineralien/Gesteine gefunden</div>
            ) : (
              <>
                {minerals.map(mineral => {
                  const undetermined = !!(mineral as any).is_undetermined;
                  return (
                    <div
                      key={mineral.id}
                      className={`mineral-card ${undetermined ? 'mineral-card-undetermined' : ''}`}
                      onClick={() => openMineralDetails(mineral.id)}
                    >
                      <div className="mineral-image">
                        {mineral.image_path ? (
                          <img src={`/uploads/${mineral.image_path}`} alt={mineral.name} />
                        ) : (
                          <div className="placeholder">{undetermined ? '❓' : '📸'}</div>
                        )}
                        {undetermined && (
                          <div className="undetermined-card-badge">Unbestimmt</div>
                        )}
                      </div>
                      <div className="mineral-info">
                        <h3>
                          {undetermined
                            ? ((mineral as any).suspected_name || 'Unbekanntes Mineral')
                            : mineral.name}
                        </h3>
                        <p><strong>Nummer:</strong> {mineral.number}</p>
                        <p>
                          <strong>Regal:</strong>{' '}
                          {mineral.shelf_code
                            ? `${mineral.showcase_code}-${mineral.shelf_code}`
                            : 'Nicht zugeordnet'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {hasMore && (
            <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }}>
              {isLoadingMore && (
                <div className="loading" style={{ gridColumn: '1 / -1' }}>
                  Lade weitere Mineralien/Gesteine ...
                </div>
              )}
            </div>
          )}

          {!hasMore && minerals.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--gray-500)',
              fontSize: 'var(--font-size-sm)',
            }}>
              Alle Mineralien/Gesteine geladen ({minerals.length} gesamt)
            </div>
          )}
        </div>
      </section>

      {showMineralModal && selectedMineral && (
        <MineralModal
          mineral={selectedMineral}
          isAuthenticated={isAuthenticated}
          onClose={() => setShowMineralModal(false)}
          onEdit={handleEditMineral}
          onDelete={handleDelete}
        />
      )}

      {editMode && (
        <EditModal
          editMode={editMode}
          formData={editFormData}
          setFormData={setEditFormData}
          image={editImage}
          setImage={setEditImage}
          shelves={shelves}
          loading={loading}
          setLoading={setLoading}
          onClose={() => { setEditMode(null); setEditFormData({}); setEditImage(null); }}
          setEditMode={setEditMode}
          setSelectedMineral={setSelectedMineral}
          setShowMineralModal={setShowMineralModal}
          setSelectedShowcase={() => {}}
          setShowShelfMineralsModal={() => {}}
          setSelectedShelf={() => {}}
          currentPage="collection"
          setMinerals={setMinerals}
          setShowcases={() => {}}
          loadStats={loadStats}
          loadMinerals={async () => {
            if (clearCaches && editFormData.id) clearCaches('mineral', editFormData.id);
            setMinerals([]);
            setPage(1);
            setHasMore(true);
            await loadMinerals(1, false);
          }}
          clearCaches={clearCaches}
        />
      )}
    </>
  );
}