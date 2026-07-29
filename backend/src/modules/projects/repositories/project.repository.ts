import { project } from "../schemas/project.schema.js";
import { projectMembers } from "../schemas/project.members.schema.js";
import { users } from "../../users/schemas/user.schema.js";
import { db } from "../../../config/db.config.js";
import { eq, and, asc, desc, ilike, or } from "drizzle-orm";
import type { CreateProjectDto, UpdateProjectDto, RemoveProjectMemberDto, AddProjectMemberDto } from "../dto/project.dto.js";

export type ProjectSortField = "id" | "title" | "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

const getOrderClause = (
    sortBy: ProjectSortField = "createdAt",
    sortOrder: SortOrder = "desc"
) => {
    const column =
        {
            id: project.id,
            title: project.title,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        }[sortBy] || project.createdAt;

    return sortOrder === "asc" ? asc(column) : desc(column);
};

export class ProjectRepository {
    async createProject(projectData: CreateProjectDto) {
        return db.insert(project).values(projectData).returning();
    }
    async addMemberToProject(projectMemberData: AddProjectMemberDto) {
        return db.insert(projectMembers).values(projectMemberData).returning();
    }
    async updateProject(projectId:number, projectData: UpdateProjectDto) {
        return db.update(project).set(projectData).where(eq(project.id, projectId)).returning();
    }
    async deleteProject(projectId:number) {
        return db.delete(project).where(eq(project.id, projectId)).returning();
    }
    async deleteMemberFromProject(projectMemberData: RemoveProjectMemberDto) {
        return db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectMemberData.projectId), eq(projectMembers.userId, projectMemberData.userId))).returning();
    }
    async getProjectById(projectId: number) {
        return db
            .select({
                id: project.id,
                title: project.title,
                description: project.description,
                ownerId: project.ownerId,
                ownerName: users.name,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            })
            .from(project)
            .innerJoin(users, eq(project.ownerId, users.id))
            .where(eq(project.id, projectId));
    }
    async getProjectsByOwnerId(
        ownerId: number,
        page: number = 1,
        limit: number = 10,
        sortBy?: ProjectSortField,
        sortOrder?: SortOrder,
        search?: string
    ) {
        const conditions = [eq(project.ownerId, ownerId)];
        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            conditions.push(or(ilike(project.title, term), ilike(project.description, term))!);
        }

        return db
            .select({
                id: project.id,
                title: project.title,
                description: project.description,
                ownerId: project.ownerId,
                ownerName: users.name,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            })
            .from(project)
            .innerJoin(users, eq(project.ownerId, users.id))
            .where(and(...conditions))
            .orderBy(getOrderClause(sortBy, sortOrder))
            .limit(limit)
            .offset((page - 1) * limit);
    }
    async getProjectsByMemberId(
        memberId: number,
        page: number = 1,
        limit: number = 10,
        sortBy?: ProjectSortField,
        sortOrder?: SortOrder,
        search?: string
    ) {
        const conditions = [eq(projectMembers.userId, memberId)];
        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            conditions.push(or(ilike(project.title, term), ilike(project.description, term))!);
        }

        return db
            .select({
                id: project.id,
                title: project.title,
                description: project.description,
                ownerId: project.ownerId,
                ownerName: users.name,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            })
            .from(project)
            .innerJoin(projectMembers, eq(project.id, projectMembers.projectId))
            .innerJoin(users, eq(project.ownerId, users.id))
            .where(and(...conditions))
            .orderBy(getOrderClause(sortBy, sortOrder))
            .limit(limit)
            .offset((page - 1) * limit);
    }

    async getAllProjects(
        page: number = 1,
        limit: number = 10,
        sortBy?: ProjectSortField,
        sortOrder?: SortOrder,
        search?: string
    ) {
        const conditions = [];
        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            conditions.push(or(ilike(project.title, term), ilike(project.description, term))!);
        }

        let query = db
            .select({
                id: project.id,
                title: project.title,
                description: project.description,
                ownerId: project.ownerId,
                ownerName: users.name,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            })
            .from(project)
            .innerJoin(users, eq(project.ownerId, users.id)) as any;
        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        return query
            .orderBy(getOrderClause(sortBy, sortOrder))
            .limit(limit)
            .offset((page - 1) * limit);
    }

    async getProjectMemberByProjectId(projectId: number, page: number = 1, limit: number = 10) {
        return db.select({
            userId: users.id,
            email: users.email,
            role: users.role,
            membershipId: projectMembers.id
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, projectId))
        .limit(limit)
        .offset((page - 1) * limit);
    }

    async getProjectMemberByProjectIdAndUserId(projectId: number, userId: number) {
        return db.select({
            userId: users.id,
            email: users.email,
            role: users.role,
            membershipId: projectMembers.id
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
    }
}