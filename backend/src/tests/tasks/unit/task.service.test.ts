/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TaskService Unit Tests (ESM Mode)
 *
 *  • Focuses on business logic, project ownership, and membership verification.
 *  • TaskRepository and ProjectRepository are mocked using jest.unstable_mockModule.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { jest } from "@jest/globals";

/* ── Module-level mocks for ESM ───────────────────────────────────────── */

const mockTaskRepo = {
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getTaskById: jest.fn(),
    getTasksByProjectId: jest.fn(),
    getTasksByAssigneeId: jest.fn(),
};

const mockProjectRepo = {
    getProjectById: jest.fn(),
    getProjectMemberByProjectIdAndUserId: jest.fn(),
};

jest.unstable_mockModule(
    "../../../modules/tasks/repositories/task.repository.js",
    () => ({
        TaskRepository: jest.fn().mockImplementation(() => mockTaskRepo),
    })
);

jest.unstable_mockModule(
    "../../../modules/projects/repositories/project.repository.js",
    () => ({
        ProjectRepository: jest.fn().mockImplementation(() => mockProjectRepo),
    })
);

/* ── Dynamic Imports (MUST be after unstable_mockModule) ──────────────── */

const { TaskService } = await import(
    "../../../modules/tasks/services/task.service.js"
);
const { AppError } = await import("../../../common/error/AppError.js");

/* ── Fake data ────────────────────────────────────────────────────────── */

const FAKE_PROJECT = {
    id: 1,
    title: "SprintSlayer",
    ownerId: 100, // Admin/Owner ID
};

const FAKE_TASK = {
    id: 10,
    title: "Test Task",
    projectId: 1,
    creatorId: 100,
    assigneeId: 101,
};

/* ── Test suites ──────────────────────────────────────────────────────── */

let service: InstanceType<typeof TaskService>;

beforeEach(() => {
    jest.clearAllMocks();
    service = new TaskService();
});

describe("TaskService.createTask()", () => {
    it("should create a task successfully if user owns the project", async () => {
        mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
        mockTaskRepo.createTask.mockResolvedValue([{ ...FAKE_TASK, id: 11 }]);

        const input = { title: "Test Task", projectId: 1, priority: "high", status: "todo" } as any;
        const result = await service.createTask(input, 100);

        expect(result).toEqual([{ ...FAKE_TASK, id: 11 }]);
        expect(input.creatorId).toBe(100);
        expect(mockTaskRepo.createTask).toHaveBeenCalledWith(input);
    });

    it("should throw 403 if user does not own the project", async () => {
        mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]); // ownerId = 100

        const input = { title: "Test Task", projectId: 1 } as any;
        
        await expect(service.createTask(input, 101)).rejects.toThrow(
            new AppError("You are not the owner of this project", 403)
        );
        expect(mockTaskRepo.createTask).not.toHaveBeenCalled();
    });

    it("should throw 404 if project does not exist", async () => {
        mockProjectRepo.getProjectById.mockResolvedValue([]);

        const input = { title: "Test Task", projectId: 999 } as any;

        await expect(service.createTask(input, 100)).rejects.toThrow(
            new AppError("Project not found", 404)
        );
    });
});

describe("TaskService.updateTask()", () => {
    it("should update a task successfully if user owns the project", async () => {
        mockTaskRepo.getTaskById.mockResolvedValue([FAKE_TASK]);
        mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
        mockTaskRepo.updateTask.mockResolvedValue([{ ...FAKE_TASK, title: "Updated" }]);

        const result = await service.updateTask(100, 10, { title: "Updated" } as any);
        expect(result).toEqual([{ ...FAKE_TASK, title: "Updated" }]);
        expect(mockTaskRepo.updateTask).toHaveBeenCalledWith(10, { title: "Updated" });
    });

    it("should throw 404 if task does not exist", async () => {
        mockTaskRepo.getTaskById.mockResolvedValue([]);

        await expect(service.updateTask(100, 999, { title: "Updated" } as any)).rejects.toThrow(
            new AppError("Task not found", 404)
        );
    });

    it("should throw 403 if user does not own the project the task belongs to", async () => {
        mockTaskRepo.getTaskById.mockResolvedValue([FAKE_TASK]);
        mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]); // ownerId = 100

        await expect(service.updateTask(101, 10, { title: "Updated" } as any)).rejects.toThrow(
            new AppError("You are not the owner of this project", 403)
        );
    });
});

describe("TaskService.deleteTask()", () => {
    it("should delete a task successfully if user owns the project", async () => {
        mockTaskRepo.getTaskById.mockResolvedValue([FAKE_TASK]);
        mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
        mockTaskRepo.deleteTask.mockResolvedValue([FAKE_TASK]);

        const result = await service.deleteTask(100, 10);
        expect(result).toEqual([FAKE_TASK]);
        expect(mockTaskRepo.deleteTask).toHaveBeenCalledWith(10);
    });

    it("should throw 403 if user does not own the project", async () => {
        mockTaskRepo.getTaskById.mockResolvedValue([FAKE_TASK]);
        mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);

        await expect(service.deleteTask(101, 10)).rejects.toThrow(
            new AppError("You are not the owner of this project", 403)
        );
    });
});

describe("TaskService.getTaskById()", () => {
    it("should return the task if user is admin (bypasses membership check)", async () => {
        mockTaskRepo.getTaskById.mockResolvedValue([FAKE_TASK]);

        const result = await service.getTaskById(101, 10, true);
        expect(result).toEqual(FAKE_TASK);
        expect(mockProjectRepo.getProjectMemberByProjectIdAndUserId).not.toHaveBeenCalled();
    });

    it("should return the task if user is a member of the project", async () => {
        mockTaskRepo.getTaskById.mockResolvedValue([FAKE_TASK]);
        mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
        mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([{ id: 1 }]); // Membership exists

        const result = await service.getTaskById(101, 10, false);
        expect(result).toEqual(FAKE_TASK);
    });

    it("should throw 403 if user is not a member of the project", async () => {
        mockTaskRepo.getTaskById.mockResolvedValue([FAKE_TASK]);
        mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
        mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([]); // No membership

        await expect(service.getTaskById(102, 10, false)).rejects.toThrow(
            new AppError("You are not a member of this project", 403)
        );
    });
});

describe("TaskService.getProjectTasks()", () => {
    it("should return project tasks if user is admin", async () => {
        mockTaskRepo.getTasksByProjectId.mockResolvedValue([FAKE_TASK]);

        const result = await service.getProjectTasks(100, 1, true);
        expect(result).toEqual([FAKE_TASK]);
        expect(mockProjectRepo.getProjectMemberByProjectIdAndUserId).not.toHaveBeenCalled();
    });

    it("should return project tasks if user is a member", async () => {
        mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
        mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([{ id: 1 }]);
        mockTaskRepo.getTasksByProjectId.mockResolvedValue([FAKE_TASK]);

        const result = await service.getProjectTasks(101, 1, false);
        expect(result).toEqual([FAKE_TASK]);
    });
});

describe("TaskService.getTasksByAssigneeId()", () => {
    it("should allow admin to view anyone's tasks", async () => {
        mockTaskRepo.getTasksByAssigneeId.mockResolvedValue([FAKE_TASK]);

        const result = await service.getTasksByAssigneeId(100, 101, true);
        expect(result).toEqual([FAKE_TASK]);
    });

    it("should allow member to view their own tasks", async () => {
        mockTaskRepo.getTasksByAssigneeId.mockResolvedValue([FAKE_TASK]);

        const result = await service.getTasksByAssigneeId(101, 101, false);
        expect(result).toEqual([FAKE_TASK]);
    });

    it("should throw 403 if member tries to view another user's tasks", async () => {
        await expect(service.getTasksByAssigneeId(101, 102, false)).rejects.toThrow(
            new AppError("You can only view your own tasks", 403)
        );
    });
});
