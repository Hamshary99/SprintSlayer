import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.config.js";
import { AppError } from "../../../common/error/AppError.js";

/* ── Mocks ────────────────────────────────────────────────────────────── */

const mockAuthService = {
    refreshAccessToken: jest.fn(),
};

const mockUserService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    revokeTokenFromUser: jest.fn(),
};

jest.unstable_mockModule("../../../modules/auth/services/auth.service.js", () => ({
    authService: mockAuthService,
    AuthService: jest.fn(),
}));

jest.unstable_mockModule("../../../modules/users/services/user.service.js", () => ({
    userService: mockUserService,
    UserService: jest.fn(),
}));

/* ── Dynamic Imports ──────────────────────────────────────────────────── */

const { default: authRouter } = await import("../../../modules/auth/routes/auth.route.js");
const { errorHandler } = await import("../../../common/middlewares/errorHandler.js");

/* ── App Setup ────────────────────────────────────────────────────────── */

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use(errorHandler as express.ErrorRequestHandler);

/* ── Helpers ──────────────────────────────────────────────────────────── */

const generateTestToken = (payload: any) => {
    return jwt.sign(payload, env.ACCESS_SECRET, { expiresIn: "1h" });
};

const userToken = generateTestToken({ id: 100, role: "member", email: "user@test.com" });

/* ── Test Suites ──────────────────────────────────────────────────────── */

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Auth Routes Integration Tests", () => {
    describe("POST /api/auth/register", () => {
        it("should call userService.create and return 201", async () => {
            mockUserService.create.mockResolvedValue({
                userData: { id: 1, email: "test@test.com" },
                accessToken: "acc",
                refreshToken: "ref",
            });

            const res = await request(app)
                .post("/api/auth/register")
                .send({ name: "Test", email: "test@test.com", passwordHash: "Password123" });
            
            expect(res.status).toBe(201);
            expect(res.body.user.email).toBe("test@test.com");
            expect(mockUserService.create).toHaveBeenCalled();
        });
    });

    describe("POST /api/auth/login", () => {
        it("should call userService.findByEmail and return 200", async () => {
            mockUserService.findByEmail.mockResolvedValue({
                userData: { id: 1, email: "test@test.com" },
                accessToken: "acc",
                refreshToken: "ref",
            });

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "test@test.com", passwordHash: "Password123" });
            
            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe("test@test.com");
            expect(mockUserService.findByEmail).toHaveBeenCalled();
        });
    });

    describe("POST /api/auth/refresh", () => {
        it("should call authService.refreshAccessToken when refresh_token is present", async () => {
            mockAuthService.refreshAccessToken.mockResolvedValue({
                userData: { id: 1, email: "test@test.com" },
                accessToken: "new_acc",
                refreshToken: "new_ref",
            });

            const res = await request(app)
                .post("/api/auth/refresh")
                .set("Cookie", ["refresh_token=old_ref"]);
            
            expect(res.status).toBe(200);
            expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith("old_ref");
        });

        it("should return 401 if refresh_token cookie is missing", async () => {
            const res = await request(app).post("/api/auth/refresh");
            expect(res.status).toBe(401);
            expect(mockAuthService.refreshAccessToken).not.toHaveBeenCalled();
        });
    });

    describe("POST /api/auth/logout", () => {
        it("should return 401 if access token is missing (requireAuth fails)", async () => {
            const res = await request(app).post("/api/auth/logout");
            expect(res.status).toBe(401);
        });

        it("should clear tokens and call revokeTokenFromUser if auth passes", async () => {
            mockUserService.revokeTokenFromUser.mockResolvedValue(true);

            const res = await request(app)
                .post("/api/auth/logout")
                .set("Cookie", [`access_token=${userToken}`, `refresh_token=active_ref`]);
            
            expect(res.status).toBe(200);
            expect(mockUserService.revokeTokenFromUser).toHaveBeenCalledWith(100, "active_ref");
        });
    });
});
