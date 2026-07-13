// ============================================================================
// Auth Store (Zustand)
// ============================================================================
// Manages authentication state: login, logout, session restoration.
// Tokens and auth data are stored in sessionStorage (encrypted via api.ts).
// ============================================================================

import { create } from 'zustand';
import { loginApi, storeAuth, clearAuth, getStoredAuthData } from '../config/api';

import type { User } from '../types';

// Auth state & actions
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  serverIp: string | null;
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  login: (serverIp: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

// Extract token from various API response formats
function extractToken(data: any): string | null {
  return data.token || data.access_token || data.accessToken || null;
}

// Extract refresh token from various API response formats
function extractRefreshToken(data: any): string | null {
  return data.refresh_token || data.refreshToken || null;
}

// Extract user data from various API response formats
function extractUser(data: any, username: string): User {
  if (data.user) {
    return {
      id: data.user.id || data.user.user_id || 0,
      username: data.user.username || username,
      fullname: data.user.fullname || data.user.full_name || username,
      role: data.user.role || data.user.user_level_code || data.user.user_level || '',
    };
  }
  return {
    id: data.user_id || data.id || 0,
    username: data.username || username,
    fullname: data.fullname || data.full_name || username,
    role: data.role || data.user_level_code || data.user_level || '',
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  // ─── Initial State ──────────────────────────────────────────────────────
  token: null,
  refreshToken: null,
  serverIp: null,
  user: null,
  isLoggedIn: false,
  loading: false,
  error: null,

  // ─── Restore session from sessionStorage (called on App mount) ─────────
  restoreSession: async () => {
    const { token, refreshToken, serverIp, user } = await getStoredAuthData();
    if (token && serverIp) {
      set({ token, refreshToken, serverIp, user, isLoggedIn: true });
    }
  },

  // ─── Login: send credentials to API, save token & user ─────────────────
  login: async (serverIp: string, username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const data = await loginApi(serverIp, username, password);

      const token = extractToken(data);
      const refreshToken = extractRefreshToken(data);
      const user = extractUser(data, username);

      if (!token) {
        throw new Error('No token received from server');
      }

      // Save to sessionStorage (encrypted) and Zustand state
      storeAuth(token, refreshToken || '', serverIp, user);
      set({
        token,
        refreshToken,
        serverIp,
        user,
        isLoggedIn: true,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      // Handle various error formats from the backend
      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        'Connection failed or invalid credentials';
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // ─── Logout: clear all auth data ───────────────────────────────────────
  logout: () => {
    clearAuth();
    set({
      token: null,
      refreshToken: null,
      serverIp: null,
      user: null,
      isLoggedIn: false,
      loading: false,
      error: null,
    });
  },
}));