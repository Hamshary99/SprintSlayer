import { projectService, ProjectService } from "../services/project.service.js";
import { Request, Response, NextFunction } from "express";
import { validateBody } from "../../../common/utils/validator.js";
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto, RemoveProjectMemberDto } from "../dto/project.dto.js";

class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
  
  createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerId = req.body.ownerId || req.user!.id;
      const data = await validateBody(CreateProjectDto, { ...req.body, ownerId });
      const project = await this.projectService.createProject(data);
      res.json(project);
    } catch (err) {
      next(err);
    }
  };

  addMemberToProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = await validateBody(AddProjectMemberDto, { ...req.body, projectId: Number(req.params.projectId) });
      const projectMember = await this.projectService.addMemberToProject(
        payload,
        req.user!.id,
      );
      res.json(projectMember);
    } catch (err) {
      next(err);
    }
  };

  updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await validateBody(UpdateProjectDto, req.body);
      const project = await this.projectService.updateProject(
        Number(req.params.id),
        data,
        req.user!.id,
      );
      res.json(project);
    } catch (err) {
      next(err);
    }
  };

  deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await this.projectService.deleteProject(
        Number(req.params.id),
        req.user!.id,
      );
      res.json(project);
    } catch (err) {
      next(err);
    }
  };

  deleteMemberFromProject = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const payload = await validateBody(RemoveProjectMemberDto, { ...req.body, projectId: Number(req.params.projectId) });
      const projectMember = await this.projectService.deleteMemberFromProject(
        payload,
        req.user!.id,
      );
      res.json(projectMember);
    } catch (err) {
      next(err);
    }
  };

  getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await this.projectService.getProjectById(
        Number(req.params.id),
        req.user!.id,
      );
      res.json(project);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Returns all projects the authenticated user is a member of (paginated, sortable, searchable).
   * Query params: ?page=1&limit=10&sortBy=createdAt&sortOrder=desc&search=keyword
   */
  getMyProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const sortBy = req.query.sortBy as any;
      const sortOrder = req.query.sortOrder as any;
      const search = req.query.search as string;

      const projects = await this.projectService.getMyProjects(
        req.user!.id,
        page,
        limit,
        sortBy,
        sortOrder,
        search,
      );
      res.json(projects);
    } catch (err) {
      next(err);
    }
  };

  getMembersOfProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

      const members = await this.projectService.getMembersOfProject(
        Number(req.params.projectId),
        req.user!.id,
        page,
        limit,
      );
      res.json(members);
    } catch (err) {
      next(err);
    }
  };
}

export const projectController = new ProjectController(projectService);
