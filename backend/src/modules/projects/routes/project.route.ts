import { Router } from "express";
import { projectController } from "../controllers/project.controller.js";
import { requireAuth } from "../../../common/middlewares/requireAuth.js";
const router = Router();

router.post("/", requireAuth, projectController.createProject);
router.post("/:projectId/members", requireAuth, projectController.addMemberToProject);
router.patch("/:id", requireAuth, projectController.updateProject);
router.delete("/:projectId/members", requireAuth, projectController.deleteMemberFromProject);
router.delete("/:id", requireAuth, projectController.deleteProject);
router.get("/my-projects", requireAuth, projectController.getMyProjects);
router.get("/:id", requireAuth, projectController.getProjectById);
router.get("/members/:projectId", requireAuth, projectController.getMembersOfProject);

export default router;
