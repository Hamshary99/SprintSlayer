import type { PaginationParams, User } from '@/types';
import api from './api';

export const userService = {
    getAll: (params?: PaginationParams) =>
        api.get<{ users: User[] }>('/user', { params }),

    getById: (id: number) =>
        api.get<{ user: User }>(`/user/${id}`),

    update: (id: number, data: Partial<Pick<User, 'email' | 'name' | 'role'>>) =>
        api.patch<{ user: User }>(`/user/${id}`, data),

    updatePassword: (id: number, currentPassword: string, newPassword: string) =>
        api.patch(`/user/${id}/password`, { currentPassword, newPassword }),

    delete: (id: number) =>
        api.delete(`/user/${id}`),
};
