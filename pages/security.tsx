import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import SecurityDashboard from '../components/SecurityDashboard';

export default function Security() {
  const router = useRouter();
  const { isAuthenticated, showPage, setShowPasswordModal } = useApp();

  useEffect(() => {
    if (!isAuthenticated) {
      setShowPasswordModal(true);
      sessionStorage.setItem('pendingPage', 'security');
      router.replace('/');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <>
      <Head><title>Sicherheit – Mineraliensammlung</title></Head>
      <SecurityDashboard showPage={showPage} />
    </>
  );
}