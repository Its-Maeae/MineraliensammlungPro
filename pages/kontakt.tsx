import Head from 'next/head';
import LegalPages from '../components/LegalPages';

export default function Kontakt() {
  return (
    <>
      <Head><title>Kontakt – Mineraliensammlung</title></Head>
      <LegalPages currentPage="kontakt" />
    </>
  );
}