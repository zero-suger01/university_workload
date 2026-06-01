import api from './client';

export const requestsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/requests', { params }).then((r) => r.data),

  getById: (id: string) => api.get(`/requests/${id}`).then((r) => r.data.data),

  create: (data: Record<string, unknown>) =>
    api.post('/requests', data).then((r) => r.data.data),

  approve: (id: string, reviewNotes: string) =>
    api.patch(`/requests/${id}/approve`, { reviewNotes }).then((r) => r.data.data),

  reject: (id: string, reviewNotes: string) =>
    api.patch(`/requests/${id}/reject`, { reviewNotes }).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/requests/${id}`),

  bulkRemove: (ids: string[]) => api.delete('/requests/bulk', { data: { ids } }),
};
