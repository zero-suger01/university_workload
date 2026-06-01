import api from './client';

export const vacancyApi = {
  forecast: (semesterId: string, departmentId?: string) =>
    api.get('/vacancy/forecast', { params: { semesterId, departmentId } }).then((r) => r.data.data),

  history: (semesterId?: string) =>
    api.get('/vacancy/history', { params: { semesterId } }).then((r) => r.data.data),
};
