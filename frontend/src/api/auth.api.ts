import api from './client';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post('/auth/refresh').then((r) => r.data.data),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};
