import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { notificationsService } from '../../services/notifications.service';
import { NotificationDropdown } from './NotificationDropdown';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await notificationsService.getUnreadCount();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    select: (data) => data?.data?.count || 0,
  });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    } finally {
      logout();
      navigate('/login');
    }
  };

  // Close dropdown when clicking outside
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

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          {/* Page title can be added here dynamically if needed */}
        </div>
        <div className="header-right">
          <div className="notification-bell-wrapper" ref={dropdownRef}>
            <button
              className="notification-bell"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Notificări"
            >
              <Bell size={20} />
              {unreadCount !== undefined && unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            {isDropdownOpen && (
              <NotificationDropdown onClose={() => setIsDropdownOpen(false)} />
            )}
          </div>
          <div className="user-info">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="btn-logout-header"
            aria-label="Deconectare"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
