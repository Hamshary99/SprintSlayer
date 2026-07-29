import { Router } from "express";
import { auditController } from "../controllers/audit.controller.js";
import { requireAuth } from "../../../common/middlewares/requireAuth.js";
import { requireRole } from "../../../common/middlewares/requireRole.js";

const router = Router();

// GET /api/audit-logs — Admin access only
router.get("/", requireAuth, requireRole("admin"), auditController.getLogs);

export default router;
