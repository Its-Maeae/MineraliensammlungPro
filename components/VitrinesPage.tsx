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
        {showcase.image_path ? (
          <div className="regal-image-preview">
            <img src={`/uploads/${showcase.image_path}`} alt={showcase.name} loading="lazy" />
          </div>
        ) : (
          <div className="regal-image-preview">
            <div className="regal-image-preview-placeholder" />
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
              <div className="regal-meta-item">{showcase.location}</div>
            )}
          </div>
          {showcase.description && (
            <div className="regal-description">{showcase.description}</div>
          )}
        </div>
      </div>
      
      <div className="box-preview-section">
        <div className="box-preview-title">Boxen ({boxes.length})</div>
        {boxes.length > 0 ? (
          <div className="box-preview-grid">
            {boxes.map((box: any) => (
              <BoxSquare key={box.id} box={box} onBoxClick={onBoxClick} />
            ))}
          </div>
        ) : (
          <div className="empty-boxes">Keine Boxen vorhanden</div>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.showcase.id === next.showcase.id &&
         prev.showcase.shelf_count === next.showcase.shelf_count &&
         prev.showcase.mineral_count === next.showcase.mineral_count &&
         prev.showcase.image_path === next.showcase.image_path;
});

const BoxSquare = React.memo(({ box, onBoxClick }: { box: any; onBoxClick: (boxId: number) => void }) => {
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
}, (prev, next) => prev.box.id === next.box.id && prev.box.mineral_count === next.box.mineral_count);

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

  const [vitrineFormData, setVitrineFormData] = useState({ name: '', code: '', location: '', description: '' });
  const [vitrineImage, setVitrineImage] = useState<File | null>(null);
  const [shelfFormData, setShelfFormData] = useState({ name: '', code: '', description: '', position_order: 0 });
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
          data.slice(0, 5).map(async (showcase: Showcase) => {
            try {
              const detailResponse = await fetch(`/api/showcases/${showcase.id}`);
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                showcaseCache.current.set(showcase.id, detailData);
                return detailData;
              }
            } catch {}
            return showcase;
          })
        );
        setShowcases([...showcasesWithBoxes, ...data.slice(5)]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Regale:', error);
    } finally {
      setLoading(false);
    }
  }, [setShowcases, setLoading]);

  const openShowcaseDetails = useCallback(async (id: number) => {
    if (showcaseCache.current.has(id)) {
      setSelectedShowcase(showcaseCache.current.get(id)!);
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

  const openMineralDetails = useCallback(async (id: number) => {
    if (mineralCache.current.has(id)) {
      setSelectedMineral(mineralCache.current.get(id)!);
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
    setEditFormData({ id: showcase.id, name: showcase.name, code: showcase.code, location: showcase.location || '', description: showcase.description || '' });
    setEditMode('showcase');
    setEditImage(null);
  }, [setEditFormData, setEditMode, setEditImage]);

  const handleEditShelf = useCallback((shelf: any) => {
    setEditFormData({ id: shelf.id, name: shelf.name || shelf.shelf_name, code: shelf.code, description: shelf.description || '', position_order: shelf.position_order || 0, showcase_id: shelf.showcase_id || selectedShowcase?.id });
    setEditMode('shelf');
    setEditImage(null);
  }, [setEditFormData, setEditMode, setEditImage, selectedShowcase]);

  const handleEditMineral = useCallback((mineral: Mineral) => {
    setEditFormData({ id: mineral.id, name: mineral.name, number: mineral.number, color: mineral.color || '', description: mineral.description || '', location: mineral.location || '', purchase_location: mineral.purchase_location || '', rock_type: mineral.rock_type || '', shelf_id: mineral.shelf_id || '' });
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
        alert('Fehler: ' + await response.text());
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
        alert('Fehler: ' + await response.text());
      }
    } catch (error) {
      alert('Fehler beim Hinzufügen der Box');
    } finally {
      setLoading(false);
    }
  }, [shelfFormData, shelfImage, selectedShowcase, setLoading, setShowShelfForm, loadShowcases, openShowcaseDetails, loadStats]);

  const handleDelete = useCallback(async (type: 'mineral' | 'showcase' | 'shelf', id: number) => {
    const msgs = {
      mineral: 'Möchten Sie dieses Mineral wirklich löschen?',
      showcase: 'Möchten Sie dieses Regal wirklich löschen? Alle zugehörigen Boxen werden ebenfalls gelöscht!',
      shelf: 'Möchten Sie diese Box wirklich löschen?'
    };
    if (!confirm(msgs[type])) return;

    try {
      setLoading(true);
      const urls = { mineral: `/api/minerals/${id}`, showcase: `/api/showcases/${id}`, shelf: `/api/shelves/${id}` };
      const response = await fetch(urls[type], { method: 'DELETE' });

      if (response.ok) {
        if (type === 'mineral') { mineralCache.current.delete(id); setShowMineralModal(false); setSelectedMineral(null); }
        else if (type === 'showcase') { showcaseCache.current.delete(id); setShowShowcaseModal(false); setSelectedShowcase(null); }
        else if (type === 'shelf') { if (selectedShowcase) showcaseCache.current.delete(selectedShowcase.id); handleCloseShelfModal(); }

        loadStats();
        if (type === 'showcase') loadShowcases();
        if (type === 'shelf' && selectedShowcase) await openShowcaseDetails(selectedShowcase.id);
        alert(`${type === 'mineral' ? 'Mineral' : type === 'showcase' ? 'Regal' : 'Box'} erfolgreich gelöscht!`);
      } else {
        alert('Fehler beim Löschen: ' + await response.text());
      }
    } catch (error) {
      alert('Fehler beim Löschen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setShowMineralModal, setSelectedMineral, setShowShowcaseModal, setSelectedShowcase,
      handleCloseShelfModal, loadStats, loadShowcases, openShowcaseDetails, selectedShowcase]);

  const showcasesList = useMemo(() => showcases.map(showcase => (
    <RegalCard key={showcase.id} showcase={showcase} onClick={openShowcaseDetails} onBoxClick={openShelfDetails} />
  )), [showcases, openShowcaseDetails, openShelfDetails]);

  useEffect(() => { loadShowcases(); }, []);

  return (
    <>
      <section className="page active">
        <div className="container">

          <div className="cp-header">
            <div>
              <h1 className="cp-title">Vitrinen &amp; Regale</h1>
              <p className="cp-subtitle">
                {showcases.length > 0 && !loading
                  ? `${showcases.length} Vitrinen`
                  : 'Sammlung organisiert in Vitrinen und Boxen'}
              </p>
            </div>
            {isAuthenticated && (
              <button className="btn btn-primary" onClick={() => setShowVitrineForm(true)}>
                Neues Regal
              </button>
            )}
          </div>

          <div className="regale-grid">
            {loading ? (
              <div className="cp-loading">Lade Regale …</div>
            ) : showcases.length === 0 ? (
              <div className="cp-empty">
                <p>Noch keine Regale vorhanden.</p>
                {isAuthenticated && <p>Füge das erste Regal hinzu, um die Sammlung zu organisieren.</p>}
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
            <div className="cp-overlay-loading">
              <div className="cp-loading">Lade Regal …</div>
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
