import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import MapPage from '../components/MapPage';

export default function Map() {
  const router = useRouter();
  const {
    isAuthenticated,
    selectedMineral, setSelectedMineral,
    showMineralModal, setShowMineralModal,
    editMode, setEditMode,
    editFormData, setEditFormData,
    editImage, setEditImage,
    shelves,
    loadStats, loadShowcases,
    setMinerals, setLoading,
    setSelectedShelf, setShelfMinerals, setShowShelfMineralsModal,
  } = useApp();

  // QR-Code scan: /map?shelf=42
  useEffect(() => {
    if (!router.isReady) return;
    const { shelf } = router.query;
    if (shelf) {
      handleQRCodeScan(parseInt(shelf as string));
    }
  }, [router.isReady, router.query]);

  const handleQRCodeScan = async (shelfId: number) => {
    try {
      await loadShowcases();
      setLoading(true);
      const response = await fetch(`/api/shelves/${shelfId}/minerals`);
      const data = await response.json();
      if (response.ok) {
        setSelectedShelf(data.shelfInfo);
        setShelfMinerals(data.minerals);
        setShowShelfMineralsModal(true);
        router.replace('/map', undefined, { shallow: true });
      } else {
        alert('Regal nicht gefunden oder Fehler beim Laden');
        router.replace('/map', undefined, { shallow: true });
      }
    } catch {
      alert('Fehler beim Öffnen des Regals');
      router.replace('/map', undefined, { shallow: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Karte – Mineraliensammlung</title>
      </Head>
      <MapPage
        currentPage="map"
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
    </>
  );
}