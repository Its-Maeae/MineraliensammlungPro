import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import AdminPage from '../components/AdminPage';

export default function Admin() {
  const router = useRouter();
  const { isAuthenticated, loadStats, showPage, setShowPasswordModal } = useApp();

  // Guard: redirect non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      setShowPasswordModal(true);
      sessionStorage.setItem('pendingPage', 'admin');
      router.replace('/');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <>
      <Head><title>Admin – Mineraliensammlung</title></Head>
      <AdminPage
        isAuthenticated={isAuthenticated}
        onSuccess={() => loadStats()}
        showPage={showPage}
      />
    </>
  );
}