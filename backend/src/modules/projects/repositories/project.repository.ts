import { project } from "../schemas/project.schema.js";
import { projectMembers } from "../schemas/project.members.schema.js";
import { users } from "../../users/schemas/user.schema.js";
import { db } from "../../../config/db.config.js";
import { eq, and } from "drizzle-orm";
import type { CreateProjectDto, UpdateProjectDto, RemoveProjectMemberDto, AddProjectMemberDto } from "../dto/project.dto.js";

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
        return db.select().from(project).where(eq(project.id, projectId));
    }
    async getProjectsByOwnerId(ownerId: number, page: number, limit: number) {
        return db.select().from(project).where(eq(project.ownerId, ownerId)).limit(limit).offset((page - 1) * limit);
    }
    async getProjectsByMemberId(memberId: number, page: number, limit: number) {
        return db.select({
            id: project.id,
            title: project.title,
            description: project.description,
            ownerId: project.ownerId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        })
        .from(project)
        .innerJoin(projectMembers, eq(project.id, projectMembers.projectId))
        .where(eq(projectMembers.userId, memberId))
        .limit(limit)
        .offset((page - 1) * limit);
    }

    async getProjectMemberByProjectId(projectId: number, page: number, limit: number) {
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