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
      const projectMember = await this.projectService.addMemberToProject(
        req.body,
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
        req.body.id,
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
        req.body.id,
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
      const projectMember = await this.projectService.deleteMemberFromProject(
        req.body,
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
      );
      res.json(project);
    } catch (err) {
      next(err);
    }
  };

  getProjectsByOwnerId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await this.projectService.getProjectsByOwnerId(
        Number(req.params.ownerId),
      );
      res.json(projects);
    } catch (err) {
      next(err);
    }
  };

  getProjectsByMemberId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await this.projectService.getProjectsByMemberId(
        Number(req.params.memberId),
      );
      res.json(projects);
    } catch (err) {
      next(err);
    }
  };

  getMembersOfProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const members = await this.projectService.getMembersOfProject(
        Number(req.params.projectId),
      );
      res.json(members);
    } catch (err) {
      next(err);
    }
  };
}

export const projectController = new ProjectController(projectService);
