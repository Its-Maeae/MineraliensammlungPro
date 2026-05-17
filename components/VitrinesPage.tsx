import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { Showcase, Mineral, Shelf } from '../types';
import RegalModal from './RegalModal';
import BoxModal from './BoxModal';
import VitrineFormModal from './VitrineFormModal';
import ShelfFormModal from './ShelfFormModal';
import MineralModal from './MineralModal';

interface VitrinesPageProps {
  showcases: Showcase[];
  setShowcases: React.Dispatch<React.SetStateAction<Showcase[]>>;
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

  const hasSections = (box.section_count ?? 0) > 0;

  return (
    <div
      className="box-square"
      onClick={handleClick}
      title={`${box.name} – ${box.mineral_count || 0} Mineralien${hasSections ? ` · ${box.section_count} Sektionen` : ''}`}
    >
      <div className="box-square-code">{box.code}</div>
      <div className="box-square-mineral-count">{box.mineral_count || 0}</div>
      {hasSections && (
        <span className="box-has-sections-badge">▤ {box.section_count}</span>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.box.id === nextProps.box.id &&
    prevProps.box.mineral_count === nextProps.box.mineral_count &&
    prevProps.box.section_count === nextProps.box.section_count;
});

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
  if (prevProps.showcase.id !== nextProps.showcase.id) return false;
  if (prevProps.showcase.shelf_count !== nextProps.showcase.shelf_count) return false;
  if (prevProps.showcase.mineral_count !== nextProps.showcase.mineral_count) return false;
  if (prevProps.showcase.image_path !== nextProps.showcase.image_path) return false;
  if (prevProps.showcase.name !== nextProps.showcase.name) return false;
  if (prevProps.showcase.code !== nextProps.showcase.code) return false;
  const prevShelves = prevProps.showcase.shelves ?? [];
  const nextShelves = nextProps.showcase.shelves ?? [];
  if (prevShelves.length !== nextShelves.length) return false;
  for (let i = 0; i < prevShelves.length; i++) {
    if (prevShelves[i].id !== nextShelves[i].id) return false;
    if (prevShelves[i].name !== nextShelves[i].name) return false;
    if (prevShelves[i].code !== nextShelves[i].code) return false;
    if (prevShelves[i].mineral_count !== nextShelves[i].mineral_count) return false;
    if (prevShelves[i].section_count !== nextShelves[i].section_count) return false;
  }
  return true;
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

  const showcaseCache = useRef<Map<number, Showcase>>(new Map());
  const mineralCache = useRef<Map<number, Mineral>>(new Map());

  const clearCaches = useCallback((type: 'showcase' | 'shelf' | 'mineral', id: number) => {
    if (type === 'showcase') showcaseCache.current.delete(id);
    else if (type === 'mineral') mineralCache.current.delete(id);
  }, []);

  const [vitrineFormData, setVitrineFormData] = useState({
    name: '', code: '', location: '', description: ''
  });
  const [vitrineImage, setVitrineImage] = useState<File | null>(null);
  const [shelfFormData, setShelfFormData] = useState({
    name: '', code: '', description: '', position_order: 0
  });
  const [shelfImage, setShelfImage] = useState<File | null>(null);
  const [shelfLoading, setShelfLoading] = useState(false);
  const [showcaseLoading, setShowcaseLoading] = useState(false);

  const loadShowcases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/showcases');
      if (response.ok) {
        const data = await response.json();

        const showcasesWithBoxes = await Promise.all(
          data.map(async (showcase: Showcase) => {
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

        setShowcases(showcasesWithBoxes);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Regale:', error);
    } finally {
      setLoading(false);
    }
  }, [setShowcases, setLoading]);

  const openShowcaseDetails = useCallback(async (id: number) => {
    if (showcaseCache.current.has(id)) {
      const cached = showcaseCache.current.get(id)!;
      setSelectedShowcase(cached);
      setShowShowcaseModal(true);
      return;
    }
    try {
      setShowcaseLoading(true);
      const response = await fetch(`/api/showcases/${id}`);
      if (response.ok) {
        const showcase = await response.json();
        showcaseCache.current.set(id, showcase);
        setSelectedShowcase(showcase);
        setShowShowcaseModal(true);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Regal-Details:', error);
    } finally {
      setShowcaseLoading(false);
    }
  }, [setSelectedShowcase, setShowShowcaseModal]);

  const openShelfDetails = useCallback(async (shelfId: number) => {
    setShelfLoading(true);
    try {
      const shelfResponse = await fetch(`/api/shelves/${shelfId}`);
      if (shelfResponse.ok) {
        const shelfInfo = await shelfResponse.json();
        setSelectedShelf(shelfInfo);
        setShelfMinerals([]);
        setShowShelfMineralsModal(true);
      } else {
        const responseData = await shelfResponse.json();
        alert('Fehler beim Laden der Box-Details: ' + (responseData.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Box-Details:', error);
      alert('Fehler beim Laden der Box-Details');
    } finally {
      setShelfLoading(false);
    }
  }, [setSelectedShelf, setShelfMinerals, setShowShelfMineralsModal]);

  const handleCloseShelfModal = useCallback(() => {
    setShowShelfMineralsModal(false);
    setSelectedShelf(null);
    setShelfMinerals([]);
  }, [setShowShelfMineralsModal, setSelectedShelf, setShelfMinerals]);

  useEffect(() => {
    if (!selectedShelf) return;

    const applyShelfUpdate = (sc: Showcase): Showcase => {
      if (!sc.shelves) return sc;
      const idx = sc.shelves.findIndex((s: Shelf) => s.id === selectedShelf.id);
      if (idx === -1) return sc;
      const updatedShelves: Shelf[] = [...sc.shelves];
      updatedShelves[idx] = {
        ...updatedShelves[idx],
        name: selectedShelf.name || selectedShelf.shelf_name,
        code: selectedShelf.code,
        description: selectedShelf.description,
        position_order: selectedShelf.position_order,
        image_path: selectedShelf.image_path,
      };
      const updated = { ...sc, shelves: updatedShelves };
      showcaseCache.current.set(sc.id, updated);
      return updated;
    };

    setShowcases(prev => prev.map(applyShelfUpdate));

    if (selectedShowcase) {
      setSelectedShowcase(applyShelfUpdate(selectedShowcase));
    }
  }, [selectedShelf, setShowcases, selectedShowcase, setSelectedShowcase]);

  const openMineralDetails = useCallback(async (id: number) => {
    if (mineralCache.current.has(id)) {
      const cached = mineralCache.current.get(id)!;
      setSelectedMineral(cached);
      setShowMineralModal(true);
      return;
    }
    try {
      const response = await fetch(`/api/minerals/${id}`);
      if (response.ok) {
        const mineral = await response.json();
        mineralCache.current.set(id, mineral);
        setSelectedMineral(mineral);
        setShowMineralModal(true);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mineral-Details:', error);
    }
  }, [setSelectedMineral, setShowMineralModal]);

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
      shelf_id: mineral.shelf_id || '',
      section_id: (mineral as any).section_id || '', 
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
      if (vitrineImage) formData.append('image', vitrineImage);

      const response = await fetch('/api/showcases', { method: 'POST', body: formData });
      if (response.ok) {
        setVitrineFormData({ name: '', code: '', location: '', description: '' });
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
      if (shelfImage) formData.append('image', shelfImage);

      const response = await fetch('/api/shelves', { method: 'POST', body: formData });
      if (response.ok) {
        setShelfFormData({ name: '', code: '', description: '', position_order: 0 });
        setShelfImage(null);
        setShowShelfForm(false);
        showcaseCache.current.delete(selectedShowcase!.id);
        await loadShowcases();
        await openShowcaseDetails(selectedShowcase!.id);
        loadStats();
        alert('Box erfolgreich hinzugefügt!');
      } else {
        const error = await response.text();
        alert('Fehler: ' + error);
      }
    } catch (error) {
      alert('Fehler beim Hinzufügen der Box');
    } finally {
      setLoading(false);
    }
  }, [shelfFormData, shelfImage, selectedShowcase, setLoading, setShowShelfForm, loadShowcases, openShowcaseDetails, loadStats]);

  const handleDelete = useCallback(async (type: 'mineral' | 'showcase' | 'shelf', id: number) => {
    const confirmMessage = {
      mineral: 'Möchten Sie dieses Mineral wirklich löschen?',
      showcase: 'Möchten Sie dieses Regal wirklich löschen? Alle zugehörigen Boxen und Sektionen werden ebenfalls gelöscht!',
      shelf: 'Möchten Sie diese Box wirklich löschen? Alle Sektionen werden gelöscht. Mineralien werden nicht gelöscht, aber ihre Zuordnung entfernt!'
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
          mineralCache.current.delete(id);
          setShowMineralModal(false);
          setSelectedMineral(null);
        } else if (type === 'showcase') {
          showcaseCache.current.delete(id);
          setShowShowcaseModal(false);
          setSelectedShowcase(null);
        } else if (type === 'shelf') {
          if (selectedShowcase) showcaseCache.current.delete(selectedShowcase.id);
          handleCloseShelfModal();
        }

        loadStats();
        if (type === 'showcase') loadShowcases();
        if (type === 'shelf' && selectedShowcase) await openShowcaseDetails(selectedShowcase.id);

        const entityNames = { mineral: 'Mineral', showcase: 'Regal', shelf: 'Box' };
        alert(`${entityNames[type]} erfolgreich gelöscht!`);
      } else {
        const responseData = await response.text();
        alert('Fehler beim Löschen: ' + responseData);
      }
    } catch (error) {
      alert('Fehler beim Löschen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setShowMineralModal, setSelectedMineral, setShowShowcaseModal, setSelectedShowcase,
    handleCloseShelfModal, loadStats, loadShowcases, openShowcaseDetails, selectedShowcase]);

  const handleMineralCountChanged = useCallback((shelfId: number, delta: number) => {
    if (delta === 0) {
      const affected = showcases.find((sc: Showcase) =>
        sc.shelves?.some((s: any) => s.id === shelfId)
      );
      if (affected) {
        fetch(`/api/showcases/${affected.id}`)
          .then((r: Response) => r.ok ? r.json() : null)
          .then((data: Showcase | null) => {
            if (data) {
              showcaseCache.current.set(affected.id, data);
              setShowcases(showcases.map((sc: Showcase) => sc.id === affected.id ? data : sc));
            }
          })
          .catch(() => {});
      }
      return;
    }

    const updated: Showcase[] = showcases.map((showcase: Showcase) => {
      if (!showcase.shelves) return showcase;
      const hasShelf = showcase.shelves.some((s: any) => s.id === shelfId);
      if (!hasShelf) return showcase;
      const newShelves = showcase.shelves.map((s: any) =>
        s.id === shelfId
          ? { ...s, mineral_count: Math.max(0, (s.mineral_count || 0) + delta) }
          : s
      );
      const newMineralCount = Math.max(0, (showcase.mineral_count || 0) + delta);
      showcaseCache.current.delete(showcase.id);
      return { ...showcase, shelves: newShelves, mineral_count: newMineralCount };
    });
    setShowcases(updated);
  }, [showcases, setShowcases]);

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

      {showShowcaseModal && selectedShowcase && (
        <>
          {showcaseLoading && (
            <div style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', zIndex: 10000,
              background: 'rgba(255,255,255,0.9)', padding: '20px',
              borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <div className="loading">Lade Regal...</div>
            </div>
          )}
          <RegalModal
            showcase={selectedShowcase}
            isAuthenticated={isAuthenticated}
            onClose={() => setShowShowcaseModal(false)}
            onEdit={handleEditShowcase}
            onDelete={handleDelete}
            setShowShelfForm={setShowShelfForm}
            onOpenShelfDetails={openShelfDetails}
          />
        </>
      )}

      {showShelfMineralsModal && selectedShelf && (
        <BoxModal
          shelf={selectedShelf}
          minerals={shelfMinerals}
          loading={shelfLoading}
          isAuthenticated={isAuthenticated}
          onClose={handleCloseShelfModal}
          onEdit={handleEditShelf}
          onDelete={handleDelete}
          onOpenMineralDetails={openMineralDetails}
          setShowShelfMineralsModal={setShowShelfMineralsModal}
          onMineralCountChanged={handleMineralCountChanged}
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
          onClose={() => { setShowVitrineForm(false); setVitrineImage(null); }}
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
          onClose={() => { setShowShelfForm(false); setShelfImage(null); }}
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