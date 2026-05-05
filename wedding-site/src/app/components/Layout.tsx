import { Outlet, useLocation } from 'react-router';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { AnalyticsTracker } from './AnalyticsTracker';
import { PageLoader } from './PageLoader';
import { CustomCursor } from './CustomCursor';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

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
