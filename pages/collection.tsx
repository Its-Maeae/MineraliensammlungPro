import Head from 'next/head';
import { useApp } from '../context/AppContext';
import CollectionPage from '../components/CollectionPage';

export default function Collection() {
  const {
    minerals, setMinerals,
    loading, setLoading,
    searchTerm, setSearchTerm,
    colorFilter, setColorFilter,
    locationFilter, setLocationFilter,
    rockTypeFilter, setRockTypeFilter,
    sortBy, setSortBy,
    showUndetermined, setShowUndetermined,
    filterOptions, setFilterOptions,
    hasActiveFilters, clearFilters,
    selectedMineral, setSelectedMineral,
    showMineralModal, setShowMineralModal,
    isAuthenticated,
    editMode, setEditMode,
    editFormData, setEditFormData,
    editImage, setEditImage,
    shelves,
    loadStats, loadFilterOptions,
    showPage, clearCaches,
    reloadTrigger,
  } = useApp();

  return (
    <>
      <Head>
        <title>Sammlung – Mineraliensammlung</title>
      </Head>
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
        showUndetermined={showUndetermined}
        setShowUndetermined={setShowUndetermined}
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
    </>
  );
}