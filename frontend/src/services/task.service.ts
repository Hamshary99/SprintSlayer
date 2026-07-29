import type { CreateTaskRequest, PaginationParams, Task, UpdateTaskRequest } from '@/types';
import api from './api';

export const taskService = {
    getByProject: (projectId: number, params?: PaginationParams) =>
        api.get<Task[]>(`/task/project/${projectId}`, { params }),

    getByAssignee: (assigneeId: number, params?: PaginationParams) =>
        api.get<Task[]>(`/task/assignee/${assigneeId}`, { params }),

    getById: (id: number) =>
        api.get<Task>(`/task/${id}`),

    create: (data: CreateTaskRequest) =>
        api.post<Task[]>('/task', data),

    update: (id: number, data: UpdateTaskRequest) =>
        api.patch<Task[]>(`/task/${id}`, data),

    delete: (id: number) =>
        api.delete<Task[]>(`/task/${id}`),
};
