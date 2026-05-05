import { api } from './api';

export const notificationsService = {
  getAll: () => {
    return api.get('/notifications');
  },

  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  markAsRead: (id: string) => {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: () => {
    return api.patch('/notifications/read-all');
  },
};
