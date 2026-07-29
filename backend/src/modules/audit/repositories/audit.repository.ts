import { db } from "../../../config/db.config.js";
import { auditLogs } from "../schemas/audit.schema.js";
import { eq, and, desc } from "drizzle-orm";

export interface CreateAuditLogData {
    priority: "HIGH" | "MEDIUM" | "LOW";
    action: string;
    userId?: number | null;
    userEmail?: string | null;
    ipAddress?: string | null;
    path?: string | null;
    method?: string | null;
    statusCode?: number | null;
    details?: string | null;
}

export interface AuditLogFilters {
    page?: number;
    limit?: number;
    priority?: string;
    action?: string;
    userId?: number;
}

export class AuditRepository {
    async create(data: CreateAuditLogData) {
        return db.insert(auditLogs).values(data as any).returning();
    }

    async findAll(filters: AuditLogFilters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;

        const conditions = [];
        if (filters.priority) {
            conditions.push(eq(auditLogs.priority, filters.priority));
        }
        if (filters.action) {
            conditions.push(eq(auditLogs.action, filters.action));
        }
        if (filters.userId) {
            conditions.push(eq(auditLogs.userId, filters.userId));
        }

        const query = db.select().from(auditLogs);
        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        return query
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit)
            .offset((page - 1) * limit);
    }
}
