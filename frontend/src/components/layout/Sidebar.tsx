import { NavLink } from 'react-router-dom';
import { Home, List, Tag, Wallet, BarChart3, Settings as SettingsIcon, LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { insightsService } from '../../services/insights.service';

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}

const generalItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: Home, end: true },
  { path: '/transactions', label: 'Tranzacții', icon: List },
  { path: '/categories', label: 'Categorii', icon: Tag },
  { path: '/budgets', label: 'Bugete', icon: Wallet },
  { path: '/reports', label: 'Rapoarte', icon: BarChart3 },
];

const accountItems: NavItem[] = [{ path: '/settings', label: 'Setări', icon: SettingsIcon }];

function getInitials(firstName?: string, lastName?: string) {
  const first = firstName?.trim()?.[0] ?? '';
  const last = lastName?.trim()?.[0] ?? '';
  return (first + last).toUpperCase() || 'AS';
}

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const tipQuery = useQuery({
    queryKey: ['insights', 'tip'],
    queryFn: () => insightsService.getTip(),
    select: (res) => res.data?.data,
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1h client-side cache
    refetchOnWindowFocus: false,
  });
  const refreshTip = async () => {
    try {
      const res = await insightsService.getTip(true);
      queryClient.setQueryData(['insights', 'tip'], res);
    } catch {
      // ignore — fallback text stays visible
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore — still clear session locally
    } finally {
      logout();
      navigate('/login');
    }
  };

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end}
        className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}
      >
        <Icon />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="sb-mark">F</div>
        <div>
          <div className="sb-name">FARO</div>
          <div className="sb-tag">Finanțe personale</div>
        </div>
      </div>

      <div className="sb-section">General</div>
      {generalItems.map(renderItem)}

      <div className="sb-section">Cont</div>
      {accountItems.map(renderItem)}

      <div className="sb-spacer" />

      <div className="sb-tip">
        <div className="sb-tip-glow" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
            position: 'relative',
          }}
        >
          <div className="sb-tip-title" style={{ marginBottom: 0 }}>
            Sfat financiar
          </div>
          <button
            type="button"
            onClick={refreshTip}
            disabled={tipQuery.isFetching}
            title="Regenerează sfat"
            aria-label="Regenerează sfat"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b8bcd6',
              cursor: 'pointer',
              padding: 2,
              display: 'grid',
              placeItems: 'center',
              opacity: tipQuery.isFetching ? 0.5 : 1,
            }}
          >
            <RefreshCw
              size={11}
              style={tipQuery.isFetching ? { animation: 'spin 1s linear infinite' } : undefined}
            />
          </button>
        </div>
        <div className="sb-tip-body">
          {tipQuery.isLoading
            ? 'Se generează sfatul…'
            : tipQuery.data?.content ??
              'Verifică-ți bugetele săptămânal — un control scurt previne surprizele de la final de lună.'}
        </div>
      </div>

      <div className="sb-user">
        <div className="sb-avatar">{getInitials(user?.firstName, user?.lastName)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="sb-user-name">
            {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Utilizator' : 'Utilizator'}
          </div>
          <div className="sb-user-mail">{user?.email ?? ''}</div>
        </div>
        <button className="sb-logout" onClick={handleLogout} title="Deconectare" aria-label="Deconectare">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
