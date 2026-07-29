import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.config.js";

/* ── Mocks ────────────────────────────────────────────────────────────── */

const mockAuditLogService = {
    log: jest.fn<any>().mockResolvedValue(undefined),
    getAuditLogs: jest.fn<any>(),
};

const mockAuditController = {
    getLogs: async (req: any, res: any, next: any) => {
        try {
            const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
            const priority = req.query.priority ? String(req.query.priority) : undefined;
            const action = req.query.action ? String(req.query.action) : undefined;
            const userId = req.query.userId ? parseInt(String(req.query.userId), 10) : undefined;

            const logs = await mockAuditLogService.getAuditLogs({
                page,
                limit,
                priority,
                action,
                userId: isNaN(userId!) ? undefined : userId,
            });

            res.status(200).json({ page, limit, logs });
        } catch (error) {
            next(error);
        }
    },
};

jest.unstable_mockModule("../../../modules/audit/controllers/audit.controller.js", () => ({
    auditLogService: mockAuditLogService,
    auditController: mockAuditController,
}));

/* ── Dynamic Imports ──────────────────────────────────────────────────── */

const { default: auditRouter } = await import("../../../modules/audit/routes/audit.route.js");
const { errorHandler } = await import("../../../common/middlewares/errorHandler.js");

/* ── App Setup ────────────────────────────────────────────────────────── */

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/audit-logs", auditRouter);
app.use(errorHandler as express.ErrorRequestHandler);

/* ── Helpers ──────────────────────────────────────────────────────────── */

const makeToken = (role: "admin" | "member" = "admin", id = 1) =>
    jwt.sign({ id, email: `${role}@example.com`, role }, env.ACCESS_SECRET, { expiresIn: "1h" });

describe("Audit Routes Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/audit-logs", () => {
        it("should return 401 if request has no access token", async () => {
            const res = await request(app).get("/api/audit-logs");
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is a member (not admin)", async () => {
            const memberToken = makeToken("member", 2);
            const res = await request(app)
                .get("/api/audit-logs")
                .set("Authorization", `Bearer ${memberToken}`);

            expect(res.status).toBe(403);
        });

        it("should return 200 and audit logs list if user is admin", async () => {
            const adminToken = makeToken("admin", 1);
            const sampleLogs = [
                { id: 1, priority: "HIGH", action: "ACCESS_DENIED", userId: 2 },
                { id: 2, priority: "MEDIUM", action: "PROJECT_CREATE", userId: 1 },
            ];

            mockAuditLogService.getAuditLogs.mockResolvedValue(sampleLogs);

            const res = await request(app)
                .get("/api/audit-logs?priority=HIGH")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.logs).toEqual(sampleLogs);
            expect(mockAuditLogService.getAuditLogs).toHaveBeenCalledWith({
                page: 1,
                limit: 20,
                priority: "HIGH",
                action: undefined,
                userId: undefined,
            });
        });
    });
});
