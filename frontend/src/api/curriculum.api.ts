import api from './client';

export const curriculumApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/curriculum', { params }).then((r) => r.data),

  getById: (id: string) => api.get(`/curriculum/${id}`).then((r) => r.data.data),

  create: (data: Record<string, unknown>) =>
    api.post('/curriculum', data).then((r) => r.data.data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/curriculum/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/curriculum/${id}`),

  addItem: (curriculumId: string, data: Record<string, unknown>) =>
    api.post(`/curriculum/${curriculumId}/items`, data).then((r) => r.data.data),

  removeItem: (curriculumId: string, itemId: string) =>
    api.delete(`/curriculum/${curriculumId}/items/${itemId}`),
};
