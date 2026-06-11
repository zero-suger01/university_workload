import api from './client';

export const dashboardApi = {
  summary: (semesterId?: string) =>
    api.get('/dashboard/summary', { params: semesterId ? { semesterId } : {} }).then((r) => r.data.data),

  workloadDistribution: (semesterId: string) =>
    api.get('/dashboard/workload-distribution', { params: { semesterId } }).then((r) => r.data.data),

  departmentComparison: (semesterId: string) =>
    api.get('/dashboard/department-comparison', { params: { semesterId } }).then((r) => r.data.data),
};
