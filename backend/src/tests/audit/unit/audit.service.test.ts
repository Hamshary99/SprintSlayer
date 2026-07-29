import { jest } from '@jest/globals';

const mockAuditRepo = {
    create: jest.fn<any>(),
    findAll: jest.fn<any>(),
};

jest.unstable_mockModule("../../../modules/audit/repositories/audit.repository.js", () => ({
    AuditRepository: jest.fn().mockImplementation(() => mockAuditRepo),
}));

const { AuditLogService } = await import("../../../modules/audit/services/audit.service.js");

describe("AuditLogService Unit Tests", () => {
    let auditService: InstanceType<typeof AuditLogService>;

    beforeEach(() => {
        jest.clearAllMocks();
        auditService = new AuditLogService(mockAuditRepo as any);
    });

    describe("log()", () => {
        it("1 — should create an audit log entry for HIGH priority security errors", async () => {
            mockAuditRepo.create.mockResolvedValue([{ id: 1, priority: "HIGH", action: "ACCESS_DENIED" }]);

            const logData = {
                priority: "HIGH" as const,
                action: "ACCESS_DENIED",
                userId: 5,
                path: "/api/project/1",
                method: "DELETE",
                statusCode: 403,
                details: JSON.stringify({ message: "Only admins can delete projects" }),
            };

            await auditService.log(logData);

            expect(mockAuditRepo.create).toHaveBeenCalledWith(logData);
        });

        it("2 — should create an audit log entry for MEDIUM priority domain events", async () => {
            mockAuditRepo.create.mockResolvedValue([{ id: 2, priority: "MEDIUM", action: "PROJECT_CREATE" }]);

            const logData = {
                priority: "MEDIUM" as const,
                action: "PROJECT_CREATE",
                userId: 1,
                details: JSON.stringify({ projectId: 10, title: "New Sprint Project" }),
            };

            await auditService.log(logData);

            expect(mockAuditRepo.create).toHaveBeenCalledWith(logData);
        });

        it("3 — should handle repository error gracefully without crashing", async () => {
            mockAuditRepo.create.mockRejectedValue(new Error("Database connection lost"));

            const logData = {
                priority: "HIGH" as const,
                action: "UNHANDLED_ERROR",
            };

            await expect(auditService.log(logData)).resolves.not.toThrow();
        });
    });

    describe("getAuditLogs()", () => {
        it("4 — should return filtered audit logs from repository", async () => {
            const sampleLogs = [
                { id: 1, priority: "HIGH", action: "ACCESS_DENIED" },
                { id: 2, priority: "MEDIUM", action: "PROJECT_CREATE" },
            ];
            mockAuditRepo.findAll.mockResolvedValue(sampleLogs);

            const filters = { page: 1, limit: 10, priority: "HIGH" };
            const result = await auditService.getAuditLogs(filters);

            expect(mockAuditRepo.findAll).toHaveBeenCalledWith(filters);
            expect(result).toEqual(sampleLogs);
        });
    });
});
