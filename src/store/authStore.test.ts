import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuthStore } from './authStore';
import { loginApi, storeAuth, clearAuth, getStoredAuthData } from '../config/api';

// Mock the API client helper calls
vi.mock('../config/api', () => ({
    loginApi: vi.fn(),
    storeAuth: vi.fn(),
    clearAuth: vi.fn(),
    getStoredAuthData: vi.fn(),
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('authStore', () => {
    beforeEach(() => {
        // Reset Zustand store state before each test
        useAuthStore.setState({
            token: null,
            refreshToken: null,
            serverIp: null,
            user: null,
            isLoggedIn: false,
            loading: false,
            error: null,
        });
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('has correct default values', () => {
            const state = useAuthStore.getState();
            expect(state.token).toBeNull();
            expect(state.refreshToken).toBeNull();
            expect(state.serverIp).toBeNull();
            expect(state.user).toBeNull();
            expect(state.isLoggedIn).toBe(false);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe('restoreSession', () => {
        it('does not log in if no stored session is found', async () => {
            vi.mocked(getStoredAuthData).mockResolvedValueOnce({
                token: null,
                refreshToken: null,
                serverIp: null,
                user: null,
            });

            await useAuthStore.getState().restoreSession();

            const state = useAuthStore.getState();
            expect(state.isLoggedIn).toBe(false);
            expect(state.token).toBeNull();
        });

        it('restores session when valid tokens and IP are in storage', async () => {
            const mockUser = { id: 1, username: 'admin', fullname: 'Administrator', role: 'admin' };
            vi.mocked(getStoredAuthData).mockResolvedValueOnce({
                token: 'mock-token',
                refreshToken: 'mock-refresh',
                serverIp: '127.0.0.1',
                user: mockUser,
            });

            await useAuthStore.getState().restoreSession();

            const state = useAuthStore.getState();
            expect(state.isLoggedIn).toBe(true);
            expect(state.token).toBe('mock-token');
            expect(state.refreshToken).toBe('mock-refresh');
            expect(state.serverIp).toBe('127.0.0.1');
            expect(state.user).toEqual(mockUser);
        });
    });

    describe('login', () => {
        it('logs in successfully and updates state', async () => {
            const mockResponseData = {
                token: 'access-token-xyz',
                refresh_token: 'refresh-token-abc',
                user: {
                    id: 12,
                    username: 'testuser',
                    fullname: 'Test User',
                    role: 'editor',
                },
            };
            vi.mocked(loginApi).mockResolvedValueOnce(mockResponseData);

            // Trigger login
            await useAuthStore.getState().login('172.31.0.116', 'testuser', 'password123');

            const state = useAuthStore.getState();
            expect(state.isLoggedIn).toBe(true);
            expect(state.token).toBe('access-token-xyz');
            expect(state.refreshToken).toBe('refresh-token-abc');
            expect(state.serverIp).toBe('172.31.0.116');
            expect(state.user).toEqual({
                id: 12,
                username: 'testuser',
                fullname: 'Test User',
                role: 'editor',
            });
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();

            // Verify storeAuth was called
            expect(storeAuth).toHaveBeenCalledWith(
                'access-token-xyz',
                'refresh-token-abc',
                '172.31.0.116',
                expect.objectContaining({ username: 'testuser' }),
            );
        });

        it('throws an error and sets state if token is missing in response', async () => {
            vi.mocked(loginApi).mockResolvedValueOnce({
                // missing token
                user: { id: 1, username: 'test' },
            });

            await expect(useAuthStore.getState().login('127.0.0.1', 'user', 'pass')).rejects.toThrow(
                'No token received from server',
            );

            const state = useAuthStore.getState();
            expect(state.isLoggedIn).toBe(false);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('No token received from server');
        });

        it('handles response errors gracefully', async () => {
            const networkError = {
                response: {
                    data: {
                        message: 'Incorrect password',
                    },
                },
            };
            vi.mocked(loginApi).mockRejectedValueOnce(networkError);

            await expect(useAuthStore.getState().login('127.0.0.1', 'user', 'wrong-pass')).rejects.toThrow(
                'Incorrect password',
            );

            const state = useAuthStore.getState();
            expect(state.isLoggedIn).toBe(false);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Incorrect password');
        });
    });

    describe('logout', () => {
        it('clears credentials and state', () => {
            // Set some logged in state first
            useAuthStore.setState({
                token: 'active-token',
                isLoggedIn: true,
                serverIp: 'localhost',
            });

            useAuthStore.getState().logout();

            const state = useAuthStore.getState();
            expect(state.isLoggedIn).toBe(false);
            expect(state.token).toBeNull();
            expect(state.serverIp).toBeNull();
            expect(clearAuth).toHaveBeenCalledTimes(1);
        });
    });
});
