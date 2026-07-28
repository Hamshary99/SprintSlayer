import { pgTable, serial, integer, index } from 'drizzle-orm/pg-core';
import { users } from '../../users/schemas/user.schema.js';
import { project } from './project.schema.js';
import { userRoleEnum } from '../../users/schemas/user.schema.js';

export const projectMembers = pgTable('project_members', {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').notNull().references(() => project.id, {onDelete: 'cascade'}),
    userId: integer('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => {
    return {
        projectMembersIdx: index('idx_project_members_active').on(table.projectId, table.userId),
    }; 
}); 
