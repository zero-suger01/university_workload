import api from './client';

export const cqiApi = {
  getAll: (params?: { semesterId?: string; facultyId?: string; status?: string }) =>
    api.get('/cqi', { params }).then((r) => r.data),
  getMy: () => api.get('/cqi/my').then((r) => r.data),
  getById: (id: string) => api.get(`/cqi/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/cqi', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/cqi/${id}`, data).then((r) => r.data),
  submit: (id: string) => api.post(`/cqi/${id}/submit`).then((r) => r.data),
  approve: (id: string, notes?: string) =>
    api.post(`/cqi/${id}/approve`, { notes }).then((r) => r.data),
  requestRevision: (id: string, notes: string) =>
    api.post(`/cqi/${id}/revision`, { notes }).then((r) => r.data),
};
