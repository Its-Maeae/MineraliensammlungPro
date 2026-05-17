import Head from 'next/head';
import { useApp } from '../context/AppContext';
import HomePage from '../components/HomePage';

export default function Home() {
  const { showPage, stats, lastUpdated, setLastUpdated } = useApp();

  return (
    <>
      <Head>
        <title>Mineraliensammlung - Samuel von Pufendorf Gymnasium</title>
        <meta name="description" content="Entdecken Sie die Sammlung seltener Mineralien und Gesteine" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="../public/picture/icon.png" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js" />
      </Head>
      <HomePage
        showPage={showPage}
        stats={stats}
        lastUpdated={lastUpdated}
        setLastUpdated={setLastUpdated}
      />
    </>
  );
}