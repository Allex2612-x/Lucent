import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
  // Mobile sidebar drawer: closed by default, opens via hamburger on
  // small screens. Closes automatically when the route changes so the
  // user isn't stranded on the drawer after tapping a link.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="sasha-app">
      <Sidebar drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {drawerOpen && (
        <div
          className="sb-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="main">
        <Header onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
