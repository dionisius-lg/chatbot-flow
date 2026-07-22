// ============================================================================
// Centralized API Helper (Axios + sessionStorage + Encryption)
// ============================================================================
// - Axios instance with request/response interceptors
// - Dynamic baseURL from serverIp (stored in sessionStorage)
// - Bearer token auth from sessionStorage (AES-256-CBC encrypted)
// - 401 auto-refresh with request queue (max 3 retries)
// - Default export: api.get(), api.post(), api.put(), api.delete()
// ============================================================================

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { encrypt, decrypt } from '../lib/encryption';
import { isEmpty, isValidDomain, isValidIp } from '../lib/value';

// ─── Constants ──────────────────────────────────────────────────────────────
const AUTH_KEY = 'bot_auth'; // sessionStorage key for auth data
const SERVER_KEY = 'bot_server_ip'; // sessionStorage key for server IP
const MAX_RETRIES = 3; // max token refresh attempts

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface StoredAuth {
    token: string;
    refresh_token: string;
    serverIp: string;
    user: any;
}

interface RequestProps {
    method: string;
    endpoint?: string;
    body?: any;
    config?: AxiosRequestConfig;
    attempt?: number;
}

// ─── Auth Storage (encrypted sessionStorage) ────────────────────────────────

// Read server IP from sessionStorage (plain text)
function getStoredUrl(): string | null {
    return sessionStorage.getItem(SERVER_KEY);
}

// Read auth data from sessionStorage (encrypted)
async function getStoredAuth(): Promise<StoredAuth | null> {
    const stored = sessionStorage.getItem(AUTH_KEY);
    if (!stored) {
        return null;
    }
    const decrypted = await decrypt(stored);
    if (!decrypted) {
        return null;
    }
    try {
        return JSON.parse(decrypted);
    } catch {
        return null;
    }
}

// Save auth data to sessionStorage (encrypted)
async function setStoredAuth(data: StoredAuth): Promise<void> {
    const encrypted = await encrypt(JSON.stringify(data));
    if (encrypted) {
        sessionStorage.setItem(AUTH_KEY, encrypted);
    }
}

// Clear all auth data from sessionStorage
export function clearAuth(): void {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(SERVER_KEY);
}

// Save token, refresh token, server IP, and user to sessionStorage
export async function storeAuth(token: string, refreshToken: string, serverIp: string, user: any): Promise<void> {
    sessionStorage.setItem(SERVER_KEY, serverIp);
    await setStoredAuth({ token, refresh_token: refreshToken, serverIp, user });
}

// Update stored tokens (used after successful token refresh)
export async function updateTokens(token: string, refreshToken: string): Promise<void> {
    const auth = await getStoredAuth();
    if (auth) {
        await setStoredAuth({ ...auth, token, refresh_token: refreshToken });
    }
}

// ─── Axios Instance ─────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create();

// ─── Token Refresh Queue ────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken: string) {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
}

// Helper to dynamically build API URL based on protocol and input format
export function resolveBaseUrl(serverIp: string): string {
    if (!serverIp) {
        return '';
    }

    let cleanInput = serverIp.trim();

    // Strip protocol prefix if present
    if (cleanInput.startsWith('http://')) {
        cleanInput = cleanInput.substring(7);
    } else if (cleanInput.startsWith('https://')) {
        cleanInput = cleanInput.substring(8);
    }

    // Strip trailing slashes
    if (cleanInput.endsWith('/')) {
        cleanInput = cleanInput.slice(0, -1);
    }

    if (isValidDomain(cleanInput)) {
        // Domain -> https://<domain>/api-backend
        return `https://${cleanInput}/api-backend`;
    }

    if (isValidIp(cleanInput)) {
        // IP  -> http://<ip> (e.g. http://127.0.0.1:8000)
        return `http://${cleanInput}:8000`;
    }

    // localhost -> http://<ip> (e.g. http://localhost:8000)
    return `http://${cleanInput}:8000`;
}

// ─── Request Interceptor ────────────────────────────────────────────────────
// This interceptor runs automatically BEFORE every request is sent to the backend.
// Main responsibilities:
// 1. Retrieve the Server IP from storage and construct the target URL (baseURL).
// 2. Retrieve the encrypted Authentication Token (Bearer token), decrypt it, and attach it to the Header.
apiClient.interceptors.request.use(async (config) => {
    // Retrieve Server IP/Domain
    const serverIp = getStoredUrl();
    if (!serverIp) {
        // If there's no server IP (empty session), forcefully redirect to the login page
        window.location.href = '/login';
        return Promise.reject(new Error('No server IP set'));
    }
    config.baseURL = resolveBaseUrl(serverIp);

    if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    // Retrieve and decrypt the session token
    const auth = await getStoredAuth();
    if (auth?.token) {
        // Attach the token to the Authorization header so the backend approves the request
        config.headers['Authorization'] = `Bearer ${auth.token}`;
    }
    return config;
});

// ─── Response Interceptor ───────────────────────────────────────────────────
// This interceptor catches responses from the backend before they are received by our React components.
// Main responsibility: Handle HTTP 401 (Unauthorized) errors by performing an "Auto-Refresh Token"
// transparently in the background, so the user doesn't have to re-login.
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const responseCode = error.response?.data?.response_code;

        // Initialize retry counter
        if (!originalRequest._retryCount) {
            originalRequest._retryCount = 0;
        }

        // If 401 error (token expired) AND retries are still available
        if (
            status === 401 &&
            (responseCode === 41 || responseCode === undefined) &&
            originalRequest._retryCount < MAX_RETRIES
        ) {
            originalRequest._retryCount += 1;

            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const auth = await getStoredAuth();
                    if (!auth?.refresh_token || !auth?.serverIp) {
                        throw new Error('No refresh token available');
                    }

                    // Request token refresh
                    const baseUrl = resolveBaseUrl(auth.serverIp);
                    const refreshResponse = await axios.post(
                        `${baseUrl}/token/refresh`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${auth.refresh_token}`,
                                'Content-Type': 'application/json',
                            },
                            timeout: 10000,
                        },
                    );

                    const data = refreshResponse.data;
                    const newToken = data.token || data.access_token || data.accessToken;
                    const newRefreshToken = data.refresh_token || data.refreshToken || auth.refresh_token;

                    if (!newToken) {
                        throw new Error('Token refresh failed - no token in response');
                    }

                    // Save new tokens, process queue, retry original request
                    await setStoredAuth({ ...auth, token: newToken, refresh_token: newRefreshToken });
                    isRefreshing = false;
                    onTokenRefreshed(newToken);

                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                } catch {
                    // On refresh failure, reset queue and retry
                    isRefreshing = false;
                    refreshSubscribers = [];
                    if (originalRequest._retryCount >= MAX_RETRIES) {
                        clearAuth();
                        window.location.href = '/login?expired=true';
                    }
                    return apiClient(originalRequest);
                }
            } else {
                // If refresh is in progress, queue this request
                return new Promise((resolve) => {
                    subscribeTokenRefresh((newToken) => {
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }
        }

        // If max retries reached, redirect to login
        if (status === 401 && originalRequest._retryCount >= MAX_RETRIES) {
            clearAuth();
            window.location.href = '/login?expired=true';
        }

        return Promise.reject(error);
    },
);

// ─── Core Request Function ──────────────────────────────────────────────────
function stripEmpty(body: any): any {
    if (body === null || body === undefined) {
        return body;
    }
    if (typeof body !== 'object' || Array.isArray(body) || body instanceof FormData) {
        return body;
    }
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(body)) {
        if (v !== null && v !== undefined && v !== '') {
            cleaned[k] = typeof v === 'object' && !Array.isArray(v) ? stripEmpty(v) : v;
        }
    }
    return cleaned;
}

async function requestApi({ method, endpoint = '', body = {}, config: extraConfig }: RequestProps) {
    method = method?.toLowerCase();
    if (!['get', 'post', 'put', 'delete'].includes(method)) {
        method = 'get';
    }

    // Normalize endpoint: remove double slashes, leading/trailing slashes
    endpoint = endpoint.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');

    try {
        const config: AxiosRequestConfig = {
            method,
            url: `/${endpoint}`,
            ...extraConfig,
        };

        // Body only for non-GET requests
        if (!isEmpty(body) && method !== 'get') {
            config.data = stripEmpty(body);
        }

        const response = await apiClient(config);
        return response.data;
    } catch (error: any) {
        // Return error response data (includes 4xx, 5xx status codes)
        if (error.response) {
            return error.response.data;
        }
        // If network error, return a structured error object
        return {
            request_time: new Date().getTime(),
            response_code: 503,
            success: false,
            message: error.message || 'Service unavailable',
        };
    }
}

// ─── Public Helpers ─────────────────────────────────────────────────────────

// Login API (bypasses interceptor since no token exists yet)
export async function loginApi(serverIp: string, username: string, password: string) {
    const response = await axios.post(
        `${resolveBaseUrl(serverIp)}/token`,
        {
            username,
            password,
        },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        },
    );
    return response.data.data;
}

// Get stored auth data from sessionStorage (for session restoration)
export async function getStoredAuthData() {
    const serverIp = getStoredUrl();
    const auth = await getStoredAuth();
    if (!auth || !serverIp) {
        return { token: null, refreshToken: null, serverIp: null, user: null };
    }
    return {
        token: auth.token,
        refreshToken: auth.refresh_token,
        serverIp: auth.serverIp,
        user: auth.user,
    };
}

// ─── API Method Wrappers ────────────────────────────────────────────────────
function request(method: string) {
    return async (endpoint?: string, body?: any, config?: AxiosRequestConfig) => {
        return await requestApi({ method, endpoint, body, config });
    };
}

export { apiClient };

// Default export: api helper with get, post, put, delete methods
export default {
    get: request('get'),
    post: request('post'),
    put: request('put'),
    delete: request('delete'),
};
