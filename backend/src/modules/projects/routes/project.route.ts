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
router.get("/:id", projectController.getProjectById);
router.get("/owner/:ownerId", projectController.getProjectsByOwnerId);
router.get("/member/:memberId", projectController.getProjectsByMemberId);
router.get("/members/:projectId", projectController.getMembersOfProject);

export default router;
