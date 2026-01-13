import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { Showcase, Mineral } from '../types';
import ShelfModal from './ShelfModal';
import BoxModal from './BoxModal';
import ShelfFormModal from './ShelfFormModal';
import BoxFormModal from './BoxFormModal';
import MineralModal from './MineralModal';

interface VitrinesPageProps {
  showcases: Showcase[];
  setShowcases: (showcases: Showcase[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isAuthenticated: boolean;
  selectedShowcase: Showcase | null;
  setSelectedShowcase: (showcase: Showcase | null) => void;
  showShowcaseModal: boolean;
  setShowShowcaseModal: (show: boolean) => void;
  showVitrineForm: boolean;
  setShowVitrineForm: (show: boolean) => void;
  showShelfForm: boolean;
  setShowShelfForm: (show: boolean) => void;
  selectedShelf: any;
  setSelectedShelf: (shelf: any) => void;
  shelfMinerals: Mineral[];
  setShelfMinerals: (minerals: Mineral[]) => void;
  showShelfMineralsModal: boolean;
  setShowShelfMineralsModal: (show: boolean) => void;
  editMode: 'mineral' | 'showcase' | 'shelf' | null;
  setEditMode: (mode: 'mineral' | 'showcase' | 'shelf' | null) => void;
  editFormData: any;
  setEditFormData: (data: any) => void;
  editImage: File | null;
  setEditImage: (image: File | null) => void;
  selectedMineral: Mineral | null;
  setSelectedMineral: (mineral: Mineral | null) => void;
  showMineralModal: boolean;
  setShowMineralModal: (show: boolean) => void;
  shelves: any[];
  loadStats: () => void;
}

interface Shelf {
  id: number;
  name: string;
  code: string;
  description: string;
  image_path: string;
  boxes: Box[];
}

interface Box {
  id: number;
  name: string;
  code: string;
  full_code: string;
  mineral_count: number;
  shelf_id: number;
}

const ShelfCard = React.memo(({ 
  shelf, 
  onClick,
  onBoxClick 
}: { 
  shelf: Shelf; 
  onClick: (id: number) => void;
  onBoxClick: (id: number) => void;
}) => (
  <div className="shelf-card-new">
    <div className="shelf-card-header" onClick={() => onClick(shelf.id)}>
      <div className="shelf-card-info">
        <div className="shelf-card-code">{shelf.code}</div>
        <div className="shelf-card-name">{shelf.name}</div>
        {shelf.description && (
          <div className="shelf-card-description">{shelf.description}</div>
        )}
      </div>
      {shelf.image_path && (
        <div className="shelf-card-image">
          <img src={`/uploads/${shelf.image_path}`} alt={shelf.name} loading="lazy" />
        </div>
      )}
    </div>
    
    {shelf.boxes && shelf.boxes.length > 0 && (
      <>
        <div className="shelf-divider"></div>
        <div className="shelf-boxes-preview">
          {shelf.boxes.map(box => (
            <div 
              key={box.id}
              className="box-preview-square"
              onClick={(e) => {
                e.stopPropagation();
                onBoxClick(box.id);
              }}
              title={box.name}
            >
              <div className="box-preview-code">{box.code}</div>
              <div className="box-preview-count">{box.mineral_count}</div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
));

export default function VitrinesPage({ 
  showcases,
  setShowcases,
  loading,
  setLoading,
  isAuthenticated,
  selectedShowcase,
  setSelectedShowcase,
  showShowcaseModal,
  setShowShowcaseModal,
  showVitrineForm,
  setShowVitrineForm,
  showShelfForm,
  setShowShelfForm,
  selectedShelf,
  setSelectedShelf,
  shelfMinerals,
  setShelfMinerals,
  showShelfMineralsModal,
  setShowShelfMineralsModal,
  editMode,
  setEditMode,
  editFormData,
  setEditFormData,
  editImage,
  setEditImage,
  selectedMineral,
  setSelectedMineral,
  showMineralModal,
  setShowMineralModal,
  shelves,
  loadStats
}: VitrinesPageProps) {

  const [allShelves, setAllShelves] = useState<Shelf[]>([]);
  const [selectedBox, setSelectedBox] = useState<any>(null);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [showBoxForm, setShowBoxForm] = useState(false);
  const [shelfFormData, setShelfFormData] = useState({
    name: '',
    code: '',
    description: '',
    position_order: 0
  });
  const [shelfImage, setShelfImage] = useState<File | null>(null);
  const [boxFormData, setBoxFormData] = useState({
    name: '',
    code: '',
    description: '',
    position_order: 0
  });
  const [boxImage, setBoxImage] = useState<File | null>(null);

  const loadShelves = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shelves-with-boxes');
      if (response.ok) {
        const data = await response.json();
        setAllShelves(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Regale:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const openShelfDetails = useCallback(async (shelfId: number) => {
    try {
      const response = await fetch(`/api/shelves/${shelfId}`);
      if (response.ok) {
        const shelf = await response.json();
        setSelectedShelf(shelf);
        setShowShelfMineralsModal(true);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Regal-Details:', error);
    }
  }, [setSelectedShelf, setShowShelfMineralsModal]);

  const openBoxDetails = useCallback(async (boxId: number) => {
    try {
      const response = await fetch(`/api/boxes/${boxId}/minerals`);
      if (response.ok) {
        const data = await response.json();
        setSelectedBox(data.boxInfo);
        setShelfMinerals(data.minerals);
        setShowBoxModal(true);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Box-Details:', error);
    }
  }, [setShelfMinerals]);

  const openMineralDetails = useCallback(async (id: number) => {
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
  }, [setSelectedMineral, setShowMineralModal]);

  const handleEditShelf = useCallback((shelf: any) => {
    setEditFormData({
      id: shelf.id,
      name: shelf.name,
      code: shelf.code,
      description: shelf.description || '',
      position_order: shelf.position_order || 0
    });
    setEditMode('showcase');
    setEditImage(null);
  }, [setEditFormData, setEditMode, setEditImage]);

  const handleEditBox = useCallback((box: any) => {
    setEditFormData({
      id: box.id,
      name: box.name,
      code: box.code,
      description: box.description || '',
      position_order: box.position_order || 0,
      shelf_id: box.shelf_id
    });
    setEditMode('shelf');
    setEditImage(null);
  }, [setEditFormData, setEditMode, setEditImage]);

  const handleEditMineral = useCallback((mineral: Mineral) => {
    setEditFormData({
      id: mineral.id,
      name: mineral.name,
      number: mineral.number,
      color: mineral.color || '',
      description: mineral.description || '',
      location: mineral.location || '',
      purchase_location: mineral.purchase_location || '',
      rock_type: mineral.rock_type || '',
      shelf_id: mineral.shelf_id || ''
    });
    setEditMode('mineral');
    setEditImage(null);
  }, [setEditFormData, setEditMode, setEditImage]);

  const handleShelfSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', shelfFormData.name);
      formData.append('code', shelfFormData.code);
      formData.append('description', shelfFormData.description);
      formData.append('position_order', shelfFormData.position_order.toString());
      
      if (shelfImage) {
        formData.append('image', shelfImage);
      }

      const response = await fetch('/api/shelves', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShelfFormData({
          name: '',
          code: '',
          description: '',
          position_order: 0
        });
        setShelfImage(null);
        setShowVitrineForm(false);
        loadShelves();
        loadStats();
        alert('Regal erfolgreich hinzugefügt!');
      } else {
        const error = await response.text();
        alert('Fehler: ' + error);
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Regals:', error);
      alert('Fehler beim Hinzufügen des Regals');
    } finally {
      setLoading(false);
    }
  }, [shelfFormData, shelfImage, setLoading, setShowVitrineForm, loadShelves, loadStats]);

  const handleBoxSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', boxFormData.name);
      formData.append('code', boxFormData.code);
      formData.append('description', boxFormData.description);
      formData.append('position_order', boxFormData.position_order.toString());
      formData.append('shelf_id', selectedShelf.id.toString());
      
      if (boxImage) {
        formData.append('image', boxImage);
      }

      const response = await fetch('/api/boxes', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setBoxFormData({
          name: '',
          code: '',
          description: '',
          position_order: 0
        });
        setBoxImage(null);
        setShowBoxForm(false);
        loadShelves();
        loadStats();
        alert('Box erfolgreich hinzugefügt!');
      } else {
        const error = await response.text();
        alert('Fehler: ' + error);
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Box:', error);
      alert('Fehler beim Hinzufügen der Box');
    } finally {
      setLoading(false);
    }
  }, [boxFormData, boxImage, selectedShelf, setLoading, loadShelves, loadStats]);

  const handleDelete = useCallback(async (type: 'mineral' | 'showcase' | 'shelf', id: number) => {
    const confirmMessage = {
      mineral: 'Möchten Sie dieses Mineral wirklich löschen?',
      showcase: 'Möchten Sie dieses Regal wirklich löschen? Alle zugehörigen Boxen werden ebenfalls gelöscht!',
      shelf: 'Möchten Sie diese Box wirklich löschen? Alle zugeordneten Mineralien verlieren ihre Box-Zuordnung!'
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
          url = `/api/shelves/${id}`;
          break;
        case 'shelf':
          url = `/api/boxes/${id}`;
          break;
      }

      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (type === 'mineral') {
          setShowMineralModal(false);
          setSelectedMineral(null);
        } else if (type === 'showcase') {
          setShowShelfMineralsModal(false);
          setSelectedShelf(null);
        } else if (type === 'shelf') {
          setShowBoxModal(false);
          setSelectedBox(null);
        }

        loadStats();
        loadShelves();

        const entityNames = {
          mineral: 'Mineral',
          showcase: 'Regal',
          shelf: 'Box'
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
  }, [setLoading, setShowMineralModal, setSelectedMineral, setShowShelfMineralsModal, 
      setSelectedShelf, loadStats, loadShelves]);

  useEffect(() => {
    loadShelves();
  }, [loadShelves]);

  return (
    <>
      <section className="page active">
        <div className="container">
          <div className="page-header-vitrines">
            <div className="page-title-section">
              <h1 className="page-title-vitrines">Regale & Boxen</h1>
              <div className="page-stats-inline">
                <div className="stat-inline">
                  <span className="stat-number">{allShelves.length}</span>
                  <span className="stat-label">Regale</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-inline">
                  <span className="stat-number">
                    {allShelves.reduce((acc, shelf) => acc + (shelf.boxes?.length || 0), 0)}
                  </span>
                  <span className="stat-label">Boxen</span>
                </div>
              </div>
            </div>
            {isAuthenticated && (
              <button 
                className="btn-new btn-primary-new"
                onClick={() => setShowVitrineForm(true)}>
                Neues Regal
              </button>
            )}
          </div>

          <div className="shelves-grid-new">
            {loading ? (
              <div className="loading-new">Lade Regale...</div>
            ) : allShelves.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">□</div>
                <h3>Noch keine Regale vorhanden</h3>
                <p>Fügen Sie Ihr erstes Regal hinzu, um Ihre Sammlung zu organisieren.</p>
              </div>
            ) : (
              allShelves.map(shelf => (
                <ShelfCard 
                  key={shelf.id} 
                  shelf={shelf} 
                  onClick={openShelfDetails}
                  onBoxClick={openBoxDetails}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {showShelfMineralsModal && selectedShelf && (
        <ShelfModal 
          shelf={selectedShelf}
          isAuthenticated={isAuthenticated}
          onClose={() => setShowShelfMineralsModal(false)}
          onEdit={handleEditShelf}
          onDelete={handleDelete}
          setShowBoxForm={setShowBoxForm}
          onOpenBoxDetails={openBoxDetails}
        />
      )}

      {showBoxModal && selectedBox && (
        <BoxModal 
          box={selectedBox}
          minerals={shelfMinerals}
          isAuthenticated={isAuthenticated}
          onClose={() => setShowBoxModal(false)}
          onEdit={handleEditBox}
          onDelete={handleDelete}
          onOpenMineralDetails={openMineralDetails}
          setShowBoxModal={setShowBoxModal}
        />
      )}

      {showVitrineForm && (
        <ShelfFormModal 
          formData={shelfFormData}
          setFormData={setShelfFormData}
          image={shelfImage}
          setImage={setShelfImage}
          loading={loading}
          onSubmit={handleShelfSubmit}
          onClose={() => {
            setShowVitrineForm(false);
            setShelfImage(null);
          }}
        />
      )}

      {showBoxForm && selectedShelf && (
        <BoxFormModal 
          shelf={selectedShelf}
          formData={boxFormData}
          setFormData={setBoxFormData}
          image={boxImage}
          setImage={setBoxImage}
          loading={loading}
          onSubmit={handleBoxSubmit}
          onClose={() => {
            setShowBoxForm(false);
            setBoxImage(null);
          }}
        />
      )}

      {showMineralModal && selectedMineral && (
        <MineralModal 
          mineral={selectedMineral}
          isAuthenticated={isAuthenticated}
          onClose={() => setShowMineralModal(false)}
          onEdit={handleEditMineral}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}