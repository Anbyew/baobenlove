import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { AnalyticsTracker } from './AnalyticsTracker';
import { PageLoader } from './PageLoader';
import { CustomCursor } from './CustomCursor';
import { clearMyGardenHistory } from '../lib/auth';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('clearMine') !== 'games') return;

    const finish = () => {
      window.localStorage.removeItem('wedding-garden-plots-v2');
      window.localStorage.removeItem('wedding-garden-history-v1');
      window.localStorage.removeItem('baoben_dance_clearances');
      window.localStorage.removeItem('baoben_dance_scores_v1');
      window.localStorage.removeItem('baoben_dance_leaderboard_v1');
      window.localStorage.setItem('baoben_dance_local_reset', 'true');
      window.sessionStorage.removeItem('loader-shown');

      params.delete('clearMine');
      const nextSearch = params.toString();
      window.location.replace(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}${location.hash}`);
    };

    try {
      const raw = window.localStorage.getItem('wedding_identity');
      const token = raw ? JSON.parse(raw)?.sessionToken : null;
      const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
      if (!isLocalhost && typeof token === 'string' && token) {
        clearMyGardenHistory(token).finally(finish);
        return;
      }
    } catch {
      // Local cleanup still works if identity storage is malformed.
    }

    finish();
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="min-h-screen">
      <PageLoader />
      <CustomCursor />
      <AnalyticsTracker />
      <Navigation />
      <main className="pt-20">
        <Outlet />
      </main>
      {!isHomePage && <Footer />}
    </div>
  );
}
