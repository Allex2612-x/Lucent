import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  FolderOpen,
  FileText,
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Tranzacții', icon: ArrowLeftRight },
  { path: '/budgets', label: 'Bugete', icon: Wallet },
  { path: '/categories', label: 'Categorii', icon: FolderOpen },
  { path: '/reports', label: 'Rapoarte', icon: FileText },
  { path: '/settings', label: 'Setări', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Sasha</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
