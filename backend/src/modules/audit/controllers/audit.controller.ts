import { Request, Response, NextFunction } from "express";
import { AuditLogService } from "../services/audit.service.js";

export class AuditController {
    private auditService: AuditLogService;

    constructor(auditService: AuditLogService) {
        this.auditService = auditService;
        this.getLogs = this.getLogs.bind(this);
    }

    async getLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
            const priority = req.query.priority ? String(req.query.priority) : undefined;
            const action = req.query.action ? String(req.query.action) : undefined;
            const userId = req.query.userId ? parseInt(String(req.query.userId), 10) : undefined;

            const logs = await this.auditService.getAuditLogs({
                page,
                limit,
                priority,
                action,
                userId: isNaN(userId!) ? undefined : userId,
            });

            res.status(200).json({
                page,
                limit,
                logs,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const auditLogService = new AuditLogService();
export const auditController = new AuditController(auditLogService);
