import Head from 'next/head';
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import VitrinesPage from '../components/VitrinesPage';

export default function Vitrines() {
  const {
    showcases, setShowcases,
    loading, setLoading,
    isAuthenticated,
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
    selectedMineral, setSelectedMineral,
    showMineralModal, setShowMineralModal,
    shelves,
    loadStats, loadShowcases,
  } = useApp();

  useEffect(() => {
    loadShowcases();
  }, []);

  return (
    <>
      <Head>
        <title>Vitrinen – Mineraliensammlung</title>
      </Head>
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
    </>
  );
}