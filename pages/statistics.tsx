import Head from 'next/head';
import { useApp } from '../context/AppContext';
import StatisticsPage from '../components/StatisticsPage';

export default function Statistics() {
  const { isAuthenticated, showPage } = useApp();

  return (
    <>
      <Head><title>Statistiken – Mineraliensammlung</title></Head>
      <StatisticsPage currentPage="statistics" showPage={showPage} isAuthenticated={isAuthenticated} />
    </>
  );
}