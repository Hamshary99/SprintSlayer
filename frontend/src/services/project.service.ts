import type {
    CreateProjectRequest,
    PaginationParams,
    Project,
    ProjectMember,
    UpdateProjectRequest,
} from '@/types';
import api from './api';

export const projectService = {
    getMyProjects: (params?: PaginationParams) =>
        api.get<Project[]>('/project/my-projects', { params }),

    getById: (id: number) =>
        api.get<Project[]>(`/project/${id}`),

    create: (data: CreateProjectRequest) =>
        api.post<Project[]>('/project', data),

    update: (id: number, data: UpdateProjectRequest) =>
        api.patch<Project[]>(`/project/${id}`, data),

    delete: (id: number) =>
        api.delete<Project[]>(`/project/${id}`),

    getMembers: (projectId: number, params?: PaginationParams) =>
        api.get<ProjectMember[]>(`/project/members/${projectId}`, { params }),

    addMember: (projectId: number, userId: number) =>
        api.post(`/project/${projectId}/members`, { userId }),

    removeMember: (projectId: number, userId: number) =>
        api.delete(`/project/${projectId}/members`, { data: { userId } }),
};
