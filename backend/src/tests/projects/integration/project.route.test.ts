import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.config.js";

/* ── Mocks ────────────────────────────────────────────────────────────── */

const mockProjectService = {
    createProject: jest.fn(),
    addMemberToProject: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    deleteMemberFromProject: jest.fn(),
    getMyProjects: jest.fn(),
    getProjectById: jest.fn(),
    getMembersOfProject: jest.fn(),
};

jest.unstable_mockModule("../../../modules/projects/services/project.service.js", () => ({
    projectService: mockProjectService,
    ProjectService: jest.fn(),
}));

/* ── Dynamic Imports ──────────────────────────────────────────────────── */

const { default: projectRouter } = await import("../../../modules/projects/routes/project.route.js");
const { errorHandler } = await import("../../../common/middlewares/errorHandler.js");

/* ── App Setup ────────────────────────────────────────────────────────── */

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/projects", projectRouter);
app.use(errorHandler as express.ErrorRequestHandler);

/* ── Helpers ──────────────────────────────────────────────────────────── */

const generateTestToken = (payload: any) => {
    return jwt.sign(payload, env.ACCESS_SECRET, { expiresIn: "1h" });
};

const userToken = generateTestToken({ id: 100, role: "member", email: "user@test.com" });

const FAKE_PROJECT = { id: 1, title: "Integration Project" };

/* ── Test Suites ──────────────────────────────────────────────────────── */

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Project Routes Integration Tests", () => {
    describe("Authentication (requireAuth)", () => {
        it("should return 401 on /api/projects without token", async () => {
            const res = await request(app).post("/api/projects").send({ title: "New" });
            expect(res.status).toBe(401);
            expect(mockProjectService.createProject).not.toHaveBeenCalled();
        });
    });

    describe("Mutating Routes", () => {
        it("POST /api/projects - should call createProject", async () => {
            mockProjectService.createProject.mockResolvedValue([FAKE_PROJECT]);

            const res = await request(app)
                .post("/api/projects")
                .set("Cookie", [`access_token=${userToken}`])
                .send({ title: "New" });
            
            expect(res.status).toBe(200);
            expect(mockProjectService.createProject).toHaveBeenCalled();
        });

        it("POST /api/projects/add-member - should call addMemberToProject", async () => {
            mockProjectService.addMemberToProject.mockResolvedValue([{ id: 1 }]);

            const res = await request(app)
                .post("/api/projects/add-member")
                .set("Cookie", [`access_token=${userToken}`])
                .send({ projectId: 1, userId: 2 });
            
            expect(res.status).toBe(200);
            expect(mockProjectService.addMemberToProject).toHaveBeenCalledWith(
                { projectId: 1, userId: 2 },
                100 // extracted from userToken payload
            );
        });

        it("PUT /api/projects/:id - should call updateProject", async () => {
            mockProjectService.updateProject.mockResolvedValue([FAKE_PROJECT]);

            const res = await request(app)
                .put("/api/projects/1")
                .set("Cookie", [`access_token=${userToken}`])
                .send({ id: 1, title: "Updated" });
            
            expect(res.status).toBe(200);
            expect(mockProjectService.updateProject).toHaveBeenCalledWith(1, { id: 1, title: "Updated" }, 100);
        });

        it("DELETE /api/projects/:id - should call deleteProject", async () => {
            mockProjectService.deleteProject.mockResolvedValue([FAKE_PROJECT]);

            const res = await request(app)
                .delete("/api/projects/1")
                .set("Cookie", [`access_token=${userToken}`])
                .send({ id: 1 });
            
            expect(res.status).toBe(200);
            expect(mockProjectService.deleteProject).toHaveBeenCalledWith(1, 100);
        });

        it("DELETE /api/projects/remove-member - should call deleteMemberFromProject", async () => {
            mockProjectService.deleteMemberFromProject.mockResolvedValue([{ id: 1 }]);

            const res = await request(app)
                .delete("/api/projects/remove-member")
                .set("Cookie", [`access_token=${userToken}`])
                .send({ projectId: 1, userId: 2 });
            
            expect(res.status).toBe(200);
            expect(mockProjectService.deleteMemberFromProject).toHaveBeenCalledWith({ projectId: 1, userId: 2 }, 100);
        });
    });

    describe("Read Routes", () => {
        it("GET /api/projects/my-projects - should call getMyProjects", async () => {
            mockProjectService.getMyProjects.mockResolvedValue([FAKE_PROJECT]);

            const res = await request(app)
                .get("/api/projects/my-projects?page=1&limit=10")
                .set("Cookie", [`access_token=${userToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockProjectService.getMyProjects).toHaveBeenCalledWith(100, 1, 10);
        });

        it("GET /api/projects/:id - should call getProjectById", async () => {
            mockProjectService.getProjectById.mockResolvedValue([FAKE_PROJECT]);

            const res = await request(app)
                .get("/api/projects/1")
                .set("Cookie", [`access_token=${userToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockProjectService.getProjectById).toHaveBeenCalledWith(1, 100);
        });

        it("GET /api/projects/members/:projectId - should call getMembersOfProject", async () => {
            mockProjectService.getMembersOfProject.mockResolvedValue([{ userId: 100 }]);

            const res = await request(app)
                .get("/api/projects/members/1")
                .set("Cookie", [`access_token=${userToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockProjectService.getMembersOfProject).toHaveBeenCalledWith(1, 100, 1, 10);
        });
    });
});
