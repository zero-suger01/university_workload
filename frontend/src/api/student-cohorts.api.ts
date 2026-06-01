import api from './client';

export const studentCohortsApi = {
  getAll: (semesterId?: string) =>
    api.get('/student-cohorts', { params: { semesterId } }).then((r) => r.data),
  getByProgram: (programId: string, semesterId?: string) =>
    api.get(`/student-cohorts/by-program/${programId}`, { params: { semesterId } }).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/student-cohorts', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/student-cohorts/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/student-cohorts/${id}`),
};
