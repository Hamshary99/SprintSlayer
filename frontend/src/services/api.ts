import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // send HttpOnly cookies on every request
    headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<void> | null = null;

// Intercept 401s and attempt a single silent refresh before redirecting.
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        if (!original || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        const isAuthRequest = /\/auth\/(login|register|refresh|logout)$/.test(original.url ?? '');
        if (isAuthRequest) {
            return Promise.reject(error);
        }

        if (!original._retry) {
            original._retry = true;

            try {
                if (!refreshPromise) {
                    refreshPromise = api.post('/auth/refresh').then(() => undefined);
                }

                await refreshPromise;
                return api(original);
            } catch {
                refreshPromise = null;
                window.location.assign('/login');
                return Promise.reject(error);
            } finally {
                refreshPromise = null;
            }
        }

        return Promise.reject(error);
    },
);

export default api;
