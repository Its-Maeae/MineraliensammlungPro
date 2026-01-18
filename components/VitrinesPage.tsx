import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { Showcase, Mineral } from '../types';
import RegalModal from './RegalModal';
import BoxModal from './BoxModal';
import VitrineFormModal from './VitrineFormModal';
import ShelfFormModal from './ShelfFormModal';
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

// Modal Stack Types
type ModalType = 'showcase' | 'shelf' | 'mineral';

interface ModalStackItem {
  type: ModalType;
  data: any;
}

// Optimierte RegalCard mit besserer Performance
const RegalCard = React.memo(({ 
  showcase, 
  onClick,
  onBoxClick
}: { 
  showcase: Showcase; 
  onClick: (id: number) => void;
  onBoxClick: (boxId: number) => void;
}) => {
  const boxes = showcase.shelves || [];
  
  const handleRegalClick = useCallback(() => {
    onClick(showcase.id);
  }, [onClick, showcase.id]);
  
  return (
    <div className="regal-card">
      <div className="regal-header" onClick={handleRegalClick}>
        {showcase.image_path && (
          <div className="regal-image-preview">
            <img src={`/uploads/${showcase.image_path}`} alt={showcase.name} loading="lazy" />
          </div>
        )}
        {!showcase.image_path && (
          <div className="regal-image-preview">
            <div className="regal-image-preview-placeholder"></div>
          </div>
        )}
        
        <div className="regal-header-content">
          <div className="regal-title">
            <span>{showcase.name}</span>
            <span className="regal-code-badge">{showcase.code}</span>
          </div>
          <div className="regal-meta">
            <div className="regal-meta-item">
              <strong>{boxes.length}</strong> Boxen
            </div>
            <div className="regal-meta-item">
              <strong>{showcase.mineral_count || 0}</strong> Mineralien
            </div>
            {showcase.location && (
              <div className="regal-meta-item">
                {showcase.location}
              </div>
            )}
          </div>
          {showcase.description && (
            <div className="regal-description">
              {showcase.description}
            </div>
          )}
        </div>
      </div>
      
      <div className="box-preview-section">
        <div className="box-preview-title">Boxen ({boxes.length})</div>
        {boxes.length > 0 ? (
          <div className="box-preview-grid">
            {boxes.map((box: any) => (
              <BoxSquare 
                key={box.id}
                box={box}
                onBoxClick={onBoxClick}
              />
            ))}
          </div>
        ) : (
          <div className="empty-boxes">Keine Boxen vorhanden</div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.showcase.id === nextProps.showcase.id &&
         prevProps.showcase.shelf_count === nextProps.showcase.shelf_count &&
         prevProps.showcase.mineral_count === nextProps.showcase.mineral_count &&
         prevProps.showcase.image_path === nextProps.showcase.image_path;
});

// Separate BoxSquare Component für bessere Performance
const BoxSquare = React.memo(({ 
  box, 
  onBoxClick 
}: { 
  box: any; 
  onBoxClick: (boxId: number) => void;
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onBoxClick(box.id);
  }, [box.id, onBoxClick]);

  return (
    <div 
      className="box-square"
      onClick={handleClick}
      title={`${box.name} - ${box.mineral_count || 0} Mineralien`}
    >
      <div className="box-square-code">{box.code}</div>
      <div className="box-square-mineral-count">{box.mineral_count || 0}</div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.box.id === nextProps.box.id &&
         prevProps.box.mineral_count === nextProps.box.mineral_count;
});

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

  // Modal Stack State
  const [modalStack, setModalStack] = useState<ModalStackItem[]>([]);

  const showcaseCache = useRef<Map<number, Showcase>>(new Map());
  const shelfCache = useRef<Map<number, { shelfInfo: any; minerals: Mineral[] }>>(new Map());
  const mineralCache = useRef<Map<number, Mineral>>(new Map());
  
  const clearCaches = useCallback((type: 'showcase' | 'shelf' | 'mineral', id: number) => {
    console.log('Clearing cache for', type, id);
    
    if (type === 'showcase') {
      showcaseCache.current.delete(id);
      shelfCache.current.clear();
    } else if (type === 'shelf') {
      shelfCache.current.delete(id);
    } else if (type === 'mineral') {
      mineralCache.current.delete(id);
    }
  }, []);

  const [vitrineFormData, setVitrineFormData] = useState({
    name: '',
    code: '',
    location: '',
    description: ''
  });
  const [vitrineImage, setVitrineImage] = useState<File | null>(null);
  const [shelfFormData, setShelfFormData] = useState({
    name: '',
    code: '',
    description: '',
    position_order: 0
  });
  const [shelfImage, setShelfImage] = useState<File | null>(null);
  const [shelfLoading, setShelfLoading] = useState(false);
  const [showcaseLoading, setShowcaseLoading] = useState(false);

  // Modal Stack Helper Functions
  const pushModal = useCallback((type: ModalType, data: any) => {
    setModalStack(prev => [...prev, { type, data }]);
  }, []);

  const popModal = useCallback(() => {
    setModalStack(prev => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const clearModalStack = useCallback(() => {
    setModalStack([]);
  }, []);

  // Get current modal
  const currentModal = modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;

  const loadShowcases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/showcases');
      if (response.ok) {
        const data = await response.json();
        
        const showcasesWithBoxes = await Promise.all(
          data.slice(0, 5).map(async (showcase: Showcase) => {
            try {
              const detailResponse = await fetch(`/api/showcases/${showcase.id}`);
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                showcaseCache.current.set(showcase.id, detailData);
                return detailData;
              }
            } catch (error) {
              console.error(`Fehler beim Laden der Boxen für Regal ${showcase.id}:`, error);
            }
            return showcase;
          })
        );
        
        const allShowcases = [
          ...showcasesWithBoxes,
          ...data.slice(5)
        ];
        
        setShowcases(allShowcases);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Regale:', error);
    } finally {
      setLoading(false);
    }
  }, [setShowcases, setLoading]);

  const openShowcaseDetails = useCallback(async (id: number) => {
    let showcase: Showcase;
    
    if (showcaseCache.current.has(id)) {
      showcase = showcaseCache.current.get(id)!;
    } else {
      try {
        setShowcaseLoading(true);
        const response = await fetch(`/api/showcases/${id}`);
        if (response.ok) {
          showcase = await response.json();
          showcaseCache.current.set(id, showcase);
        } else {
          return;
        }
      } catch (error) {
        console.error('Fehler beim Laden der Regal-Details:', error);
        return;
      } finally {
        setShowcaseLoading(false);
      }
    }
    
    setSelectedShowcase(showcase);
    pushModal('showcase', showcase);
  }, [setSelectedShowcase, pushModal]);

  const openShelfDetails = useCallback(async (shelfId: number) => {
    let shelfInfo: any;
    let minerals: Mineral[];

    if (shelfCache.current.has(shelfId)) {
      const cached = shelfCache.current.get(shelfId)!;
      shelfInfo = cached.shelfInfo;
      minerals = cached.minerals;
    } else {
      setShelfLoading(true);
      
      try {
        const response = await fetch(`/api/shelves/${shelfId}/minerals?limit=1000`);
        const responseData = await response.json();
        
        if (response.ok) {
          shelfInfo = responseData.shelfInfo;
          minerals = responseData.minerals;
          shelfCache.current.set(shelfId, { shelfInfo, minerals });
        } else {
          console.error('Error loading box details:', responseData);
          alert('Fehler beim Laden der Box-Details: ' + (responseData.error || 'Unbekannter Fehler'));
          return;
        }
      } catch (error) {
        console.error('Fehler beim Laden der Box-Details:', error);
        alert('Fehler beim Laden der Box-Details');
        return;
      } finally {
        setShelfLoading(false);
      }
    }
    
    setSelectedShelf(shelfInfo);
    setShelfMinerals(minerals);
    pushModal('shelf', { shelfInfo, minerals });
  }, [setSelectedShelf, setShelfMinerals, pushModal]);

  const openMineralDetails = useCallback(async (id: number) => {
    let mineral: Mineral;

    if (mineralCache.current.has(id)) {
      mineral = mineralCache.current.get(id)!;
    } else {
      try {
        const response = await fetch(`/api/minerals/${id}`);
        if (response.ok) {
          mineral = await response.json();
          mineralCache.current.set(id, mineral);
        } else {
          return;
        }
      } catch (error) {
        console.error('Fehler beim Laden der Mineral-Details:', error);
        return;
      }
    }
    
    setSelectedMineral(mineral);
    pushModal('mineral', mineral);
  }, [setSelectedMineral, pushModal]);

  const handleCloseModal = useCallback(() => {
    popModal();
  }, [popModal]);

  // Sync modal stack with previous state variables (for backward compatibility)
  useEffect(() => {
    if (currentModal) {
      if (currentModal.type === 'showcase') {
        setShowShowcaseModal(true);
        setShowShelfMineralsModal(false);
        setShowMineralModal(false);
      } else if (currentModal.type === 'shelf') {
        setShowShowcaseModal(false);
        setShowShelfMineralsModal(true);
        setShowMineralModal(false);
      } else if (currentModal.type === 'mineral') {
        setShowShowcaseModal(false);
        setShowShelfMineralsModal(false);
        setShowMineralModal(true);
      }
    } else {
      setShowShowcaseModal(false);
      setShowShelfMineralsModal(false);
      setShowMineralModal(false);
    }
  }, [currentModal, setShowShowcaseModal, setShowShelfMineralsModal, setShowMineralModal]);

  const handleEditShowcase = useCallback((showcase: Showcase) => {
    setEditFormData({
      id: showcase.id,
      name: showcase.name,
      code: showcase.code,
      location: showcase.location || '',
      description: showcase.description || ''
    });
    setEditMode('showcase');
    setEditImage(null);
  }, [setEditFormData, setEditMode, setEditImage]);

  const handleEditShelf = useCallback((shelf: any) => {
    setEditFormData({
      id: shelf.id,
      name: shelf.name || shelf.shelf_name,
      code: shelf.code,
      description: shelf.description || '',
      position_order: shelf.position_order || 0,
      showcase_id: shelf.showcase_id || selectedShowcase?.id
    });
    setEditMode('shelf');
    setEditImage(null);
  }, [setEditFormData, setEditMode, setEditImage, selectedShowcase]);

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

  const handleVitrineSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', vitrineFormData.name);
      formData.append('code', vitrineFormData.code);
      formData.append('location', vitrineFormData.location);
      formData.append('description', vitrineFormData.description);
      
      if (vitrineImage) {
        formData.append('image', vitrineImage);
      }

      const response = await fetch('/api/showcases', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setVitrineFormData({
          name: '',
          code: '',
          location: '',
          description: ''
        });
        setVitrineImage(null);
        setShowVitrineForm(false);
        showcaseCache.current.clear();
        loadShowcases();
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
  }, [vitrineFormData, vitrineImage, setLoading, setShowVitrineForm, loadShowcases, loadStats]);

  const handleShelfSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', shelfFormData.name);
      formData.append('code', shelfFormData.code);
      formData.append('description', shelfFormData.description);
      formData.append('position_order', shelfFormData.position_order.toString());
      formData.append('showcase_id', selectedShowcase!.id.toString());
      
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
        setShowShelfForm(false);
        
        showcaseCache.current.delete(selectedShowcase!.id);
        shelfCache.current.clear();
        
        await loadShowcases();
        await openShowcaseDetails(selectedShowcase!.id);
        
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
  }, [shelfFormData, shelfImage, selectedShowcase, setLoading, setShowShelfForm, loadShowcases, openShowcaseDetails, loadStats]);

  const handleDelete = useCallback(async (type: 'mineral' | 'showcase' | 'shelf', id: number) => {
    const confirmMessage = {
      mineral: 'Möchten Sie dieses Mineral wirklich löschen?',
      showcase: 'Möchten Sie dieses Regal wirklich löschen? Alle zugehörigen Boxen werden ebenfalls gelöscht!',
      shelf: 'Möchten Sie diese Box wirklich löschen? Alle zugeordneten Mineralien werden nicht gelöscht, aber ihre Box-Zuordnung entfernt!'
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
          mineralCache.current.delete(id);
        } else if (type === 'showcase') {
          showcaseCache.current.delete(id);
        } else if (type === 'shelf') {
          shelfCache.current.delete(id);
          if (selectedShowcase) {
            showcaseCache.current.delete(selectedShowcase.id);
          }
        }

        // Close current modal and go back to previous
        popModal();

        loadStats();
        
        if (type === 'showcase') {
          loadShowcases();
        }
        
        if (type === 'shelf' && selectedShowcase) {
          showcaseCache.current.delete(selectedShowcase.id);
          const response = await fetch(`/api/showcases/${selectedShowcase.id}`);
          if (response.ok) {
            const updatedShowcase = await response.json();
            showcaseCache.current.set(selectedShowcase.id, updatedShowcase);
            setSelectedShowcase(updatedShowcase);
            
            // Update the modal stack with refreshed data
            setModalStack(prev => {
              const newStack = [...prev];
              const showcaseIndex = newStack.findIndex(m => m.type === 'showcase');
              if (showcaseIndex !== -1) {
                newStack[showcaseIndex].data = updatedShowcase;
              }
              return newStack;
            });
          }
        }

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
  }, [setLoading, loadStats, loadShowcases, selectedShowcase, popModal, setSelectedShowcase]);

  const showcasesList = useMemo(() => {
    return showcases.map(showcase => (
      <RegalCard 
        key={showcase.id} 
        showcase={showcase} 
        onClick={openShowcaseDetails}
        onBoxClick={openShelfDetails}
      />
    ));
  }, [showcases, openShowcaseDetails, openShelfDetails]);

  useEffect(() => {
    loadShowcases();
  }, []);

  return (
    <>
      <section className="page active">
        <div className="container">
          <div className="page-header">
            <div className="page-header-content">
              <div>
                <h1 className="page-title">Regale</h1>
                <p className="page-description">Organisieren Sie Ihre Sammlung in Regalen und Boxen</p>
              </div>
              {isAuthenticated && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowVitrineForm(true)}>
                    Neues Regal hinzufügen
                </button>
              )}
            </div>
          </div>

          <div className="regale-grid">
            {loading ? (
              <div className="loading">Lade Regale...</div>
            ) : showcases.length === 0 ? (
              <div className="no-showcases">
                <h3>Noch keine Regale vorhanden</h3>
                <p>Fügen Sie Ihr erstes Regal hinzu, um Ihre Sammlung zu organisieren.</p>
              </div>
            ) : (
              showcasesList
            )}
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      {showcaseLoading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          background: 'rgba(255,255,255,0.9)',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div className="loading">Lade Regal...</div>
        </div>
      )}

      {/* Render only the current modal */}
      {currentModal?.type === 'showcase' && (
        <RegalModal 
          showcase={currentModal.data}
          isAuthenticated={isAuthenticated}
          onClose={handleCloseModal}
          onEdit={handleEditShowcase}
          onDelete={handleDelete}
          setShowShelfForm={setShowShelfForm}
          onOpenShelfDetails={openShelfDetails}
        />
      )}

      {currentModal?.type === 'shelf' && (
        <BoxModal 
          shelf={currentModal.data.shelfInfo}
          minerals={currentModal.data.minerals}
          loading={shelfLoading}
          isAuthenticated={isAuthenticated}
          onClose={handleCloseModal}
          onEdit={handleEditShelf}
          onDelete={handleDelete}
          onOpenMineralDetails={openMineralDetails}
          setShowShelfMineralsModal={setShowShelfMineralsModal}
        />
      )}

      {currentModal?.type === 'mineral' && (
        <MineralModal 
          mineral={currentModal.data}
          isAuthenticated={isAuthenticated}
          onClose={handleCloseModal}
          onEdit={handleEditMineral}
          onDelete={handleDelete}
        />
      )}

      {showVitrineForm && (
        <VitrineFormModal 
          formData={vitrineFormData}
          setFormData={setVitrineFormData}
          image={vitrineImage}
          setImage={setVitrineImage}
          loading={loading}
          onSubmit={handleVitrineSubmit}
          onClose={() => {
            setShowVitrineForm(false);
            setVitrineImage(null);
          }}
        />
      )}

      {showShelfForm && selectedShowcase && (
        <ShelfFormModal 
          showcase={selectedShowcase}
          formData={shelfFormData}
          setFormData={setShelfFormData}
          image={shelfImage}
          setImage={setShelfImage}
          loading={loading}
          onSubmit={handleShelfSubmit}
          onClose={() => {
            setShowShelfForm(false);
            setShelfImage(null);
          }}
        />
      )}
    </>
  );
}