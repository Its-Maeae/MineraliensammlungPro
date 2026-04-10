import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mineral, ShelfSection } from '../types';
import QRCodeGenerator from './QRCodeGenerator';
import AddMineralsToBoxModal from './AddMineralsToBoxModal';
import BoxSectionManager from './BoxSectionManager';

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

/** View = which context we show minerals for */
type MineralView =
  | { type: 'box' }                   // direkt in der Box (keine Sektion)
  | { type: 'section'; section: ShelfSection };

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
  onMineralCountChanged,
}: BoxModalProps) {
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showAddMinerals, setShowAddMinerals] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);

  // Sections state
  const [hasSections, setHasSections] = useState<boolean | null>(null); // null = unknown
  const [sectionsRefreshKey, setSectionsRefreshKey] = useState(0);
  const [currentView, setCurrentView] = useState<MineralView>({ type: 'box' });

  // Mineral lazy loading
  const [minerals, setMinerals] = useState<Mineral[]>(initialMinerals);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loading, setLoading] = useState(initialLoading);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  // ── Mineral loading ────────────────────────────────────────────────────────
  const loadMinerals = useCallback(async (pageNum: number, append: boolean = false, sectionId?: number) => {
    if (append) setIsLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ page: pageNum.toString(), limit: ITEMS_PER_PAGE.toString() });
      // If section view: load minerals by section, otherwise by shelf
      let url: string;
      if (sectionId != null) {
        url = `/api/sections/${sectionId}/minerals?${params}`;
      } else {
        url = `/api/shelves/${shelf.id}/minerals?${params}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const responseData = await response.json();
        const newMinerals: Mineral[] = responseData.minerals || [];
        if (append) setMinerals(prev => [...prev, ...newMinerals]);
        else setMinerals(newMinerals);
        setHasMore(newMinerals.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mineralien:', error);
    } finally {
      if (append) setIsLoadingMore(false);
      else setLoading(false);
    }
  }, [shelf.id]);

  // ── Check whether the shelf has sections on mount ─────────────────────────
  useEffect(() => {
    fetch(`/api/sections?shelf_id=${shelf.id}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: ShelfSection[]) => setHasSections(data.length > 0))
      .catch(() => setHasSections(false));
  }, [shelf.id, sectionsRefreshKey]);

  // ── Infinite scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          const secId = currentView.type === 'section' ? currentView.section.id : undefined;
          loadMinerals(nextPage, true, secId);
        }
      },
      { threshold: 0.1 }
    );
    const t = observerTarget.current;
    if (t) observer.observe(t);
    return () => { if (t) observer.unobserve(t); };
  }, [hasMore, isLoadingMore, loading, page, loadMinerals, currentView]);

  // Initial load
  useEffect(() => {
    if (initialMinerals.length === 0) {
      const secId = currentView.type === 'section' ? currentView.section.id : undefined;
      loadMinerals(1, false, secId);
    } else {
      setMinerals(initialMinerals);
      setHasMore(initialMinerals.length >= ITEMS_PER_PAGE);
    }
  }, []);

  // ── Switch view (box / section) ────────────────────────────────────────────
  const switchView = useCallback((view: MineralView) => {
    setCurrentView(view);
    setPage(1);
    setMinerals([]);
    const secId = view.type === 'section' ? view.section.id : undefined;
    loadMinerals(1, false, secId);
    setRemoveMode(false);
  }, [loadMinerals]);

  // ── Close on backdrop click ───────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (modalOverlayRef.current && target === modalOverlayRef.current) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 100);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handleClickOutside); };
  }, [onClose]);

  const handleMineralsAdded = useCallback(() => {
    setPage(1);
    setMinerals([]);
    const secId = currentView.type === 'section' ? currentView.section.id : undefined;
    loadMinerals(1, false, secId);
    onMineralCountChanged?.(shelf.id, 0);
  }, [loadMinerals, onMineralCountChanged, shelf.id, currentView]);

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
      // Remove from section if in section view, otherwise from shelf
      if (currentView.type === 'section') {
        formData.append('section_id', '');
        formData.append('shelf_id', mineral.shelf_id?.toString() || '');
      } else {
        formData.append('shelf_id', '');
        formData.append('section_id', '');
      }
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
  }, [removingId, currentView, shelf.id, onMineralCountChanged]);

  const onSectionsChanged = useCallback(() => {
    setSectionsRefreshKey(k => k + 1);
    onMineralCountChanged?.(shelf.id, 0);
  }, [shelf.id, onMineralCountChanged]);

  const totalMinerals = minerals.length;

  // ── Determine add-minerals target ─────────────────────────────────────────
  // If box has sections, only allow adding TO a section (not the box itself).
  // Minerals can only be added directly to box if there are no sections.
  const addMineralsTarget = currentView.type === 'section'
    ? { ...shelf, _sectionId: currentView.section.id, _sectionCode: currentView.section.full_code }
    : shelf;

  const canAddDirectly = hasSections === false || currentView.type === 'section';

  const viewLabel = currentView.type === 'section'
    ? `Sektion ${currentView.section.full_code}`
    : `Box ${shelf.full_code}`;

  return (
    <>
      <div className="modal-minimal" ref={modalOverlayRef}>
        <div className="modal-content-minimal" onClick={e => e.stopPropagation()}>
          <button className="modal-close-minimal" onClick={onClose}>×</button>

          {/* Header */}
          <div className="modal-header-minimal">
            <h2 className="modal-title-minimal">
              Box {shelf.shelf_name || shelf.name}
              <span className="regal-code-badge">{shelf.full_code}</span>
            </h2>
            <div className="modal-subtitle-minimal">{shelf.showcase_name}</div>

            {/* Breadcrumb / view switcher */}
            {currentView.type === 'section' && (
              <div className="section-breadcrumb">
                <button
                  className="section-breadcrumb-back"
                  onClick={() => switchView({ type: 'box' })}
                  type="button"
                >
                  ← Zurück zur Box
                </button>
                <span className="section-breadcrumb-current">
                  Sektion: {currentView.section.name}
                  <span className="regal-code-badge" style={{ marginLeft: 8 }}>
                    {currentView.section.full_code}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="modal-body-minimal">
            {shelf.image_path && currentView.type === 'box' && (
              <div className="detail-image-minimal">
                <img src={`/uploads/${shelf.image_path}`} alt={shelf.shelf_name} />
              </div>
            )}

            {shelf.description && currentView.type === 'box' && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div className="detail-label-minimal">Beschreibung</div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', marginTop: 'var(--space-2)', lineHeight: 1.5 }}>
                  {shelf.description}
                </p>
              </div>
            )}

            {isAuthenticated && showQRGenerator && (
              <>
                <div className="section-divider" />
                <div className="detail-label-minimal">QR-Code</div>
                <QRCodeGenerator shelfId={shelf.id} shelfName={shelf.shelf_name} fullCode={shelf.full_code} />
              </>
            )}

            {/* ── Section Manager (nur auf Box-Ebene) ── */}
            {currentView.type === 'box' && (
              <>
                <div className="section-divider" />
                <BoxSectionManager
                  shelf={shelf}
                  isAuthenticated={isAuthenticated}
                  onSectionsChanged={onSectionsChanged}
                  onSectionClick={section => switchView({ type: 'section', section })}
                />
              </>
            )}

            <div className="section-divider" />

            {/* ── Minerals header ── */}
            <div className="detail-label-minimal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                Mineralien {currentView.type === 'section' ? `in ${currentView.section.name}` : 'direkt in Box'}
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

            {/* ── Warning when box has sections but we're on box level ── */}
            {currentView.type === 'box' && hasSections && (
              <div className="remove-mode-hint" style={{ marginTop: 'var(--space-2)' }}>
                Diese Box hat Sektionen. Wähle eine Sektion oben, um deren Mineralien zu sehen.
                Unten werden nur Mineralien angezeigt, die keiner Sektion zugeordnet sind.
              </div>
            )}

            {/* ── Minerals grid ── */}
            {loading && minerals.length === 0 ? (
              <div className="loading">Lade Mineralien...</div>
            ) : minerals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>
                {currentView.type === 'section'
                  ? 'Diese Sektion ist noch leer'
                  : hasSections
                    ? 'Keine Mineralien direkt in der Box (alle in Sektionen)'
                    : 'Diese Box ist noch leer'}
              </div>
            ) : (
              <>
                <div className="mineralien-simple-grid">
                  {minerals.map(mineral => (
                    <div
                      key={mineral.id}
                      className={`mineral-card-simple ${removeMode ? 'remove-mode' : ''} ${removingId === mineral.id ? 'removing' : ''}`}
                      onClick={() => !removeMode && onOpenMineralDetails(mineral.id)}
                    >
                      {removeMode && (
                        <button
                          className="mineral-remove-btn"
                          onClick={e => { e.stopPropagation(); handleRemoveMineral(mineral); }}
                          disabled={removingId !== null}
                          type="button"
                          title="Aus Sektion/Box entfernen"
                        >
                          {removingId === mineral.id ? '⟳' : '×'}
                        </button>
                      )}
                      <div className="mineral-image-simple">
                        {mineral.image_path
                          ? <img src={`/uploads/${mineral.image_path}`} alt={mineral.name} loading="lazy" />
                          : <div style={{ width: '100%', height: '100%', background: 'var(--gray-300)' }} />}
                      </div>
                      <div className="mineral-info-simple">
                        <div className="mineral-name-simple">{mineral.name}</div>
                        <div className="mineral-number-simple">Nr. {mineral.number}</div>
                        {mineral.color && <div className="mineral-number-simple">{mineral.color}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div ref={observerTarget} style={{ height: 20, margin: 'var(--space-4) 0' }}>
                    {isLoadingMore && (
                      <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>
                        Lade weitere Mineralien...
                      </div>
                    )}
                  </div>
                )}

                {!hasMore && minerals.length > 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>
                    Alle Mineralien geladen
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Admin buttons ── */}
          {isAuthenticated && (
            <div className="admin-buttons-minimal">
              {canAddDirectly && (
                <button className="btn-minimal primary" onClick={() => setShowAddMinerals(true)} type="button">
                  + Mineralien hinzufügen
                </button>
              )}
              {hasSections && currentView.type === 'box' && (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)', padding: 'var(--space-2) 0', flex: 1, textAlign: 'center' }}>
                  Sektion wählen, um Mineralien hinzuzufügen
                </div>
              )}
              <button className="btn-minimal primary" onClick={() => setShowQRGenerator(v => !v)}>
                {showQRGenerator ? 'QR ausblenden' : 'QR-Code'}
              </button>
              <button className="btn-minimal" onClick={() => onEdit(shelf)}>Bearbeiten</button>
              <button className="btn-minimal danger" onClick={() => onDelete('shelf', shelf.id)}>Löschen</button>
            </div>
          )}
        </div>
      </div>

      {showAddMinerals && (
        <AddMineralsToBoxModal
          shelf={addMineralsTarget}
          onClose={() => setShowAddMinerals(false)}
          onMineralsAdded={handleMineralsAdded}
        />
      )}
    </>
  );
}