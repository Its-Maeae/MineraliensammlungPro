import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Mineral } from '../types';
import MineralModal from './MineralModal';
import EditModal from './EditModal';

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
  reloadTrigger
}: CollectionPageProps) {

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  const mineralsRef = useRef<Mineral[]>(minerals);
  
  useEffect(() => {
    mineralsRef.current = minerals;
  }, [minerals]);

  const loadMinerals = useCallback(async (pageNum: number, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        color: colorFilter,
        location: locationFilter,
        rock_type: rockTypeFilter,
        sort: sortBy,
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });
      
      const response = await fetch(`/api/minerals?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        if (append) {
          setMinerals([...mineralsRef.current, ...data]);
        } else {
          setMinerals(data);
        }
        
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mineralien:', error);
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [searchTerm, colorFilter, locationFilter, rockTypeFilter, sortBy, setLoading, setMinerals]);

  const loadFilterOptions = async () => {
    try {
      const response = await fetch('/api/filter-options');
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Filteroptionen:', error);
    }
  };

  const openMineralDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/minerals/${id}`);
      if (response.ok) {
        const mineral = await response.json();
        setSelectedMineral(mineral);
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
      longitude: mineral.longitude || null  
    });
    setEditMode('mineral');
    setEditImage(null);
  };

  const handleDelete = async (type: 'mineral' | 'showcase' | 'shelf', id: number) => {
    const confirmMessage = {
      mineral: 'Möchten Sie dieses Mineral wirklich löschen?',
      showcase: 'Möchten Sie diese Vitrine wirklich löschen? Alle zugehörigen Regale werden ebenfalls gelöscht!',
      shelf: 'Möchten Sie dieses Regal wirklich löschen? Alle zugeordneten Mineralien werden nicht gelöscht, aber ihre Regal-Zuordnung entfernt!'
    };

    if (!confirm(confirmMessage[type])) {
      return;
    }

    try {
      setLoading(true);
      
      let url = '';
      switch (type) {
        case 'mineral': url = `/api/minerals/${id}`; break;
        case 'showcase': url = `/api/showcases/${id}`; break;
        case 'shelf': url = `/api/shelves/${id}`; break;
      }

      const response = await fetch(url, { method: 'DELETE' });

      if (response.ok) {
        if (type === 'mineral') {
          setShowMineralModal(false);
          setSelectedMineral(null);
        }
        loadStats();
        setPage(1);
        loadMinerals(1, false);
        alert(`${type === 'mineral' ? 'Mineral' : type === 'showcase' ? 'Vitrine' : 'Regal'} erfolgreich gelöscht!`);
      } else {
        alert('Fehler beim Löschen: ' + await response.text());
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadMinerals(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [hasMore, isLoadingMore, loading, page, loadMinerals]);

  useEffect(() => { loadFilterOptions(); }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadMinerals(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, colorFilter, locationFilter, rockTypeFilter, sortBy]);

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

          {/* Page header */}
          <div className="cp-header">
            <div>
              <h1 className="cp-title">Mineraliensammlung</h1>
              <p className="cp-subtitle">
                {minerals.length > 0 && !loading
                  ? `${minerals.length}${hasMore ? '+' : ''} Einträge`
                  : 'Durchsuchen und filtern'}
              </p>
            </div>
            {showPage && (
              <button className="cp-btn-ghost" onClick={() => showPage('statistics')}>
                Statistiken →
              </button>
            )}
          </div>

          {/* Search + filters */}
          <div className="cp-filters">
            <input
              type="text"
              className="cp-search"
              placeholder="Name oder Steinnummer …"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="cp-selects">
              <select className="cp-select" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
                <option value="">Alle Farben</option>
                {filterOptions.colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="cp-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value="">Alle Fundorte</option>
                {filterOptions.locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select className="cp-select" value={rockTypeFilter} onChange={(e) => setRockTypeFilter(e.target.value)}>
                <option value="">Alle Gesteinsarten</option>
                {filterOptions.rock_types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="cp-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">A–Z</option>
                <option value="number">Nummer</option>
                <option value="color">Farbe</option>
              </select>
            </div>
          </div>

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="cp-active-filters">
              {searchTerm && <span className="cp-filter-tag">Suche: {searchTerm}</span>}
              {colorFilter && <span className="cp-filter-tag">Farbe: {colorFilter}</span>}
              {locationFilter && <span className="cp-filter-tag">Fundort: {locationFilter}</span>}
              {rockTypeFilter && <span className="cp-filter-tag">Gestein: {rockTypeFilter}</span>}
              <button className="cp-clear-btn" onClick={clearFilters}>Zurücksetzen</button>
            </div>
          )}

          {/* Grid */}
          <div className="minerals-grid">
            {loading && minerals.length === 0 ? (
              <div className="cp-loading">Lade Mineralien …</div>
            ) : minerals.length === 0 ? (
              <div className="cp-loading">Keine Mineralien gefunden</div>
            ) : (
              minerals.map(mineral => (
                <div
                  key={mineral.id}
                  className="mineral-card"
                  onClick={() => openMineralDetails(mineral.id)}
                >
                  <div className="mineral-image">
                    {mineral.image_path ? (
                      <img src={`/uploads/${mineral.image_path}`} alt={mineral.name} />
                    ) : (
                      <div className="placeholder cp-placeholder" />
                    )}
                  </div>
                  <div className="mineral-info">
                    <h3>{mineral.name}</h3>
                    <p><strong>Nr.</strong> {mineral.number}</p>
                    <p><strong>Farbe:</strong> {mineral.color || '—'}</p>
                    <p><strong>Regal:</strong> {mineral.shelf_code ? `${mineral.showcase_code}-${mineral.shelf_code}` : '—'}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }}>
              {isLoadingMore && <div className="cp-loading">Lade weitere …</div>}
            </div>
          )}

          {!hasMore && minerals.length > 0 && (
            <p className="cp-end-note">Alle {minerals.length} Mineralien geladen</p>
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
