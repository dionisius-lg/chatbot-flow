/**
 * authStore — Zustand State Management for Authentication
 *
 * Responsible for managing the user's login state (isLoggedIn, loading, error).
 * Stores token and user profile data globally.
 */

import { create } from 'zustand';

import { authService } from '../services/authService';

import type { AuthState, User } from '../../../types';

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
        const { token, refreshToken, serverIp, user } = await authService.restoreSession();
        if (token && serverIp) {
            set({ token, refreshToken, serverIp, user, isLoggedIn: true });
        }
    },

    // ─── Login: send credentials to API, save token & user ─────────────────
    login: async (serverIp: string, username: string, password: string) => {
        set({ loading: true, error: null });
        try {
            const data = await authService.login(serverIp, username, password);

            const token = extractToken(data);
            const refreshToken = extractRefreshToken(data);
            const user = extractUser(data, username);

            if (!token) {
                throw new Error('No token received from server');
            }

            // Save to sessionStorage (encrypted) and Zustand state
            await authService.storeSession(token, refreshToken || '', serverIp, user);
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
            throw new Error(message, { cause: err });
        }
    },

    // ─── Logout: clear all auth data ───────────────────────────────────────
    logout: () => {
        authService.logout();
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
