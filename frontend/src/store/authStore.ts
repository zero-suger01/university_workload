import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DEPARTMENT_HEAD' | 'FACULTY';
  departmentId: string;
  department: { id: string; name: string; code: string };
  employeeId: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  /** true — session tekshiruvi tugadi (muvaffaqiyatli yoki muvaffaqiyatsiz) */
  isInitialized: boolean;
  setAuth: (user: AuthUser, accessToken?: string) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,

  setAuth: (user, accessToken) => set({ user, accessToken: accessToken ?? null, isInitialized: true }),

  clearAuth: () => set({ user: null, accessToken: null, isInitialized: true }),

  setInitialized: () => set({ isInitialized: true }),
}));
