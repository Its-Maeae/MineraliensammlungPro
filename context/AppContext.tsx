import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { Mineral, Showcase, Stats } from '../types';

interface FilterOptions {
  colors: string[];
  locations: string[];
  rock_types: string[];
}

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  showPasswordModal: boolean;
  setShowPasswordModal: (v: boolean) => void;
  password: string;
  setPassword: (v: string) => void;

  // Data
  minerals: Mineral[];
  setMinerals: (v: Mineral[]) => void;
  showcases: Showcase[];
  setShowcases: (v: Showcase[]) => void;
  stats: Stats;
  shelves: any[];
  lastUpdated: string;
  setLastUpdated: (v: string) => void;
  filterOptions: FilterOptions;
  setFilterOptions: (v: FilterOptions) => void;

  // Filters
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  colorFilter: string;
  setColorFilter: (v: string) => void;
  locationFilter: string;
  setLocationFilter: (v: string) => void;
  rockTypeFilter: string;
  setRockTypeFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  showUndetermined: 'all' | 'only' | 'hide';
  setShowUndetermined: (v: 'all' | 'only' | 'hide') => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;

  // UI State
  loading: boolean;
  setLoading: (v: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  reloadTrigger: number;
  setReloadTrigger: (fn: (prev: number) => number) => void;

  // Mineral modal
  selectedMineral: Mineral | null;
  setSelectedMineral: (v: Mineral | null) => void;
  showMineralModal: boolean;
  setShowMineralModal: (v: boolean) => void;

  // Showcase modal
  selectedShowcase: Showcase | null;
  setSelectedShowcase: (v: Showcase | null) => void;
  showShowcaseModal: boolean;
  setShowShowcaseModal: (v: boolean) => void;

  // Vitrine forms
  showVitrineForm: boolean;
  setShowVitrineForm: (v: boolean) => void;
  showShelfForm: boolean;
  setShowShelfForm: (v: boolean) => void;

  // Shelf modal
  selectedShelf: any;
  setSelectedShelf: (v: any) => void;
  shelfMinerals: Mineral[];
  setShelfMinerals: (v: Mineral[]) => void;
  showShelfMineralsModal: boolean;
  setShowShelfMineralsModal: (v: boolean) => void;

  // Edit modal
  editMode: 'mineral' | 'showcase' | 'shelf' | null;
  setEditMode: (v: 'mineral' | 'showcase' | 'shelf' | null) => void;
  editFormData: any;
  setEditFormData: (v: any) => void;
  editImage: File | null;
  setEditImage: (v: File | null) => void;

  // Caches
  mineralCache: React.MutableRefObject<Map<number, Mineral>>;
  showcaseCache: React.MutableRefObject<Map<number, Showcase>>;
  shelfCache: React.MutableRefObject<Map<number, { shelfInfo: any; minerals: Mineral[] }>>;
  clearCaches: (type: 'showcase' | 'shelf' | 'mineral', id: number) => void;

  // API helpers
  loadStats: () => Promise<void>;
  loadMinerals: () => Promise<void>;
  loadShowcases: () => Promise<Showcase[]>;
  loadFilterOptions: () => Promise<void>;
  loadShelves: () => Promise<void>;

  // Navigation
  showPage: (page: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  // Data
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_minerals: 0,
    total_locations: 0,
    total_colors: 0,
    total_shelves: 0,
  });
  const [shelves, setShelves] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    colors: [],
    locations: [],
    rock_types: [],
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [rockTypeFilter, setRockTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showUndetermined, setShowUndetermined] = useState<'all' | 'only' | 'hide'>('all');

  // UI
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Modals
  const [selectedMineral, setSelectedMineral] = useState<Mineral | null>(null);
  const [showMineralModal, setShowMineralModal] = useState(false);
  const [selectedShowcase, setSelectedShowcase] = useState<Showcase | null>(null);
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [showVitrineForm, setShowVitrineForm] = useState(false);
  const [showShelfForm, setShowShelfForm] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<any>(null);
  const [shelfMinerals, setShelfMinerals] = useState<Mineral[]>([]);
  const [showShelfMineralsModal, setShowShelfMineralsModal] = useState(false);
  const [editMode, setEditMode] = useState<'mineral' | 'showcase' | 'shelf' | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editImage, setEditImage] = useState<File | null>(null);

  // Caches
  const mineralCache = useRef<Map<number, Mineral>>(new Map());
  const showcaseCache = useRef<Map<number, Showcase>>(new Map());
  const shelfCache = useRef<Map<number, { shelfInfo: any; minerals: Mineral[] }>>(new Map());

  const clearCaches = useCallback((type: 'showcase' | 'shelf' | 'mineral', id: number) => {
    if (type === 'showcase') {
      showcaseCache.current.delete(id);
      shelfCache.current.clear();
    } else if (type === 'shelf') {
      shelfCache.current.delete(id);
      showcaseCache.current.clear();
    } else if (type === 'mineral') {
      mineralCache.current.delete(id);
    }
  }, []);

  const hasActiveFilters = Boolean(
    searchTerm || colorFilter || locationFilter || rockTypeFilter || showUndetermined !== 'all'
  );

  const clearFilters = () => {
    setSearchTerm('');
    setColorFilter('');
    setLocationFilter('');
    setRockTypeFilter('');
    setShowUndetermined('all');
  };

  // API helpers
  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error('Fehler beim Laden der Statistiken:', e);
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
        sort: sortBy,
        undetermined: showUndetermined,
      });
      const res = await fetch(`/api/minerals?${params}`);
      if (res.ok) setMinerals(await res.json());
    } catch (e) {
      console.error('Fehler beim Laden der Mineralien:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadShowcases = async (): Promise<Showcase[]> => {
    setLoading(true);
    try {
      const res = await fetch('/api/showcases');
      if (res.ok) {
        const data = await res.json();
        setShowcases(data);
        return data;
      }
    } catch (e) {
      console.error('Fehler beim Laden der Vitrinen:', e);
    } finally {
      setLoading(false);
    }
    return [];
  };

  const loadFilterOptions = async () => {
    try {
      const res = await fetch('/api/filter-options');
      if (res.ok) setFilterOptions(await res.json());
    } catch (e) {
      console.error('Fehler beim Laden der Filteroptionen:', e);
    }
  };

  const loadShelves = async () => {
    try {
      const res = await fetch('/api/shelves');
      if (res.ok) setShelves(await res.json());
    } catch (e) {
      console.error('Fehler beim Laden der Regale:', e);
    }
  };

  const checkAuthentication = async () => {
    try {
      const res = await fetch('/api/auth/check');
      setIsAuthenticated(res.ok);
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const pendingPage = sessionStorage.getItem('pendingPage');
      if (pendingPage) {
        sessionStorage.removeItem('pendingPage');
        router.push(`/${pendingPage}`);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadStats();
    loadShelves();
    checkAuthentication();
  }, []);

  const showPage = (page: string) => {
    if (page === 'admin' || page === 'security') {
      if (!isAuthenticated) {
        setShowPasswordModal(true);
        sessionStorage.setItem('pendingPage', page);
        return;
      }
    }
    setMobileMenuOpen(false);
    const path = page === 'home' ? '/' : `/${page}`;
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, setIsAuthenticated,
      showPasswordModal, setShowPasswordModal,
      password, setPassword,
      minerals, setMinerals,
      showcases, setShowcases,
      stats, shelves,
      lastUpdated, setLastUpdated,
      filterOptions, setFilterOptions,
      searchTerm, setSearchTerm,
      colorFilter, setColorFilter,
      locationFilter, setLocationFilter,
      rockTypeFilter, setRockTypeFilter,
      sortBy, setSortBy,
      showUndetermined, setShowUndetermined,
      hasActiveFilters, clearFilters,
      loading, setLoading,
      mobileMenuOpen, setMobileMenuOpen,
      reloadTrigger, setReloadTrigger,
      selectedMineral, setSelectedMineral,
      showMineralModal, setShowMineralModal,
      selectedShowcase, setSelectedShowcase,
      showShowcaseModal, setShowShowcaseModal,
      showVitrineForm, setShowVitrineForm,
      showShelfForm, setShowShelfForm,
      selectedShelf, setSelectedShelf,
      shelfMinerals, setShelfMinerals,
      showShelfMineralsModal, setShowShelfMineralsModal,
      editMode, setEditMode,
      editFormData, setEditFormData,
      editImage, setEditImage,
      mineralCache, showcaseCache, shelfCache, clearCaches,
      loadStats, loadMinerals, loadShowcases, loadFilterOptions, loadShelves,
      showPage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}