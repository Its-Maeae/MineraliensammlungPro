import '../styles.css/globals.css';
import '../styles.css/home_page.css';
import '../styles.css/vitrines.css';
import '../styles.css/collection.css';
import '../styles.css/admin_page.css';
import '../styles.css/map.css';
import '../styles.css/qr_code.css';
import '../styles.css/statistics.css';
import '../styles.css/SecurityDashboard.css';
import '../styles.css/undetermined.css';
import '../styles.css/add_minerals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
