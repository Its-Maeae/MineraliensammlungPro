import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mineral, ShelfSection } from '../types';
import QRCodeGenerator from './QRCodeGenerator';
import AddMineralsToBoxModal from './AddMineralsToBoxModal';
import BoxSectionManager, { SectionFormModal, SectionFormData } from './BoxSectionManager';

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

/** Section modal state */
type SectionModal =
  | null
  | { section: ShelfSection };

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

  // Sections state
  const [openSectionModal, setOpenSectionModal] = useState<SectionModal>(null);

  // Mineral lazy loading
  const [minerals, setMinerals] = useState<Mineral[]>(initialMinerals);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loading, setLoading] = useState(initialLoading);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  // ── Mineral loading ────────────────────────────────────────────────────────
  const loadMinerals = useCallback(async (pageNum: number, append: boolean = false) => {
    if (append) setIsLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ page: pageNum.toString(), limit: ITEMS_PER_PAGE.toString() });
      const url = `/api/shelves/${shelf.id}/minerals?${params}`;

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
          loadMinerals(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );
    const t = observerTarget.current;
    if (t) observer.observe(t);
    return () => { if (t) observer.unobserve(t); };
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

  const handleMineralsAdded = useCallback(() => {
    setPage(1);
    setMinerals([]);
    loadMinerals(1, false);
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
      formData.append('shelf_id', '');
      formData.append('section_id', '');
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
  }, [removingId, shelf.id, onMineralCountChanged]);

  const onSectionsChanged = useCallback(() => {
    setSectionsRefreshKey(k => k + 1);
    onMineralCountChanged?.(shelf.id, 0);
  }, [shelf.id, onMineralCountChanged]);

  // ── Close on backdrop click ───────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (modalOverlayRef.current && target === modalOverlayRef.current) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 100);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handleClickOutside); };
  }, [onClose]);

  const totalMinerals = minerals.length;

  const addMineralsTarget = shelf;
  const canAddDirectly = hasSections === false;

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
          </div>

          <div className="modal-body-minimal">
            {shelf.image_path && (
              <div className="detail-image-minimal">
                <img src={`/uploads/${shelf.image_path}`} alt={shelf.shelf_name} />
              </div>
            )}

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
                <div className="section-divider" />
                <div className="detail-label-minimal">QR-Code</div>
                <QRCodeGenerator shelfId={shelf.id} shelfName={shelf.shelf_name} fullCode={shelf.full_code} />
              </>
            )}

            {/* ── Section Manager ── */}
            <>
              <div className="section-divider" />
              <BoxSectionManager
                shelf={shelf}
                isAuthenticated={isAuthenticated}
                onSectionsChanged={onSectionsChanged}
                onSectionClick={section => setOpenSectionModal({ section })}
              />
            </>

            {/* ── Minerals area: only show if no sections ── */}
            {hasSections === false && (
              <>
                <div className="section-divider" />

                <div className="detail-label-minimal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>
                    Mineralien
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
                              title="Entfernen"
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
                  </>
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

      {/* ── Section Modal (separate overlay) ── */}
      {openSectionModal && (
        <SectionDetailModal
          section={openSectionModal.section}
          shelf={shelf}
          isAuthenticated={isAuthenticated}
          onClose={() => {
            setOpenSectionModal(null);
            setSectionsRefreshKey(k => k + 1);
            onMineralCountChanged?.(shelf.id, 0);
          }}
          onOpenMineralDetails={onOpenMineralDetails}
          onMineralCountChanged={onMineralCountChanged}
        />
      )}
    </>
  );
}
// ── SectionDetailModal ─────────────────────────────────────────────────────
interface SectionDetailModalProps {
  section: ShelfSection;
  shelf: any;
  isAuthenticated: boolean;
  onClose: () => void;
  onOpenMineralDetails: (id: number) => void;
  onMineralCountChanged?: (shelfId: number, delta: number) => void;
}

function SectionDetailModal({
  section,
  shelf,
  isAuthenticated,
  onClose,
  onOpenMineralDetails,
  onMineralCountChanged,
}: SectionDetailModalProps) {
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [showAddMinerals, setShowAddMinerals] = useState(false);
  const [showSectionEdit, setShowSectionEdit] = useState(false);
  const [sectionEditData, setSectionEditData] = useState<SectionFormData>({
    name: section.name,
    code: section.code,
    description: section.description || '',
    position_order: section.position_order,
  });
  const [sectionEditSaving, setSectionEditSaving] = useState(false);
  const [sectionEditError, setSectionEditError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<ShelfSection>(section);
  const ITEMS_PER_PAGE = 12;
  const observerTarget = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const loadMinerals = useCallback(async (pageNum: number, append: boolean = false) => {
    if (append) setIsLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum.toString(), limit: ITEMS_PER_PAGE.toString() });
      const res = await fetch(`/api/sections/${currentSection.id}/minerals?${params}`);
      if (res.ok) {
        const data = await res.json();
        const newMinerals: Mineral[] = data.minerals || [];
        if (append) setMinerals(prev => [...prev, ...newMinerals]);
        else setMinerals(newMinerals);
        setHasMore(newMinerals.length === ITEMS_PER_PAGE);
      }
    } catch {}
    finally {
      if (append) setIsLoadingMore(false);
      else setLoading(false);
    }
  }, [currentSection.id]);

  useEffect(() => { loadMinerals(1); }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          const next = page + 1;
          setPage(next);
          loadMinerals(next, true);
        }
      },
      { threshold: 0.1 }
    );
    const t = observerTarget.current;
    if (t) observer.observe(t);
    return () => { if (t) observer.unobserve(t); };
  }, [hasMore, isLoadingMore, loading, page, loadMinerals]);

  // Close on backdrop click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handleClick), 100);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handleClick); };
  }, [onClose]);

  const handleRemoveMineral = useCallback(async (mineral: Mineral) => {
    if (removingId !== null) return;
    setRemovingId(mineral.id);
    try {
      const fd = new FormData();
      fd.append('name', mineral.name);
      fd.append('number', mineral.number);
      fd.append('color', mineral.color || '');
      fd.append('description', mineral.description || '');
      fd.append('location', mineral.location || '');
      fd.append('purchase_location', mineral.purchase_location || '');
      fd.append('rock_type', mineral.rock_type || '');
      fd.append('section_id', '');
      fd.append('shelf_id', mineral.shelf_id?.toString() || '');
      if (mineral.latitude != null) fd.append('latitude', mineral.latitude.toString());
      if (mineral.longitude != null) fd.append('longitude', mineral.longitude.toString());
      fd.append('is_undetermined', (mineral as any).is_undetermined ? 'true' : 'false');
      if ((mineral as any).suspected_name) fd.append('suspected_name', (mineral as any).suspected_name);
      const res = await fetch(`/api/minerals/${mineral.id}`, { method: 'PUT', body: fd });
      if (res.ok) {
        setMinerals(prev => prev.filter(m => m.id !== mineral.id));
        onMineralCountChanged?.(shelf.id, -1);
      }
    } catch {}
    finally { setRemovingId(null); }
  }, [removingId, shelf.id, onMineralCountChanged]);

  const handleSectionEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSectionEditSaving(true);
    setSectionEditError(null);
    try {
      const fd = new FormData();
      fd.append('name', sectionEditData.name);
      fd.append('code', sectionEditData.code);
      fd.append('description', sectionEditData.description);
      fd.append('position_order', sectionEditData.position_order.toString());
      const res = await fetch(`/api/sections/${currentSection.id}`, { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok) { setSectionEditError(data.error || 'Fehler'); return; }
      setCurrentSection(prev => ({ ...prev, ...sectionEditData }));
      setShowSectionEdit(false);
    } catch { setSectionEditError('Verbindungsfehler'); }
    finally { setSectionEditSaving(false); }
  }, [sectionEditData, currentSection.id]);

  const handleSectionDelete = useCallback(async () => {
    if (!confirm(`Sektion "${currentSection.name}" (${currentSection.full_code}) wirklich löschen?`)) return;
    try {
      const res = await fetch(`/api/sections/${currentSection.id}`, { method: 'DELETE' });
      if (res.ok) onClose();
    } catch {}
  }, [currentSection, onClose]);

  const addTarget = { ...shelf, _sectionId: currentSection.id, _sectionCode: currentSection.full_code };

  return (
    <>
      <div className="modal-minimal" ref={overlayRef} style={{ zIndex: 10001 }}>
        <div className="modal-content-minimal" onClick={e => e.stopPropagation()}>
          <button className="modal-close-minimal" onClick={onClose}>×</button>

          <div className="modal-header-minimal">
            <h2 className="modal-title-minimal">
              {currentSection.name}
              <span className="regal-code-badge">{currentSection.full_code}</span>
            </h2>
            <div className="modal-subtitle-minimal">{shelf.showcase_name} – {shelf.shelf_name || shelf.name}</div>
          </div>

          <div className="modal-body-minimal">
            <div className="section-divider" />

            <div className="detail-label-minimal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                Mineralien
                {minerals.length > 0 && ` (${minerals.length}${hasMore ? '+' : ''})`}
              </span>
              {isAuthenticated && minerals.length > 0 && (
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
                Diese Sektion ist noch leer
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
                          title="Entfernen"
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
              </>
            )}
          </div>

          {isAuthenticated && (
            <div className="admin-buttons-minimal">
              <button className="btn-minimal primary" onClick={() => setShowAddMinerals(true)} type="button">
                + Mineralien hinzufügen
              </button>
              <button className="btn-minimal" onClick={() => {
                setSectionEditData({ name: currentSection.name, code: currentSection.code, description: currentSection.description || '', position_order: currentSection.position_order });
                setSectionEditError(null);
                setShowSectionEdit(true);
              }}>
                Sektion bearbeiten
              </button>
              <button className="btn-minimal danger" onClick={handleSectionDelete}>Sektion löschen</button>
            </div>
          )}
        </div>
      </div>

      {showAddMinerals && (
        <AddMineralsToBoxModal
          shelf={addTarget}
          onClose={() => setShowAddMinerals(false)}
          onMineralsAdded={() => {
            setPage(1);
            setMinerals([]);
            loadMinerals(1);
            onMineralCountChanged?.(shelf.id, 0);
          }}
        />
      )}

      {showSectionEdit && (
        <SectionFormModal
          editingSection={currentSection}
          formData={sectionEditData}
          setFormData={setSectionEditData}
          saving={sectionEditSaving}
          error={sectionEditError}
          shelf={shelf}
          onSubmit={handleSectionEditSubmit}
          onClose={() => setShowSectionEdit(false)}
        />
      )}
    </>
  );
}