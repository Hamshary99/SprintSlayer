import { tasks } from "../schemas/task.schema.js";
import { db } from "../../../config/db.config.js";
import { eq, and, asc, desc, ilike, or } from "drizzle-orm";
import type { CreateTaskDto, UpdateTaskDto } from "../dto/task.dto.js";

export type TaskSortField =
  | "id"
  | "createdAt"
  | "updatedAt"
  | "priority"
  | "status"
  | "dueDate";
export type SortOrder = "asc" | "desc";

const getOrderClause = (
  sortBy: TaskSortField = "createdAt",
  sortOrder: SortOrder = "desc",
) => {
  const column =
    {
      id: tasks.id,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      priority: tasks.priority,
      status: tasks.status,
      dueDate: tasks.dueDate,
    }[sortBy] || tasks.createdAt;

  return sortOrder === "asc" ? asc(column) : desc(column);
};

export class TaskRepository {
  async createTask(taskData: CreateTaskDto) {
    return db
      .insert(tasks)
      .values({
        ...taskData,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      } as any)
      .returning();
  }

  async updateTask(taskId: number, taskData: UpdateTaskDto) {
    const updatePayload = { ...taskData };
    if (updatePayload.dueDate) {
      updatePayload.dueDate = new Date(updatePayload.dueDate) as any;
    }
    return db
      .update(tasks)
      .set(updatePayload as any)
      .where(eq(tasks.id, taskId))
      .returning();
  }

  async deleteTask(taskId: number) {
    return db.delete(tasks).where(eq(tasks.id, taskId)).returning();
  }

  async getTaskById(taskId: number) {
    return db.select().from(tasks).where(eq(tasks.id, taskId));
  }

  async getTasksByProjectId(
    projectId: number,
    page: number = 1,
    limit: number = 10,
    sortBy?: TaskSortField,
    sortOrder?: SortOrder,
    search?: string,
  ) {
    const conditions = [eq(tasks.projectId, projectId)];
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(or(ilike(tasks.title, term), ilike(tasks.description, term))!);
    }

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(getOrderClause(sortBy, sortOrder))
      .limit(limit)
      .offset((page - 1) * limit);
  }

  async getTasksByAssigneeId(
    assigneeId: number,
    page: number = 1,
    limit: number = 10,
    sortBy?: TaskSortField,
    sortOrder?: SortOrder,
    search?: string,
  ) {
    const conditions = [eq(tasks.assigneeId, assigneeId)];
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(or(ilike(tasks.title, term), ilike(tasks.description, term))!);
    }

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(getOrderClause(sortBy, sortOrder))
      .limit(limit)
      .offset((page - 1) * limit);
  }

  async getTasksByCreatorId(
    creatorId: number,
    page: number = 1,
    limit: number = 10,
    sortBy?: TaskSortField,
    sortOrder?: SortOrder,
    search?: string,
  ) {
    const conditions = [eq(tasks.creatorId, creatorId)];
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(or(ilike(tasks.title, term), ilike(tasks.description, term))!);
    }

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(getOrderClause(sortBy, sortOrder))
      .limit(limit)
      .offset((page - 1) * limit);
  }

  async getAllTasks(
    page: number = 1,
    limit: number = 10,
    sortBy?: TaskSortField,
    sortOrder?: SortOrder,
    search?: string,
  ) {
    const conditions = [];
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(or(ilike(tasks.title, term), ilike(tasks.description, term))!);
    }

    let query = db.select().from(tasks);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query
      .orderBy(getOrderClause(sortBy, sortOrder))
      .limit(limit)
      .offset((page - 1) * limit);
  }
}
