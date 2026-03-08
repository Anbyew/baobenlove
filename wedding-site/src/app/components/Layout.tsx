import { Outlet, useLocation } from 'react-router';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { AnalyticsTracker } from './AnalyticsTracker';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen">
      <AnalyticsTracker />
      <Navigation />
      <main className="pt-20">
        <Outlet />
      </main>
      {!isHomePage && <Footer />}
    </div>
  );
}
