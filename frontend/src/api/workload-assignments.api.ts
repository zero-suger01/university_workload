import api from './client';

export const workloadAssignmentsApi = {
  getByPlanningRow: (planningRowId: string) =>
    api.get(`/workload-assignments/by-planning/${planningRowId}`).then((r) => r.data),
  getByFaculty: (facultyId: string, semesterId?: string) =>
    api.get(`/workload-assignments/by-faculty/${facultyId}`, { params: { semesterId } }).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/workload-assignments', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/workload-assignments/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/workload-assignments/${id}`),
};
