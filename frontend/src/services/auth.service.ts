import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types';
import api, { refreshSession } from './api';

export const authService = {
    register: (data: RegisterRequest) =>
        api.post<AuthResponse>('/auth/register', data),

    login: (data: LoginRequest) =>
        api.post<AuthResponse>('/auth/login', data),

    logout: () =>
        api.post('/auth/logout'),

    refresh: refreshSession,

    forgotPassword: (email: string) =>
        api.post<{ message: string }>('/auth/forgot-password', { email }),

    resetPassword: (token: string, newPassword: string) =>
        api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),
};
