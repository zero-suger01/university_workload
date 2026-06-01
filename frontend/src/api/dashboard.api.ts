import api from './client';

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data.data),

  workloadDistribution: (semesterId: string) =>
    api.get('/dashboard/workload-distribution', { params: { semesterId } }).then((r) => r.data.data),

  departmentComparison: (semesterId: string) =>
    api.get('/dashboard/department-comparison', { params: { semesterId } }).then((r) => r.data.data),
};
