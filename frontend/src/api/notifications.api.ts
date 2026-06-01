import api from './client';

export const notificationsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/notifications', { params }).then((r) => r.data),

  markRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllRead: () => api.patch('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),

  deleteAll: () => api.delete('/notifications'),
};
