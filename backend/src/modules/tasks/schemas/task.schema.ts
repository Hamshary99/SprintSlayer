import { boolean, integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "../../users/schemas/user.schema.js";
import { project } from "../../projects/schemas/project.schema.js";

export const taskPriorityEnum = pgEnum("priority", ["high", "medium", "low"]);

export const taskStatusEnum = pgEnum("status", [
  "to_do",
  "in_progress",
  "done",
]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default('to_do'),
  priority: taskPriorityEnum("priority").notNull().default('medium'),
  dueDate: timestamp("due_date"),
  creatorId: integer("creator_id").notNull().references(() => users.id, {onDelete: 'cascade'}),
  assigneeId: integer("assignee_id").references(() => users.id, {onDelete: 'set null'}),
  projectId: integer("project_id").notNull().references(() => project.id, {onDelete: 'cascade'}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});