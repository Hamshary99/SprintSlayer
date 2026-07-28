import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.config.js";

/* ── Mocks ────────────────────────────────────────────────────────────── */

const mockTaskService = {
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getTaskById: jest.fn(),
    getProjectTasks: jest.fn(),
    getTasksByAssigneeId: jest.fn(),
};

jest.unstable_mockModule("../../../modules/tasks/services/task.service.js", () => ({
    taskService: mockTaskService,
    TaskService: jest.fn(),
}));

/* ── Dynamic Imports ──────────────────────────────────────────────────── */

const { default: taskRouter } = await import("../../../modules/tasks/routes/task.route.js");
const { errorHandler } = await import("../../../common/middlewares/errorHandler.js");

/* ── App Setup ────────────────────────────────────────────────────────── */

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/tasks", taskRouter);
app.use(errorHandler as express.ErrorRequestHandler);

/* ── Helpers ──────────────────────────────────────────────────────────── */

const generateTestToken = (payload: any) => {
    return jwt.sign(payload, env.ACCESS_SECRET, { expiresIn: "1h" });
};

const adminToken = generateTestToken({ id: 100, role: "admin", email: "admin@test.com" });
const memberToken = generateTestToken({ id: 101, role: "member", email: "member@test.com" });

const FAKE_TASK = { id: 1, title: "Integration Task" };

/* ── Test Suites ──────────────────────────────────────────────────────── */

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Task Routes Integration Tests", () => {
    describe("POST /api/tasks", () => {
        it("should return 401 if no token provided", async () => {
            const res = await request(app).post("/api/tasks").send({ title: "Task" });
            expect(res.status).toBe(401);
            expect(mockTaskService.createTask).not.toHaveBeenCalled();
        });

        it("should return 403 if user is not admin", async () => {
            const res = await request(app)
                .post("/api/tasks")
                .set("Cookie", [`access_token=${memberToken}`])
                .send({ title: "Task" });
            expect(res.status).toBe(403);
            expect(mockTaskService.createTask).not.toHaveBeenCalled();
        });

        it("should call taskService.createTask and return 201 for admin", async () => {
            mockTaskService.createTask.mockResolvedValue([FAKE_TASK]);

            const res = await request(app)
                .post("/api/tasks")
                .set("Cookie", [`access_token=${adminToken}`])
                .send({ title: "Task", projectId: 1, priority: "high", status: "todo" });
            
            expect(res.status).toBe(201);
            expect(res.body).toEqual([FAKE_TASK]);
            expect(mockTaskService.createTask).toHaveBeenCalled();
        });
    });

    describe("PATCH /api/tasks/:id", () => {
        it("should return 403 if user is not admin", async () => {
            const res = await request(app)
                .patch("/api/tasks/1")
                .set("Cookie", [`access_token=${memberToken}`])
                .send({ title: "Updated" });
            expect(res.status).toBe(403);
        });

        it("should call taskService.updateTask and return 200 for admin", async () => {
            mockTaskService.updateTask.mockResolvedValue([{ ...FAKE_TASK, title: "Updated" }]);

            const res = await request(app)
                .patch("/api/tasks/1")
                .set("Cookie", [`access_token=${adminToken}`])
                .send({ title: "Updated" });
            
            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ ...FAKE_TASK, title: "Updated" }]);
            expect(mockTaskService.updateTask).toHaveBeenCalledWith(100, 1, { title: "Updated" });
        });
    });

    describe("DELETE /api/tasks/:id", () => {
        it("should return 403 if user is not admin", async () => {
            const res = await request(app)
                .delete("/api/tasks/1")
                .set("Cookie", [`access_token=${memberToken}`]);
            expect(res.status).toBe(403);
        });

        it("should call taskService.deleteTask and return 200 for admin", async () => {
            mockTaskService.deleteTask.mockResolvedValue([FAKE_TASK]);

            const res = await request(app)
                .delete("/api/tasks/1")
                .set("Cookie", [`access_token=${adminToken}`]);
            
            expect(res.status).toBe(200);
            expect(res.body).toEqual([FAKE_TASK]);
            expect(mockTaskService.deleteTask).toHaveBeenCalledWith(100, 1);
        });
    });

    describe("GET /api/tasks/:id", () => {
        it("should call getTaskById with isAdmin=true for admin", async () => {
            mockTaskService.getTaskById.mockResolvedValue(FAKE_TASK);

            const res = await request(app)
                .get("/api/tasks/1")
                .set("Cookie", [`access_token=${adminToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockTaskService.getTaskById).toHaveBeenCalledWith(100, 1, true);
        });

        it("should call getTaskById with isAdmin=false for member", async () => {
            mockTaskService.getTaskById.mockResolvedValue(FAKE_TASK);

            const res = await request(app)
                .get("/api/tasks/1")
                .set("Cookie", [`access_token=${memberToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockTaskService.getTaskById).toHaveBeenCalledWith(101, 1, false);
        });
    });

    describe("GET /api/tasks/project/:projectId", () => {
        it("should parse query params and call getProjectTasks correctly", async () => {
            mockTaskService.getProjectTasks.mockResolvedValue([FAKE_TASK]);

            const res = await request(app)
                .get("/api/tasks/project/5?page=2&limit=20&sortBy=title&sortOrder=asc")
                .set("Cookie", [`access_token=${memberToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockTaskService.getProjectTasks).toHaveBeenCalledWith(
                101, 5, false, 2, 20, "title", "asc"
            );
        });
    });

    describe("GET /api/tasks/assignee/:assigneeId", () => {
        it("should parse query params and call getTasksByAssigneeId correctly", async () => {
            mockTaskService.getTasksByAssigneeId.mockResolvedValue([FAKE_TASK]);

            const res = await request(app)
                .get("/api/tasks/assignee/101?page=1&limit=10")
                .set("Cookie", [`access_token=${memberToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockTaskService.getTasksByAssigneeId).toHaveBeenCalledWith(
                101, 101, false, 1, 10, undefined, undefined
            );
        });
    });
});
