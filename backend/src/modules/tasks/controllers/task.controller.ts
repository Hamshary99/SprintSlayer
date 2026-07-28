import { taskService, TaskService } from "../services/task.service.js";
import { Request, Response, NextFunction } from "express";

export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    createTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Always derive creatorId from the authenticated session, never from req.body
            req.body.creatorId = req.user!.id;
            const task = await this.taskService.createTask(req.body, req.user!.id);
            res.status(201).json(task);
        } catch (err) {
            next(err);
        }
    }

    updateTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const taskId = Number(req.params.id ?? req.body.id);
            const task = await this.taskService.updateTask(req.user!.id, taskId, req.body);
            res.json(task);
        } catch (err) {
            next(err);
        }
    }

    deleteTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const taskId = Number(req.params.id ?? req.body.id);
            const task = await this.taskService.deleteTask(req.user!.id, taskId);
            res.json(task);
        } catch (err) {
            next(err);
        }
    }

    getTaskById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const taskId = Number(req.params.id ?? req.body.id);
            const isAdmin = req.user!.role === "admin";
            const task = await this.taskService.getTaskById(req.user!.id, taskId, isAdmin);
            res.json(task);
        } catch (err) {
            next(err);
        }
    }

    getTasksByProjectId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const projectId = Number(req.params.projectId ?? req.body.projectId);
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const sortBy = req.query.sortBy as any;
            const sortOrder = req.query.sortOrder as any;
            const isAdmin = req.user!.role === "admin";

            const tasks = await this.taskService.getProjectTasks(
                req.user!.id,
                projectId,
                isAdmin,
                page,
                limit,
                sortBy,
                sortOrder,
            );
            res.json(tasks);
        } catch (err) {
            next(err);
        }
    }

    getTasksByAssigneeId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const assigneeId = Number(req.params.assigneeId ?? req.body.assigneeId ?? req.user!.id);
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const sortBy = req.query.sortBy as any;
            const sortOrder = req.query.sortOrder as any;
            const isAdmin = req.user!.role === "admin";

            const tasks = await this.taskService.getTasksByAssigneeId(
                req.user!.id,
                assigneeId,
                isAdmin,
                page,
                limit,
                sortBy,
                sortOrder,
            );
            res.json(tasks);
        } catch (err) {
            next(err);
        }
    }
}

export const taskController = new TaskController(taskService);