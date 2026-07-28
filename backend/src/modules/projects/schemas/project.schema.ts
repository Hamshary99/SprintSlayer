import { pgTable, serial, varchar, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { users } from '../../users/schemas/user.schema.js';

export const project = pgTable('project', {
    id: serial('id').primaryKey(),      
    title: varchar('title', { length: 255 }).notNull(),
    description: varchar('description', { length: 1024 }),
    ownerId: integer('owner_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
    return {
        ownerIdIdx: index('idx_project_owner_id').on(table.ownerId),
    };
}); 