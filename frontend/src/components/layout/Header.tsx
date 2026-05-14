import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Plus, Search, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { notificationsService } from '../../services/notifications.service';
import { NotificationDropdown } from './NotificationDropdown';
import { AiAssistantDrawer } from './AiAssistantDrawer';

const ROUTE_CRUMBS: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Tranzacții',
  '/budgets': 'Bugete',
  '/categories': 'Categorii',
  '/reports': 'Rapoarte',
  '/settings': 'Setări',
};

export function Header() {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await notificationsService.getUnreadCount();
      return response.data;
    },
    refetchInterval: 30000,
    select: (data) => data?.data?.count || 0,
  });

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
      <div className="crumb">
        FARO <span className="crumb-sep">/</span> <b>{currentLabel}</b>
      </div>

      <div className="search">
        <Search size={14} />
        <span>Caută tranzacții, categorii…</span>
        <kbd>⌘K</kbd>
      </div>

      <button
        onClick={() => setIsAssistantOpen(true)}
        title="Asistent AI"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 36,
          padding: '0 12px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #2547f5, #6c4cf8)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: 'inherit',
          boxShadow: '0 2px 8px -2px rgba(37,71,245,.45)',
        }}
      >
        <Sparkles size={14} />
        Asistent AI
      </button>

      <div className="notification-bell-wrapper" ref={dropdownRef}>
        <button
          className="icon-btn"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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

      <button className="icon-btn" title="Adaugă">
        <Plus size={17} />
      </button>

      <AiAssistantDrawer open={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </div>
  );
}
