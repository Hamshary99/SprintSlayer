// ─── Types matching the backend API contract ─────────────────────────────

export interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'member';
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Project {
    id: number;
    title: string;
    description: string | null;
    ownerId: number;
    ownerName?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectMember {
    userId: number;
    email: string;
    role: string;
    membershipId: number;
}

export interface Task {
    id: number;
    title: string;
    description: string | null;
    status: 'to_do' | 'in_progress' | 'done';
    priority: 'high' | 'medium' | 'low';
    dueDate: string | null;
    creatorId: number;
    assigneeId: number | null;
    projectId: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Request DTOs ────────────────────────────────────────────────────────

export interface RegisterRequest {
    email: string;
    passwordHash: string; // plain-text password — backend hashes it
    name: string;
    role?: 'admin' | 'member';
}

export interface LoginRequest {
    email: string;
    passwordHash: string;
}

export interface CreateProjectRequest {
    title: string;
    description?: string;
}

export interface UpdateProjectRequest {
    title?: string;
    description?: string;
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    status?: 'to_do' | 'in_progress' | 'done';
    priority?: 'high' | 'medium' | 'low';
    dueDate?: string;
    assigneeId?: number;
    projectId: number;
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: 'to_do' | 'in_progress' | 'done';
    priority?: 'high' | 'medium' | 'low';
    dueDate?: string;
    assigneeId?: number;
}

// ─── Pagination ──────────────────────────────────────────────────────────

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

// ─── API Response shapes ─────────────────────────────────────────────────

export interface AuthResponse {
    user: User;
}

export interface ErrorResponse {
    status: 'error';
    message: string;
}
