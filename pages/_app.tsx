import '../styles.css/globals.css';
import '../styles.css/home_page.css';
import '../styles.css/vitrines.css';
import '../styles.css/collection.css';
import '../styles.css/admin_page.css';
import '../styles.css/map.css';
import '../styles.css/qr_code.css';
import '../styles.css/statistics.css';
import '../styles.css/SecurityDashboard.css';
import '../styles.css/undetermined.css';
import '../styles.css/add_minerals.css';
import '../styles.css/sections.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { AppProvider, useApp } from '../context/AppContext';
import Header from '../components/Header';
import MobileNav from '../components/MobileNav';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import PasswordModal from '../components/PasswordModal';
import EditModal from '../components/EditModal';

// Shared chrome (Header, Modals) rendered on every page
function AppChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const currentPage = router.pathname === '/' ? 'home' : router.pathname.replace('/', '');

  const {
    isAuthenticated, setIsAuthenticated,
    showPasswordModal, setShowPasswordModal,
    password, setPassword,
    mobileMenuOpen, setMobileMenuOpen,
    editMode, setEditMode,
    editFormData, setEditFormData,
    editImage, setEditImage,
    shelves, loading, setLoading,
    setSelectedMineral, setShowMineralModal,
    setSelectedShowcase, setShowShelfMineralsModal, setSelectedShelf,
    setMinerals, setShowcases,
    showMineralModal, showShelfMineralsModal, showShowcaseModal,
    showVitrineForm, showShelfForm,
    loadStats, loadMinerals,
    clearCaches, reloadTrigger, setReloadTrigger,
    showPage,
  } = useApp();

  const handleOpenSearch = () => {
    if (currentPage === 'collection') {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      if (searchInput) { searchInput.focus(); searchInput.select(); }
    } else {
      showPage('collection');
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) { searchInput.focus(); searchInput.select(); }
      }, 200);
    }
  };

  const handleOpenFilters = () => {
    if (currentPage !== 'collection') showPage('collection');
    setTimeout(() => {
      const firstFilter = document.querySelector('.filter-select') as HTMLSelectElement;
      if (firstFilter) firstFilter.focus();
    }, 100);
  };

  const handleClearFilters = () => {
    // CollectionPage handles this internally via its own clearFilters
  };

  const handleEscape = () => {
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
      setSelectedShowcase(null);
    } else if (showVitrineForm || showShelfForm) {
      // handled in VitrinesPage
    } else if (showPasswordModal) {
      setShowPasswordModal(false);
    } else if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <Header
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <MobileNav
        mobileMenuOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <KeyboardShortcuts
        showPage={showPage}
        currentPage={currentPage}
        isAuthenticated={isAuthenticated}
        onOpenSearch={handleOpenSearch}
        onOpenFilters={handleOpenFilters}
        onClearFilters={handleClearFilters}
        onEscape={handleEscape}
      />

      <main>{children}</main>

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
          onClose={() => { setEditMode(null); setEditImage(null); }}
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
          loadMinerals={currentPage === 'collection'
            ? async () => setReloadTrigger((prev: number) => prev + 1)
            : loadMinerals}
          clearCaches={clearCaches}
        />
      )}
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <AppChrome>
        <Component {...pageProps} />
      </AppChrome>
    </AppProvider>
  );
}