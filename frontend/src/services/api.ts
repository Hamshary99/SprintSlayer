import axios, { type AxiosResponse } from 'axios';
import type { AuthResponse } from '@/types';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true, // send HttpOnly cookies on every request
    headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<AxiosResponse<AuthResponse>> | null = null;

export function refreshSession() {
    refreshPromise ??= api
        .post<AuthResponse>('/auth/refresh')
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

// Intercept 401s and attempt a single silent refresh before redirecting.
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        if (!original || error.response?.status !== 401) {
            throw error;
        }

        const isAuthRequest = /\/auth\/(login|register|refresh)$/.test(original.url ?? '');
        if (isAuthRequest) {
            throw error;
        }

        if (!original._retry) {
            original._retry = true;

            try {
                await refreshSession();
                return api(original);
            } catch {
                window.location.assign('/login');
                throw error;
            }
        }

        throw error;
    },
);

export default api;
