import React, { useEffect, useCallback } from 'react';
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
  loadStats
}: CollectionPageProps) {

  const loadMinerals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        color: colorFilter,
        location: locationFilter,
        rock_type: rockTypeFilter,
        sort: sortBy
      });
      
      const response = await fetch(`/api/minerals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMinerals(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mineralien:', error);
    } finally {
      setLoading(false);
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
        case 'mineral':
          url = `/api/minerals/${id}`;
          break;
        case 'showcase':
          url = `/api/showcases/${id}`;
          break;
        case 'shelf':
          url = `/api/shelves/${id}`;
          break;
      }

      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (type === 'mineral') {
          setShowMineralModal(false);
          setSelectedMineral(null);
        }

        loadStats();
        loadMinerals();

        const entityNames = {
          mineral: 'Mineral',
          showcase: 'Vitrine',
          shelf: 'Regal'
        };

        alert(`${entityNames[type]} erfolgreich gelöscht!`);
      } else {
        const responseData = await response.text();
        alert('Fehler beim Löschen: ' + responseData);
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadMinerals();
  }, [loadMinerals]);

  return (
    <>
      <section className="page active">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Mineraliensammlung</h1>
            <p className="page-description">Durchsuchen und filtern Sie die komplette Sammlung</p>
          </div>

          <div className="search-filter-container">
            <div className="search-section">
              <h3>Suche</h3>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Nach Name oder Steinnummer suchen..."
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
                {filterOptions.locations.map(location => (
                  <option key={location} value={location}>{location}</option>
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
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filter-info show">
              <strong>Aktive Filter:</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {searchTerm && <span className="filter-tag">Suche: {searchTerm}</span>}
                {colorFilter && <span className="filter-tag">Farbe: {colorFilter}</span>}
                {locationFilter && <span className="filter-tag">Fundort: {locationFilter}</span>}
                {rockTypeFilter && <span className="filter-tag">Gesteinsart: {rockTypeFilter}</span>}
              </div>
              <button className="clear-filters" onClick={clearFilters}>
                Filter zurücksetzen
              </button>
            </div>
          )}

          <div className="sort-section">
            <label htmlFor="sortBy">Sortieren nach:</label>
            <select 
              id="sortBy" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="number">Steinnummer</option>
              <option value="color">Farbe</option>
            </select>
          </div>

          <div className="minerals-grid">
            {loading ? (
              <div className="loading">Lade Mineralien...</div>
            ) : minerals.length === 0 ? (
              <div className="loading">Keine Mineralien gefunden</div>
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
                      <div className="placeholder">📸</div>
                    )}
                  </div>
                  <div className="mineral-info">
                    <h3>{mineral.name}</h3>
                    <p><strong>Nummer:</strong> {mineral.number}</p>
                    <p><strong>Farbe:</strong> {mineral.color || 'Nicht angegeben'}</p>
                    <p><strong>Regal:</strong> {mineral.shelf_code ? `${mineral.showcase_code}-${mineral.shelf_code}` : 'Nicht zugeordnet'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
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
          onClose={() => {
            setEditMode(null);
            setEditFormData({});
            setEditImage(null);
          }}
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
          loadMinerals={loadMinerals}
        />
      )}
    </>
  );
}