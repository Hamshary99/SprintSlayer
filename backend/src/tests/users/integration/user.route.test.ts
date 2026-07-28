import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.config.js";

/* ── Mocks ────────────────────────────────────────────────────────────── */

const mockUserService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    deleteUser: jest.fn(),
    revokeTokenFromUser: jest.fn(),
};

jest.unstable_mockModule("../../../modules/users/services/user.service.js", () => ({
    userService: mockUserService,
    UserService: jest.fn(),
}));

/* ── Dynamic Imports ──────────────────────────────────────────────────── */

const { default: userRouter } = await import("../../../modules/users/routes/user.route.js");
const { errorHandler } = await import("../../../common/middlewares/errorHandler.js");

/* ── App Setup ────────────────────────────────────────────────────────── */

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/users", userRouter);
app.use(errorHandler as express.ErrorRequestHandler);

/* ── Helpers ──────────────────────────────────────────────────────────── */

const generateTestToken = (payload: any) => {
    return jwt.sign(payload, env.ACCESS_SECRET, { expiresIn: "1h" });
};

const adminToken = generateTestToken({ id: 100, role: "admin", email: "admin@test.com" });
const memberToken = generateTestToken({ id: 101, role: "member", email: "member@test.com" });

const FAKE_USER = { id: 1, email: "integration@test.com" };

/* ── Test Suites ──────────────────────────────────────────────────────── */

beforeEach(() => {
    jest.clearAllMocks();
});

describe("User Routes Integration Tests", () => {
    describe("Authentication (requireAuth)", () => {
        it("should return 401 on /api/users without token", async () => {
            const res = await request(app).get("/api/users");
            expect(res.status).toBe(401);
            expect(mockUserService.findAll).not.toHaveBeenCalled();
        });
    });

    describe("GET /api/users", () => {
        it("should call findAll and return 200", async () => {
            mockUserService.findAll.mockResolvedValue([FAKE_USER]);

            const res = await request(app)
                .get("/api/users?page=1&limit=10")
                .set("Cookie", [`access_token=${memberToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockUserService.findAll).toHaveBeenCalledWith(1, 10, undefined);
        });
    });

    describe("GET /api/users/:id", () => {
        it("should call findById and return 200", async () => {
            mockUserService.findById.mockResolvedValue([FAKE_USER]);

            const res = await request(app)
                .get("/api/users/1")
                .set("Cookie", [`access_token=${memberToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockUserService.findById).toHaveBeenCalledWith(1);
        });
    });

    describe("PATCH /api/users/:id", () => {
        it("should call update and return 200", async () => {
            mockUserService.update.mockResolvedValue([FAKE_USER]);

            const res = await request(app)
                .patch("/api/users/101")
                .set("Cookie", [`access_token=${memberToken}`])
                .send({ name: "Updated Name" });
            
            expect(res.status).toBe(200);
            expect(mockUserService.update).toHaveBeenCalledWith(101, { name: "Updated Name" });
        });
    });

    describe("DELETE /api/users/:id", () => {
        it("should return 403 if user is not admin", async () => {
            const res = await request(app)
                .delete("/api/users/1")
                .set("Cookie", [`access_token=${memberToken}`]);
            
            expect(res.status).toBe(403);
            expect(mockUserService.deleteUser).not.toHaveBeenCalled();
        });

        it("should call deleteUser and return 200 for admin", async () => {
            mockUserService.deleteUser.mockResolvedValue([FAKE_USER]);

            const res = await request(app)
                .delete("/api/users/1")
                .set("Cookie", [`access_token=${adminToken}`]);
            
            expect(res.status).toBe(200);
            expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
        });
    });
});
