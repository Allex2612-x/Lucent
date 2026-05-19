import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Bell, Menu, Plus, Search, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationsService } from '../../services/notifications.service';
import { NotificationDropdown } from './NotificationDropdown';
import { AiAssistantDrawer } from './AiAssistantDrawer';
import { SearchPalette } from './SearchPalette';

const ROUTE_CRUMBS: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Tranzacții',
  '/budgets': 'Bugete',
  '/categories': 'Categorii',
  '/reports': 'Rapoarte',
  '/settings': 'Setări',
};

interface HeaderProps {
  onOpenDrawer?: () => void;
}

export function Header({ onOpenDrawer }: HeaderProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K shortcut opens the search palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Click-outside for the quick-add menu
  useEffect(() => {
    if (!isAddMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isAddMenuOpen]);

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await notificationsService.getUnreadCount();
      return response.data;
    },
    refetchInterval: 30000,
    select: (data) => data?.data?.count || 0,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onMutate: () => {
      // Optimistic: zero the counter right away so the dot disappears
      // before the network round-trip resolves.
      queryClient.setQueryData(['notifications', 'unread-count'], {
        data: { data: { count: 0 } },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const handleBellClick = () => {
    const willOpen = !isDropdownOpen;
    setIsDropdownOpen(willOpen);
    // Mark everything as read the first time the user opens the dropdown
    // while there are unread items.
    if (willOpen && (unreadCount ?? 0) > 0 && !markAllReadMutation.isPending) {
      markAllReadMutation.mutate();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const currentLabel = ROUTE_CRUMBS[location.pathname] ?? 'Dashboard';

  return (
    <div className="topbar">
      {onOpenDrawer && (
        <button
          type="button"
          className="hamburger"
          onClick={onOpenDrawer}
          aria-label="Deschide meniul"
        >
          <Menu size={20} />
        </button>
      )}
      <div className="crumb">
        <span className="crumb-prefix">FARO <span className="crumb-sep">/</span> </span>
        <b>{currentLabel}</b>
      </div>

      <button
        type="button"
        className="search"
        onClick={() => setIsSearchOpen(true)}
        style={{ cursor: 'pointer', textAlign: 'left' }}
      >
        <Search size={14} />
        <span>Caută tranzacții, categorii…</span>
        <kbd>⌘K</kbd>
      </button>

      <button
        onClick={() => setIsAssistantOpen(true)}
        title="Asistent AI"
        className="ai-assistant-btn"
      >
        <Sparkles size={14} />
        <span className="ai-assistant-label">Asistent AI</span>
      </button>

      <div className="notification-bell-wrapper" ref={dropdownRef}>
        <button
          className="icon-btn"
          onClick={handleBellClick}
          aria-label="Notificări"
          title="Notificări"
        >
          <Bell size={17} />
          {unreadCount !== undefined && unreadCount > 0 && <span className="dot" />}
        </button>
        {isDropdownOpen && (
          <NotificationDropdown onClose={() => setIsDropdownOpen(false)} />
        )}
      </div>

      <div ref={addMenuRef} style={{ position: 'relative' }}>
        <button
          className="icon-btn"
          title="Adaugă"
          onClick={() => setIsAddMenuOpen((v) => !v)}
        >
          <Plus size={17} />
        </button>
        {isAddMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 200,
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-lg)',
              padding: 6,
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {[
              { label: '➕ Tranzacție nouă', href: '/transactions' },
              { label: '📊 Buget nou', href: '/budgets' },
              { label: '🏷 Categorie nouă', href: '/categories' },
            ].map((opt) => (
              <button
                key={opt.href}
                type="button"
                onClick={() => {
                  navigate(opt.href);
                  setIsAddMenuOpen(false);
                }}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-1)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <AiAssistantDrawer open={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      <SearchPalette open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
