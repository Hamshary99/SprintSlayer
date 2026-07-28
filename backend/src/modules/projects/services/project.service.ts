import { ProjectRepository, ProjectSortField, SortOrder } from "../repositories/project.repository.js";
import type {
  CreateProjectDto,
  UpdateProjectDto,
  RemoveProjectMemberDto,
  AddProjectMemberDto,
} from "../dto/project.dto.js";
import { AppError } from "../../../common/error/AppError.js";
import { UserRepository } from "../../users/repositories/user.repository.js";

export class ProjectService {
  private projectRepository = new ProjectRepository();
  private userRepository = new UserRepository();

  /**
   * Helper method to verify that the user is an admin.
   * If a projectId is provided, it also verifies that the user is the owner of the project.
   */
  private async checkAdminAndOwnership(userId: number, projectId?: number) {
    // 1. Check if user is an admin
    const user = await this.userRepository.findById(userId);
    if (user[0].role !== "admin") {
      throw new AppError("Only admins can perform this action", 403);
    }

    // 2. If checking an existing project, check if the admin is also the owner
    if (projectId) {
      const project = await this.projectRepository.getProjectById(projectId);
      if (project.length === 0) {
        throw new AppError("Project not found", 404);
      }
      if (project[0].ownerId !== userId) {
        throw new AppError("You are not the owner of this project", 403);
      }
    }
  }

  /**
   * Helper to check if a user is an admin.
   */
  private async isAdmin(userId: number): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user.length > 0 && user[0].role === "admin";
  }

  /**
   * Helper to verify that a user is a member of (or owner of) a project.
   * Admins bypass this check.
   */
  private async checkMembership(userId: number, projectId: number) {
    // Admins can access any project
    if (await this.isAdmin(userId)) {
      return;
    }

    const membership = await this.projectRepository.getProjectMemberByProjectIdAndUserId(
      projectId,
      userId,
    );
    if (membership.length === 0) {
      throw new AppError("You are not a member of this project", 403);
    }
  }

  async createProject(project: CreateProjectDto) {
    // Only admins can create projects
    await this.checkAdminAndOwnership(project.ownerId);
    const newProject = await this.projectRepository.createProject(project);
    await this.projectRepository.addMemberToProject({
        projectId: newProject[0].id,
        userId: project.ownerId,
    });
    return newProject;
  }

  async addMemberToProject(projectMember: AddProjectMemberDto, requesterId: number) {
    // Only the admin owner can add members
    await this.checkAdminAndOwnership(requesterId, projectMember.projectId);

    // 1. Check if user exists in the system
    const isUserInSystem = await this.userRepository.findById(projectMember.userId);
    if (isUserInSystem.length === 0) {
      throw new AppError("User does not exist in the system", 404);
    }

    // 2. Check if project exists
    const project = await this.projectRepository.getProjectById(projectMember.projectId);
    if (project.length === 0) {
      throw new AppError("Project not found", 404);
    }

    // 3. Check if member already exists in the project
    const existingMember = await this.projectRepository.getProjectMemberByProjectIdAndUserId(
      projectMember.projectId,
      projectMember.userId
    );
    if (existingMember.length > 0) {
      throw new AppError("Member already exists in the project", 400);
    }
    
    return this.projectRepository.addMemberToProject(projectMember);
  }

  async updateProject(projectId: number, project: UpdateProjectDto, requesterId: number) {
    // Only the admin owner can update the project
    await this.checkAdminAndOwnership(requesterId, projectId);
    return this.projectRepository.updateProject(projectId, project);
  }

  async deleteProject(projectId: number, requesterId: number) {
    // 1. Check if project exists
    const existingProject = await this.projectRepository.getProjectById(projectId);
    if (existingProject.length === 0) {
      return [];
    }

    // Only the admin owner can delete the project
    await this.checkAdminAndOwnership(requesterId, projectId);
    return this.projectRepository.deleteProject(projectId);
  }

  async deleteMemberFromProject(
    projectMember: RemoveProjectMemberDto,
    removerId: number,
  ) {
    // 1. Check if the user being removed exists in the system
    const isUserInSystem = await this.userRepository.findById(projectMember.userId);
    if (isUserInSystem.length === 0) {
      return [];
    }

    // 2. Check if project exists
    const project = await this.projectRepository.getProjectById(projectMember.projectId);
    if (project.length === 0) {
      return [];
    }

    // Only the admin owner can remove members
    await this.checkAdminAndOwnership(removerId, projectMember.projectId);

    // 3. Check if member exists in the project
    const existingMember =
      await this.projectRepository.getProjectMemberByProjectIdAndUserId(
        projectMember.projectId,
        projectMember.userId,
      );
    if (existingMember.length === 0) {
      return [];
    }

    return this.projectRepository.deleteMemberFromProject(projectMember);
  }

  async getProjectById(projectId: number, requesterId: number) {
    const project = await this.projectRepository.getProjectById(projectId);
    if (project.length === 0) {
      throw new AppError("Project not found", 404);
    }

    // Verify the requester is a member of this project
    await this.checkMembership(requesterId, projectId);

    return project;
  }

  async getMyProjects(
    requesterId: number,
    page = 1,
    limit = 10,
    sortBy?: ProjectSortField,
    sortOrder?: SortOrder,
    search?: string,
  ) {
    const args: any[] = [page, limit];
    if (sortBy !== undefined || sortOrder !== undefined || search !== undefined) {
      args.push(sortBy, sortOrder);
      if (search !== undefined) {
        args.push(search);
      }
    }

    // Admins see all projects
    if (await this.isAdmin(requesterId)) {
      return (this.projectRepository.getAllProjects as any)(...args);
    }
    return (this.projectRepository.getProjectsByMemberId as any)(requesterId, ...args);
  }

  async getMembersOfProject(projectId: number, requesterId: number, page = 1, limit = 10) {
    // Verify the project exists
    const project = await this.projectRepository.getProjectById(projectId);
    if (project.length === 0) {
      throw new AppError("Project not found", 404);
    }

    // Verify the requester is a member of this project
    await this.checkMembership(requesterId, projectId);

    return this.projectRepository.getProjectMemberByProjectId(projectId, page, limit);
  }
}

export const projectService = new ProjectService();
