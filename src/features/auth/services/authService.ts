import { loginApi, storeAuth, clearAuth, getStoredAuthData } from '../../../config/api';

import type { User } from '../../../types';

export const authService = {
    login: async (serverIp: string, username: string, password: string) => {
        return await loginApi(serverIp, username, password);
    },
    restoreSession: async () => {
        return await getStoredAuthData();
    },
    storeSession: async (token: string, refreshToken: string, serverIp: string, user: User) => {
        await storeAuth(token, refreshToken, serverIp, user);
    },
    logout: () => {
        clearAuth();
    },
};
