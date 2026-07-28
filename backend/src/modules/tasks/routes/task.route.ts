import { Router } from "express";
import { taskController } from "../controllers/task.controller.js";
import { requireAuth } from "../../../common/middlewares/requireAuth.js";
import { requireRole } from "../../../common/middlewares/requireRole.js";

const taskRouter = Router();

// ─── Mutating routes — must be admin ─────────────────────────────────────────
// requireRole('admin') ensures only admins reach the controller.
// The service then further checks that the admin owns the project.
taskRouter.post("/", requireAuth, requireRole("admin"), taskController.createTask);
taskRouter.patch("/:id", requireAuth, requireRole("admin"), taskController.updateTask);
taskRouter.delete("/:id", requireAuth, requireRole("admin"), taskController.deleteTask);

// ─── Read routes — any authenticated user ────────────────────────────────────
// The service checks membership for non-admins.
// Admins bypass the membership check (isAdmin flag forwarded from controller).
taskRouter.get("/:id", requireAuth, taskController.getTaskById);
taskRouter.get("/project/:projectId", requireAuth, taskController.getTasksByProjectId);
taskRouter.get("/assignee/:assigneeId", requireAuth, taskController.getTasksByAssigneeId);

export default taskRouter;