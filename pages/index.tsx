import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Mineral, Showcase, Stats } from '../types';
import Header from '../components/Header';
import MobileNav from '../components/MobileNav';
import HomePage from '../components/HomePage';
import CollectionPage from '../components/CollectionPage';
import VitrinesPage from '../components/VitrinesPage';
import AdminPage from '../components/AdminPage';
import LegalPages from '../components/LegalPages';
import PasswordModal from '../components/PasswordModal';
import EditModal from '../components/EditModal';
import MapPage from '../components/MapPage';
import SecurityDashboard from '../components/SecurityDashboard';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import StatisticsPage from '../components/StatisticsPage';

interface FilterOptions {
  colors: string[];
  locations: string[];
  rock_types: string[];
}

export default function Home() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('home');
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_minerals: 0,
    total_locations: 0,
    total_colors: 0,
    total_shelves: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [rockTypeFilter, setRockTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    colors: [],
    locations: [],
    rock_types: []
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedMineral, setSelectedMineral] = useState<Mineral | null>(null);
  const [selectedShowcase, setSelectedShowcase] = useState<Showcase | null>(null);
  const [showVitrineForm, setShowVitrineForm] = useState(false);
  const [showMineralModal, setShowMineralModal] = useState(false);
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShelfForm, setShowShelfForm] = useState(false);
  const [showShelfMineralsModal, setShowShelfMineralsModal] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<any>(null);
  const [shelfMinerals, setShelfMinerals] = useState<Mineral[]>([]);
  const [editMode, setEditMode] = useState<'mineral' | 'showcase' | 'shelf' | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editImage, setEditImage] = useState<File | null>(null);
  const [shelves, setShelves] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Cache Refs für verschiedene Seiten
  const mineralCache = useRef<Map<number, Mineral>>(new Map());
  const showcaseCache = useRef<Map<number, Showcase>>(new Map());
  const shelfCache = useRef<Map<number, { shelfInfo: any; minerals: Mineral[] }>>(new Map());

  // Clear Cache Funktion
  const clearCaches = useCallback((type: 'showcase' | 'shelf' | 'mineral', id: number) => {
    console.log('Clearing cache for', type, id);
    
    if (type === 'showcase') {
      showcaseCache.current.delete(id);
      // Alle Shelf-Caches löschen, da wir nicht wissen welche zu dieser Showcase gehören
      shelfCache.current.clear();
    } else if (type === 'shelf') {
      shelfCache.current.delete(id);
    } else if (type === 'mineral') {
      mineralCache.current.delete(id);
    }
  }, []);

  // QR-Code Handling
  useEffect(() => {
    if (router.isReady) {
      const { shelf } = router.query;
      if (shelf) {
        handleQRCodeScan(parseInt(shelf as string));
      }
    }
  }, [router.isReady, router.query]);

  const handleQRCodeScan = async (shelfId: number) => {
    try {
      console.log('QR-Code gescannt für Regal ID:', shelfId);
      
      // Zuerst zur Vitrinen-Seite wechseln
      setCurrentPage('vitrines');
      
      // Showcases laden falls noch nicht geladen
      if (showcases.length === 0) {
        await loadShowcases();
      }
      
      // Regal-Details laden und anzeigen
      setLoading(true);
      const response = await fetch(`/api/shelves/${shelfId}/minerals`);
      const responseData = await response.json();
      
      if (response.ok) {
        setSelectedShelf(responseData.shelfInfo);
        setShelfMinerals(responseData.minerals);
        setShowShelfMineralsModal(true);
        
        // URL-Parameter entfernen
        router.replace('/', undefined, { shallow: true });
      } else {
        console.error('Fehler beim Laden des Regals:', responseData);
        alert('Regal nicht gefunden oder Fehler beim Laden');
        router.replace('/', undefined, { shallow: true });
      }
    } catch (error) {
      console.error('Fehler beim QR-Code-Handling:', error);
      alert('Fehler beim Öffnen des Regals');
      router.replace('/', undefined, { shallow: true });
    } finally {
      setLoading(false);
    }
  };

  // Define functions before useEffect hooks
  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
    }
  };

  const loadMinerals = async () => {
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
  };

  const loadShowcases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/showcases');
      if (response.ok) {
        const data = await response.json();
        setShowcases(data);
        return data;
      }
    } catch (error) {
      console.error('Fehler beim Laden der Vitrinen:', error);
    } finally {
      setLoading(false);
    }
    return [];
  };

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

  const loadShelves = async () => {
    try {
      const response = await fetch('/api/shelves');
      if (response.ok) {
        const data = await response.json();
        setShelves(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Regale:', error);
    }
  };

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/check');
      setIsAuthenticated(response.ok);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setColorFilter('');
    setLocationFilter('');
    setRockTypeFilter('');
  };

  // Calculate hasActiveFilters as boolean
  const hasActiveFilters = Boolean(searchTerm || colorFilter || locationFilter || rockTypeFilter);

  // useEffect hooks
  useEffect(() => {
    loadStats();
    loadShelves();
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (currentPage === 'collection') {
      loadMinerals();
      loadFilterOptions();
    } else if (currentPage === 'vitrines') {
      loadShowcases();
    }
  }, [currentPage]);

  useEffect(() => {
    if (currentPage === 'collection') {
      loadMinerals();
    }
  }, [searchTerm, colorFilter, locationFilter, rockTypeFilter, sortBy]);

  useEffect(() => {
    if (isAuthenticated) {
      const pendingPage = sessionStorage.getItem('pendingPage');
      if (pendingPage) {
        setCurrentPage(pendingPage);
        sessionStorage.removeItem('pendingPage');
      }
    }
  }, [isAuthenticated]);

  const showPage = (page: string) => {
    if (page === 'admin' || page === 'security') {
      if (!isAuthenticated) {
        setShowPasswordModal(true);
        sessionStorage.setItem('pendingPage', page);
        return;
      }
    }
    setCurrentPage(page);
    setMobileMenuOpen(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard Shortcut Handlers
  const handleOpenSearch = () => {
    if (currentPage === 'collection') {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    } else {
      showPage('collection');
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 200);
    }
  };

  const handleOpenFilters = () => {
    if (currentPage !== 'collection') {
      showPage('collection');
    }
    setTimeout(() => {
      const firstFilter = document.querySelector('.filter-select') as HTMLSelectElement;
      if (firstFilter) firstFilter.focus();
    }, 100);
  };

  const handleClearFilters = () => {
    if (currentPage === 'collection') {
      clearFilters();
    }
  };

  const handleEscape = () => {
    // Priorisierte Reihenfolge: Wichtigste Modals zuerst
    if (editMode) {
      setEditMode(null);
      setEditImage(null);
    } else if (showMineralModal) {
      setShowMineralModal(false);
      setSelectedMineral(null);
    } else if (showShelfMineralsModal) {
      setShowShelfMineralsModal(false);
      setSelectedShelf(null);
    } else if (showShowcaseModal) {
      setShowShowcaseModal(false);
      setSelectedShowcase(null);
    } else if (showVitrineForm) {
      setShowVitrineForm(false);
    } else if (showShelfForm) {
      setShowShelfForm(false);
    } else if (showPasswordModal) {
      setShowPasswordModal(false);
    } else if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mineraliensammlung - Samuel von Pufendorf Gymnasium</title>
        <meta name="description" content="Entdecken Sie die Sammlung seltener Mineralien und Gesteine" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="../public/picture/icon.png" />
        {/* QR-Code Library */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js"></script>
      </Head>

      <Header 
        currentPage={currentPage}
        showPage={showPage}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <MobileNav 
        mobileMenuOpen={mobileMenuOpen}
        showPage={showPage}
      />

      {/* Keyboard Shortcuts - IMMER aktiv */}
      <KeyboardShortcuts
        showPage={showPage}
        currentPage={currentPage}
        isAuthenticated={isAuthenticated}
        onOpenSearch={handleOpenSearch}
        onOpenFilters={handleOpenFilters}
        onClearFilters={handleClearFilters}
        onEscape={handleEscape}
      />

      <main>
        {currentPage === 'home' && (
          <HomePage 
            showPage={showPage}
            stats={stats}
            lastUpdated={lastUpdated}
            setLastUpdated={setLastUpdated}
          />
        )}

        {currentPage === 'collection' && (
          <CollectionPage 
            minerals={minerals}
            setMinerals={setMinerals}
            loading={loading}
            setLoading={setLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            colorFilter={colorFilter}
            setColorFilter={setColorFilter}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            rockTypeFilter={rockTypeFilter}
            setRockTypeFilter={setRockTypeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filterOptions={filterOptions}
            setFilterOptions={setFilterOptions}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            selectedMineral={selectedMineral}
            setSelectedMineral={setSelectedMineral}
            showMineralModal={showMineralModal}
            setShowMineralModal={setShowMineralModal}
            isAuthenticated={isAuthenticated}
            editMode={editMode}
            setEditMode={setEditMode}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            editImage={editImage}
            setEditImage={setEditImage}
            shelves={shelves}
            loadStats={loadStats}
            showPage={showPage}
            clearCaches={clearCaches}
            reloadTrigger={reloadTrigger}
          />
        )}

        {currentPage === 'vitrines' && (
          <VitrinesPage 
            showcases={showcases}
            setShowcases={setShowcases}
            loading={loading}
            setLoading={setLoading}
            isAuthenticated={isAuthenticated}
            selectedShowcase={selectedShowcase}
            setSelectedShowcase={setSelectedShowcase}
            showShowcaseModal={showShowcaseModal}
            setShowShowcaseModal={setShowShowcaseModal}
            showVitrineForm={showVitrineForm}
            setShowVitrineForm={setShowVitrineForm}
            showShelfForm={showShelfForm}
            setShowShelfForm={setShowShelfForm}
            selectedShelf={selectedShelf}
            setSelectedShelf={setSelectedShelf}
            shelfMinerals={shelfMinerals}
            setShelfMinerals={setShelfMinerals}
            showShelfMineralsModal={showShelfMineralsModal}
            setShowShelfMineralsModal={setShowShelfMineralsModal}
            editMode={editMode}
            setEditMode={setEditMode}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            editImage={editImage}
            setEditImage={setEditImage}
            selectedMineral={selectedMineral}
            setSelectedMineral={setSelectedMineral}
            showMineralModal={showMineralModal}
            setShowMineralModal={setShowMineralModal}
            shelves={shelves}
            loadStats={loadStats}
          />
        )}

        {currentPage === 'map' && (
          <MapPage 
            currentPage={currentPage}
            isAuthenticated={isAuthenticated}
            selectedMineral={selectedMineral}
            setSelectedMineral={setSelectedMineral}
            showMineralModal={showMineralModal}
            setShowMineralModal={setShowMineralModal}
            editMode={editMode}
            setEditMode={setEditMode}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            editImage={editImage}
            setEditImage={setEditImage}
            shelves={shelves}
            loadStats={loadStats}
            setMinerals={setMinerals}
          />
        )}

        {currentPage === 'statistics' && (
          <StatisticsPage 
            currentPage={currentPage} 
            showPage={showPage}
            isAuthenticated={isAuthenticated}
          />
        )}

        {currentPage === 'admin' && isAuthenticated && (
          <AdminPage 
            isAuthenticated={isAuthenticated}
            onSuccess={() => {
              loadStats();
            }}
            showPage={showPage}
          />
        )}

        {currentPage === 'security' && isAuthenticated && (
          <SecurityDashboard showPage={showPage} />
        )}

        {(currentPage === 'impressum' || currentPage === 'quellen' || currentPage === 'kontakt') && (
          <LegalPages currentPage={currentPage} />
        )}
      </main>

      {showPasswordModal && (
        <PasswordModal 
          password={password}
          setPassword={setPassword}
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
          onClose={() => setShowPasswordModal(false)}
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
            setEditImage(null);
          }}
          setEditMode={setEditMode}
          setSelectedMineral={setSelectedMineral}
          setShowMineralModal={setShowMineralModal}
          setSelectedShowcase={setSelectedShowcase}
          setShowShelfMineralsModal={setShowShelfMineralsModal}
          setSelectedShelf={setSelectedShelf}
          currentPage={currentPage}
          setMinerals={setMinerals}
          setShowcases={setShowcases}
          loadStats={loadStats}
          loadMinerals={currentPage === 'collection' ? async () => {
            setReloadTrigger(prev => prev + 1);
          } : loadMinerals}
          clearCaches={clearCaches}
        />
      )}
    </>
  );
}