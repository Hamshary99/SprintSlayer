import { Router } from "express";
import { projectController } from "../controllers/project.controller.js";
import { requireAuth } from "../../../common/middlewares/requireAuth.js";
const router = Router();

router.post("/", requireAuth, projectController.createProject);
router.post("/add-member", requireAuth, projectController.addMemberToProject);
router.put("/:id", requireAuth, projectController.updateProject);
router.delete("/:id", requireAuth, projectController.deleteProject);
router.delete(
  "/remove-member",
  requireAuth,
  projectController.deleteMemberFromProject,
);
router.get("/my-projects", requireAuth, projectController.getMyProjects);
router.get("/:id", requireAuth, projectController.getProjectById);
router.get("/members/:projectId", requireAuth, projectController.getMembersOfProject);

export default router;
