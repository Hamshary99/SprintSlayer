import { projectService, ProjectService } from "../services/project.service.js";
import { Request, Response, NextFunction } from "express";

class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
  
  createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerId = req.body.ownerId || req.user!.id;
      const body = {title: req.body.title, description: req.body.description, ownerId}
      const project = await this.projectService.createProject(
        body
      );
      res.json(project);
    } catch (err) {
      next(err);
    }
  };

  addMemberToProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = { ...req.body, projectId: Number(req.params.projectId) };
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
      const project = await this.projectService.updateProject(
        Number(req.params.id),
        req.body,
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
      const payload = { ...req.body, projectId: Number(req.params.projectId) };
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
   * Returns all projects the authenticated user is a member of (paginated).
   * Query params: ?page=1&limit=10
   */
  getMyProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

      const projects = await this.projectService.getMyProjects(
        req.user!.id,
        page,
        limit,
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
