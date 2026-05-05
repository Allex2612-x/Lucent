import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { notificationsService } from '../../services/notifications.service';
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId: string | null;
  createdAt: string;
}

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsService.getAll();
      return response.data;
    },
    select: (data) => {
      // Get first 5 notifications
      const notifications = data?.data || [];
      return notifications.slice(0, 5);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await markAsReadMutation.mutateAsync(notification.id);

    // Navigate based on notification type
    if (
      notification.type === 'budget_exceeded' ||
      notification.type === 'budget_near_limit'
    ) {
      navigate('/budgets');
    }

    // Close dropdown
    onClose();
  };

  const notifications = data as Notification[] | undefined;

  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown-header">
        <h3>Notificări</h3>
        <button
          onClick={onClose}
          className="notification-close-btn"
          aria-label="Închide"
        >
          <X size={18} />
        </button>
      </div>
      <div className="notification-dropdown-body">
        {isLoading && (
          <div className="notification-loading">Se încarcă...</div>
        )}
        {!isLoading && notifications && notifications.length === 0 && (
          <div className="notification-empty">
            <Bell size={32} />
            <p>Nu ai notificări noi</p>
          </div>
        )}
        {!isLoading &&
          notifications &&
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${
                !notification.isRead ? 'unread' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-date">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
