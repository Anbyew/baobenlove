import { Outlet, useLocation } from 'react-router';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-20">
        <Outlet />
      </main>
      {!isHomePage && <Footer />}
    </div>
  );
}