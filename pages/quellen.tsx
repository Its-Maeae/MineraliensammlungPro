import Head from 'next/head';
import LegalPages from '../components/LegalPages';

export default function Quellen() {
  return (
    <>
      <Head><title>Quellen – Mineraliensammlung</title></Head>
      <LegalPages currentPage="quellen" />
    </>
  );
}