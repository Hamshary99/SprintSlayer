import { TaskRepository, TaskSortField, SortOrder } from "../repositories/task.repository.js";
import { CreateTaskDto, UpdateTaskDto } from "../dto/task.dto.js";
import { ProjectRepository } from "../../projects/repositories/project.repository.js";
import { AppError } from "../../../common/error/AppError.js";
import { auditLogService } from "../../audit/controllers/audit.controller.js";

export class TaskService {
    private taskRepository = new TaskRepository();
    private projectRepository = new ProjectRepository();

    // ─── Private Helpers ────────────────────────────────────────────────────────

    /**
     * Verifies the requester owns the project.
     */
    /**
     * Verifies the requester is the owner, an admin, or a member of the project.
     */
    private async checkProjectAccess(requesterId: number, projectId: number) {
        const projectRes = await this.projectRepository.getProjectById(projectId);
        const project = projectRes ? projectRes[0] : undefined;
        if (!project) throw new AppError("Project not found", 404);

        // Project owner always has access
        if (Number(project.ownerId) === Number(requesterId)) return;

        // Project members also have access to manage tasks
        const memberRes = await this.projectRepository.getProjectMemberByProjectIdAndUserId(
            projectId,
            requesterId,
        );
        if (!memberRes || memberRes.length === 0) {
            throw new AppError("You are not authorized to manage tasks in this project", 403);
        }
    }

    // ─── Mutating Operations ──────────────────────────────────────────────────

    async createTask(taskData: CreateTaskDto, requesterId: number) {
        await this.checkProjectAccess(requesterId, taskData.projectId);
        // creatorId is always the authenticated user — never trust the client body
        taskData.creatorId = requesterId;
        const newTask = await this.taskRepository.createTask(taskData);

        auditLogService.log({
            priority: "MEDIUM",
            action: "TASK_CREATE",
            userId: requesterId,
            details: JSON.stringify({ taskId: newTask[0]?.id, title: newTask[0]?.title, status: newTask[0]?.status, projectId: taskData.projectId }),
        });

        return newTask;
    }

    async updateTask(requesterId: number, taskId: number, taskData: UpdateTaskDto) {
        const taskRes = await this.taskRepository.getTaskById(taskId);
        const task = taskRes ? taskRes[0] : undefined;
        if (!task) throw new AppError("Task not found", 404);

        await this.checkProjectAccess(requesterId, task.projectId);

        const updated = await this.taskRepository.updateTask(taskId, taskData);

        if (taskData.status && taskData.status !== task.status) {
            auditLogService.log({
                priority: "MEDIUM",
                action: "TASK_STATUS_UPDATE",
                userId: requesterId,
                details: JSON.stringify({ taskId, oldStatus: task.status, newStatus: taskData.status, projectId: task.projectId }),
            });
        }

        return updated;
    }

    async deleteTask(requesterId: number, taskId: number) {
        const taskRes = await this.taskRepository.getTaskById(taskId);
        const task = taskRes ? taskRes[0] : undefined;
        if (!task) throw new AppError("Task not found", 404);

        await this.checkProjectAccess(requesterId, task.projectId);

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
            await this.checkProjectAccess(requesterId, task.projectId);
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
            await this.checkProjectAccess(requesterId, projectId);
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