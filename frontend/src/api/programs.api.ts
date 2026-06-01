import api from './client';

export const programsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/programs', { params }).then((r) => r.data),

  getById: (id: string) => api.get(`/programs/${id}`).then((r) => r.data.data),

  create: (data: Record<string, unknown>) =>
    api.post('/programs', data).then((r) => r.data.data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/programs/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/programs/${id}`),
};
