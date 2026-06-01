import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { getInitPromise } from '../lib/sessionManager';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // httpOnly cookie'lar (accessToken, refreshToken) avtomatik yuboriladi
});

// ─── Request Interceptor — accessTokenni headerga qo'shish ──────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — 401 da token yangilash ──────────────────────────
// Token faqat httpOnly cookie'da saqlanadi. 401 bo'lsa, refresh endpointga
// murojaat qilamiz — u yangi cookie o'rnatadi, keyin original so'rovni qayta yuboramiz.
let isRefreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(api(original)));
        });
      }

      // If the app's initial session refresh is still in flight, wait for it
      // instead of doing a concurrent refresh (which would rotate the token twice).
      const initPromise = getInitPromise();
      if (initPromise) {
        await initPromise.catch(() => {});
        if (useAuthStore.getState().user) {
          // Session was restored by the init refresh — just retry
          return api(original);
        }
        // Init refresh failed → already cleared, redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      isRefreshing = true;
      try {
        // httpOnly refreshToken cookie orqali yangi accessToken cookie olamiz
        const refreshRes = await axios.post<{ data: { accessToken: string; user: any } }>(
          '/api/auth/refresh', {}, { withCredentials: true }
        );

        // authStore-ni yangi token bilan yangilaymiz — keyingi so'rovlar uchun sarlavha ham to'g'ri bo'ladi
        const newToken = refreshRes.data?.data?.accessToken;
        if (newToken) {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) useAuthStore.getState().setAuth(currentUser, newToken);
        }

        // Navbatdagi so'rovlarni qayta yuboramiz
        queue.forEach((cb) => cb());
        queue = [];

        return api(original);
      } catch {
        // Refresh ham muvaffaqiyatsiz — to'liq logout
        useAuthStore.getState().clearAuth();
        queue.forEach((cb) => cb());
        queue = [];
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
