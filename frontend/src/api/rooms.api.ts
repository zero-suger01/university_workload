import api from './client';

export const roomsApi = {
  getAll: (params?: { roomType?: string; building?: string }) =>
    api.get('/rooms', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/rooms/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/rooms', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/rooms/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/rooms/${id}`),
};
