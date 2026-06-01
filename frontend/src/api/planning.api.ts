import api from './client';

export const planningApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/planning', { params }).then((r) => r.data),

  summary: (semesterId: string) =>
    api.get('/planning/summary', { params: { semesterId } }).then((r) => r.data.data),

  getById: (id: string) => api.get(`/planning/${id}`).then((r) => r.data.data),

  create: (data: Record<string, unknown>) =>
    api.post('/planning', data).then((r) => r.data.data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/planning/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/planning/${id}`),
};
