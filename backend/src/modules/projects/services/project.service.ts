import { ProjectRepository } from "../repositories/project.repository.js";
import type {
  CreateProjectDto,
  UpdateProjectDto,
  RemoveProjectMemberDto,
  AddProjectMemberDto,
  DeleteProjectDto,
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

  async deleteProject(project: DeleteProjectDto, requesterId: number) {
    // 1. Check if project exists
    const existingProject = await this.projectRepository.getProjectById(project.id);
    if (existingProject.length === 0) {
      return [];
    }

    // Only the admin owner can delete the project
    await this.checkAdminAndOwnership(requesterId, project.id);
    return this.projectRepository.deleteProject(project.id);
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

  async getProjectById(projectId: number) {
    return this.projectRepository.getProjectById(projectId);
  }
  async getProjectsByOwnerId(ownerId: number, page = 1, limit = 10) {
    return this.projectRepository.getProjectsByOwnerId(ownerId, page, limit);
  }
  async getProjectsByMemberId(memberId: number, page = 1, limit = 10) {
    return this.projectRepository.getProjectsByMemberId(memberId, page, limit);
  }

  async getMembersOfProject(projectId: number, page = 1, limit = 10) {
    return this.projectRepository.getProjectMemberByProjectId(projectId, page, limit);
  }
}

export const projectService = new ProjectService();
