import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types';
import api from './api';

export const authService = {
    register: (data: RegisterRequest) =>
        api.post<AuthResponse>('/auth/register', data),

    login: (data: LoginRequest) =>
        api.post<AuthResponse>('/auth/login', data),

    logout: () =>
        api.post('/auth/logout'),

    refresh: () =>
        api.post<AuthResponse>('/auth/refresh'),
};
