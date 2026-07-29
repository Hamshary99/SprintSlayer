import { pgTable, serial, varchar, timestamp, integer, text, index } from 'drizzle-orm/pg-core';
import { users } from '../../users/schemas/user.schema.js';

export const auditLogs = pgTable('audit_logs', {
    id: serial('id').primaryKey(),
    priority: varchar('priority', { length: 10 }).notNull(), // 'HIGH' | 'MEDIUM' | 'LOW'
    action: varchar('action', { length: 100 }).notNull(),   // e.g. 'UNHANDLED_ERROR', 'AUTH_FAILURE', 'ACCESS_DENIED', 'PROJECT_CREATE', 'TASK_STATUS_UPDATE'
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    userEmail: varchar('user_email', { length: 255 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    path: varchar('path', { length: 500 }),
    method: varchar('method', { length: 10 }),
    statusCode: integer('status_code'),
    details: text('details'),                              // JSON string containing priority-specific context
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        priorityIdx: index('idx_audit_logs_priority').on(table.priority),
        actionIdx: index('idx_audit_logs_action').on(table.action),
        createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
        userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
    };
});
