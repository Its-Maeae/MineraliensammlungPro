import Head from 'next/head';
import LegalPages from '../components/LegalPages';

export default function Impressum() {
  return (
    <>
      <Head><title>Impressum – Mineraliensammlung</title></Head>
      <LegalPages currentPage="impressum" />
    </>
  );
}