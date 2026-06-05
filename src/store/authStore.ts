import { create } from 'zustand';
import { apiFetch, setToken, loadToken } from '../services/api/client';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
const useBackend = apiUrl.length > 0;

export interface User {
  id: number;
  phone: string;
  nickname: string;
  role: 'user' | 'admin';
  grade: number;
  avatar_url?: string;
  created_at: string;
}

const OFFLINE_USER: User = {
  id: 0,
  phone: 'offline',
  nickname: '本地用户',
  role: 'user',
  grade: 3,
  created_at: new Date().toISOString(),
};

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, nickname: string, grade: number) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'nickname' | 'grade'>>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });

    if (!useBackend) {
      set({ user: OFFLINE_USER, loading: false });
      return;
    }

    try {
      const token = await loadToken();
      if (!token) {
        set({ user: null, loading: false });
        return;
      }
      const data = await apiFetch<{ user: User }>('/api/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      await setToken(null);
      set({ user: null, loading: false });
    }
  },

  login: async (phone, password) => {
    set({ error: null });
    try {
      const data = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      await setToken(data.token);
      set({ user: data.user, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '登录失败，请检查网络连接';
      set({ loading: false, error: msg });
      throw e;
    }
  },

  register: async (phone, password, nickname, grade) => {
    set({ error: null });
    try {
      const data = await apiFetch<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phone, password, nickname, grade }),
      });
      await setToken(data.token);
      set({ user: data.user, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '注册失败';
      set({ loading: false, error: msg });
      throw e;
    }
  },

  logout: async () => {
    if (!useBackend) {
      return;
    }
    set({ user: null, loading: false, error: null });
    await setToken(null);
  },

  updateProfile: async (data) => {
    if (!useBackend) return;
    try {
      const res = await apiFetch<{ user: User }>('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      set({ user: res.user });
    } catch {
      // silently fail
    }
  },

  clearError: () => set({ error: null }),
}));
