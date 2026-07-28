import { TaskRepository, TaskSortField, SortOrder } from "../repositories/task.repository.js";
import { CreateTaskDto, UpdateTaskDto } from "../dto/task.dto.js";
import { ProjectRepository } from "../../projects/repositories/project.repository.js";
import { AppError } from "../../../common/error/AppError.js";

export class TaskService {
    private taskRepository = new TaskRepository();
    private projectRepository = new ProjectRepository();

    // ─── Private Helpers ────────────────────────────────────────────────────────

    /**
     * Verifies the requester owns the project.
     */
    private async checkProjectOwnership(requesterId: number, projectId: number) {
        const projectRes = await this.projectRepository.getProjectById(projectId);
        const project = projectRes[0];
        if (!project) throw new AppError("Project not found", 404);
        if (project.ownerId !== requesterId) {
            throw new AppError("You are not the owner of this project", 403);
        }
    }

    /**
     * Verifies the requester is a member of the project.
     * Used for read-only operations.
     */
    private async checkProjectMembership(requesterId: number, projectId: number) {
        const projectRes = await this.projectRepository.getProjectById(projectId);
        if (!projectRes[0]) throw new AppError("Project not found", 404);

        const memberRes = await this.projectRepository.getProjectMemberByProjectIdAndUserId(
            projectId,
            requesterId,
        );
        if (memberRes.length === 0) {
            throw new AppError("You are not a member of this project", 403);
        }
    }

    // ─── Mutating Operations (admin-gated at route, ownership checked here) ───

    async createTask(taskData: CreateTaskDto, requesterId: number) {
        await this.checkProjectOwnership(requesterId, taskData.projectId);
        // creatorId is always the authenticated user — never trust the client body
        taskData.creatorId = requesterId;
        return this.taskRepository.createTask(taskData);
    }

    async updateTask(requesterId: number, taskId: number, taskData: UpdateTaskDto) {
        const taskRes = await this.taskRepository.getTaskById(taskId);
        const task = taskRes[0];
        if (!task) throw new AppError("Task not found", 404);

        await this.checkProjectOwnership(requesterId, task.projectId);

        return this.taskRepository.updateTask(taskId, taskData);
    }

    async deleteTask(requesterId: number, taskId: number) {
        const taskRes = await this.taskRepository.getTaskById(taskId);
        const task = taskRes[0];
        if (!task) throw new AppError("Task not found", 404);

        await this.checkProjectOwnership(requesterId, task.projectId);

        return this.taskRepository.deleteTask(taskId);
    }

    // ─── Read Operations ──────────────────────────────────────────────────────

    /**
     * View a single task.
     * Admins: allowed through requireRole middleware without membership check.
     * Members: must belong to the task's project.
     */
    async getTaskById(requesterId: number, taskId: number, isAdmin: boolean) {
        const taskRes = await this.taskRepository.getTaskById(taskId);
        const task = taskRes[0];
        if (!task) throw new AppError("Task not found", 404);

        if (!isAdmin) {
            await this.checkProjectMembership(requesterId, task.projectId);
        }

        return task;
    }

    /**
     * Get all tasks in a project (paginated).
     * Admins: see all tasks (routed through admin-only path, no membership check).
     * Members: only see tasks if they belong to the project.
     */
    async getProjectTasks(
        requesterId: number,
        projectId: number,
        isAdmin: boolean,
        page: number = 1,
        limit: number = 10,
        sortBy?: TaskSortField,
        sortOrder?: SortOrder,
        search?: string,
    ) {
        if (!isAdmin) {
            await this.checkProjectMembership(requesterId, projectId);
        }
        const args: any[] = [projectId, page, limit, sortBy, sortOrder];
        if (search !== undefined) {
            args.push(search);
        }
        return (this.taskRepository.getTasksByProjectId as any)(...args);
    }

    /**
     * Get tasks assigned to a user.
     * Admins: can fetch any user's assigned tasks.
     * Members: can only view their own assigned tasks.
     */
    async getTasksByAssigneeId(
        requesterId: number,
        assigneeId: number,
        isAdmin: boolean,
        page: number = 1,
        limit: number = 10,
        sortBy?: TaskSortField,
        sortOrder?: SortOrder,
        search?: string,
    ) {
        if (!isAdmin && requesterId !== assigneeId) {
            throw new AppError("You can only view your own tasks", 403);
        }

        const args: any[] = [assigneeId, page, limit, sortBy, sortOrder];
        if (search !== undefined) {
            args.push(search);
        }
        return (this.taskRepository.getTasksByAssigneeId as any)(...args);
    }
}

export const taskService = new TaskService();