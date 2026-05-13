import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
  return (
    <div className="sasha-app">
      <Sidebar />
      <div className="main">
        <Header />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
