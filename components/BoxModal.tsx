import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mineral } from '../types';
import QRCodeGenerator from './QRCodeGenerator';
import AddMineralsToBoxModal from './AddMineralsToBoxModal';

interface BoxModalProps {
  shelf: any;
  minerals: Mineral[];
  loading: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onEdit: (shelf: any) => void;
  onDelete: (type: 'shelf', id: number) => void;
  onOpenMineralDetails: (id: number) => void;
  setShowShelfMineralsModal: (show: boolean) => void;
  onMineralCountChanged?: (shelfId: number, delta: number) => void;
}

export default function BoxModal({ 
  shelf, 
  minerals: initialMinerals, 
  loading: initialLoading, 
  isAuthenticated, 
  onClose, 
  onEdit, 
  onDelete, 
  onOpenMineralDetails,
  setShowShelfMineralsModal,
  onMineralCountChanged
}: BoxModalProps) {
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showAddMinerals, setShowAddMinerals] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  
  // Lazy Loading States
  const [minerals, setMinerals] = useState<Mineral[]>(initialMinerals);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loading, setLoading] = useState(initialLoading);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  const loadMinerals = useCallback(async (pageNum: number, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });
      
      const response = await fetch(`/api/shelves/${shelf.id}/minerals?${params}`);
      if (response.ok) {
        const responseData = await response.json();
        const newMinerals = responseData.minerals || [];
        
        if (append) {
          setMinerals(prev => [...prev, ...newMinerals]);
        } else {
          setMinerals(newMinerals);
        }
        
        setHasMore(newMinerals.length === ITEMS_PER_PAGE);
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
  }, [shelf.id]);

  // Intersection Observer für Infinite Scroll
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
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, loading, page, loadMinerals]);

  // Initial load
  useEffect(() => {
    if (initialMinerals.length === 0) {
      loadMinerals(1, false);
    } else {
      setMinerals(initialMinerals);
      setHasMore(initialMinerals.length >= ITEMS_PER_PAGE);
    }
  }, []);

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

  const handleMineralClick = (id: number) => {
    onOpenMineralDetails(id);
  };

  const handleMineralsAdded = useCallback(() => {
    setPage(1);
    setMinerals([]);
    loadMinerals(1, false);
    // Notify parent to refresh the mineral count on the showcase cards
    // We don't know the exact delta here, so reload the showcases entirely
    onMineralCountChanged?.(shelf.id, 0);
  }, [loadMinerals, onMineralCountChanged, shelf.id]);

  const handleRemoveMineral = useCallback(async (mineral: Mineral) => {
    if (removingId !== null) return;
    setRemovingId(mineral.id);
    try {
      const formData = new FormData();
      formData.append('name', mineral.name);
      formData.append('number', mineral.number);
      formData.append('color', mineral.color || '');
      formData.append('description', mineral.description || '');
      formData.append('location', mineral.location || '');
      formData.append('purchase_location', mineral.purchase_location || '');
      formData.append('rock_type', mineral.rock_type || '');
      formData.append('shelf_id', ''); // aus Box entfernen
      if (mineral.latitude != null) formData.append('latitude', mineral.latitude.toString());
      if (mineral.longitude != null) formData.append('longitude', mineral.longitude.toString());
      formData.append('is_undetermined', (mineral as any).is_undetermined ? 'true' : 'false');
      if ((mineral as any).suspected_name) formData.append('suspected_name', (mineral as any).suspected_name);

      const res = await fetch(`/api/minerals/${mineral.id}`, { method: 'PUT', body: formData });
      if (res.ok) {
        setMinerals(prev => prev.filter(m => m.id !== mineral.id));
        onMineralCountChanged?.(shelf.id, -1);
      }
    } catch (error) {
      console.error('Fehler beim Entfernen des Minerals:', error);
    } finally {
      setRemovingId(null);
    }
  }, [removingId]);

  const totalMinerals = minerals.length;

  return (
    <>
      <div className="modal-minimal" ref={modalOverlayRef}>
        <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-minimal" onClick={onClose}>×</button>
          
          <div className="modal-header-minimal">
            <h2 className="modal-title-minimal">
              Box {shelf.shelf_name}
              <span className="regal-code-badge">{shelf.full_code}</span>
            </h2>
            <div className="modal-subtitle-minimal">{shelf.showcase_name}</div>
          </div>
          
          <div className="modal-body-minimal">
            {shelf.image_path && (
              <div className="detail-image-minimal">
                <img src={`/uploads/${shelf.image_path}`} alt={shelf.shelf_name} />
              </div>
            )}

            <div className="stats-minimal">
              <div className="stat-minimal">
                <span className="stat-value-minimal">{totalMinerals}</span>
                <span className="stat-label-minimal">Mineralien geladen</span>
              </div>
            </div>

            {shelf.description && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div className="detail-label-minimal">Beschreibung</div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', marginTop: 'var(--space-2)', lineHeight: 1.5 }}>
                  {shelf.description}
                </p>
              </div>
            )}

            {isAuthenticated && showQRGenerator && (
              <>
                <div className="section-divider"></div>
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <div className="detail-label-minimal">QR-Code für direkten Zugriff</div>
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <QRCodeGenerator 
                      shelfId={shelf.id}
                      shelfName={shelf.shelf_name}
                      fullCode={shelf.full_code}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="section-divider"></div>
            
            <div className="detail-label-minimal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                Mineralien in dieser Box
                {totalMinerals > 0 && ` (${totalMinerals}${hasMore ? '+' : ''})`}
              </span>
              {isAuthenticated && totalMinerals > 0 && (
                <button
                  className={`remove-mode-toggle ${removeMode ? 'active' : ''}`}
                  onClick={() => setRemoveMode(m => !m)}
                  type="button"
                >
                  {removeMode ? '✓ Fertig' : '− Entfernen'}
                </button>
              )}
            </div>
            
            {loading && minerals.length === 0 ? (
              <div className="loading">Lade Mineralien...</div>
            ) : minerals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>
                Diese Box ist noch leer
              </div>
            ) : (
              <>
                {removeMode && (
                  <div className="remove-mode-hint">
                    Klicke auf × um ein Mineral aus der Box zu entfernen. Das Mineral bleibt in der Sammlung.
                  </div>
                )}
                <div className="mineralien-simple-grid">
                  {minerals.map(mineral => (
                    <div
                      key={mineral.id}
                      className={`mineral-card-simple ${removeMode ? 'remove-mode' : ''} ${removingId === mineral.id ? 'removing' : ''}`}
                      onClick={() => !removeMode && handleMineralClick(mineral.id)}
                    >
                      {removeMode && (
                        <button
                          className="mineral-remove-btn"
                          onClick={(e) => { e.stopPropagation(); handleRemoveMineral(mineral); }}
                          disabled={removingId !== null}
                          type="button"
                          title="Aus Box entfernen"
                        >
                          {removingId === mineral.id ? '⟳' : '×'}
                        </button>
                      )}
                      <div className="mineral-image-simple">
                        {mineral.image_path ? (
                          <img
                            src={`/uploads/${mineral.image_path}`}
                            alt={mineral.name}
                            loading="lazy"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'var(--gray-300)' }}></div>
                        )}
                      </div>
                      <div className="mineral-info-simple">
                        <div className="mineral-name-simple">{mineral.name}</div>
                        <div className="mineral-number-simple">Nr. {mineral.number}</div>
                        {mineral.color && (
                          <div className="mineral-number-simple">{mineral.color}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div ref={observerTarget} style={{ height: '20px', margin: 'var(--space-4) 0' }}>
                    {isLoadingMore && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: 'var(--space-3)', 
                        color: 'var(--gray-500)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        Lade weitere Mineralien...
                      </div>
                    )}
                  </div>
                )}

                {!hasMore && minerals.length > 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-3)', 
                    color: 'var(--gray-500)',
                    fontSize: 'var(--font-size-sm)',
                    marginTop: 'var(--space-2)'
                  }}>
                    Alle Mineralien geladen
                  </div>
                )}
              </>
            )}
          </div>

          {isAuthenticated && (
            <div className="admin-buttons-minimal">
              <button 
                className="btn-minimal primary"
                onClick={() => setShowAddMinerals(true)}
                type="button"
              >
                + Mineralien hinzufügen
              </button>
              <button 
                className="btn-minimal primary" 
                onClick={() => setShowQRGenerator(!showQRGenerator)}>
                {showQRGenerator ? 'QR-Code ausblenden' : 'QR-Code generieren'}
              </button>
              <button 
                className="btn-minimal"
                onClick={() => onEdit(shelf)}>
                Bearbeiten
              </button>
              <button 
                className="btn-minimal danger" 
                onClick={() => onDelete('shelf', shelf.id)}>
                Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddMinerals && (
        <AddMineralsToBoxModal
          shelf={shelf}
          onClose={() => setShowAddMinerals(false)}
          onMineralsAdded={handleMineralsAdded}
        />
      )}
    </>
  );
}