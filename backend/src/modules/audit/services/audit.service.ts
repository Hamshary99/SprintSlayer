import { AuditRepository, CreateAuditLogData, AuditLogFilters } from "../repositories/audit.repository.js";
import fs from "fs";
import path from "path";

export class AuditLogService {
    private repository: AuditRepository;
    private logDir: string;
    private logFilePath: string;

    constructor(repository?: AuditRepository) {
        this.repository = repository || new AuditRepository();
        // Path to gitignored logs directory in backend root
        this.logDir = path.resolve(process.cwd(), "logs");
        this.logFilePath = path.join(this.logDir, "audit.log");
    }

    /**
     * Safely log an audit event to both file system (gitignored) and DB without blocking.
     */
    async log(data: CreateAuditLogData): Promise<void> {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                priority: data.priority,
                action: data.action,
                userId: data.userId || null,
                userEmail: data.userEmail || null,
                path: data.path || null,
                method: data.method || null,
                statusCode: data.statusCode || null,
                details: data.details || null,
            };

            // 1. File output to gitignored logs/audit.log
            this.appendToFile(logEntry).catch((err) => {
                console.error("[AuditLogService] File append failed:", err?.message);
            });

            // 2. Database output (in test or production mode)
            await this.repository.create(data);
        } catch (error) {
            // Never allow logging failure to bubble up or disrupt HTTP response
            if (process.env.NODE_ENV !== 'test') {
                console.error("[AuditLogService] Error saving audit log:", error);
            }
        }
    }

    private async appendToFile(logEntry: Record<string, any>): Promise<void> {
        try {
            if (!fs.existsSync(this.logDir)) {
                await fs.promises.mkdir(this.logDir, { recursive: true });
            }
            const line = JSON.stringify(logEntry) + "\n";
            await fs.promises.appendFile(this.logFilePath, line, "utf8");
        } catch (err) {
            // Silence file system permission / write errors
        }
    }

    async getAuditLogs(filters: AuditLogFilters) {
        return this.repository.findAll(filters);
    }
}
