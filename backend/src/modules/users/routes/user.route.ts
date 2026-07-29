import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { requireAuth } from "../../../common/middlewares/requireAuth.js";
import { requireRole } from "../../../common/middlewares/requireRole.js";

const router = Router();

router.get("/", requireAuth, userController.getAll);
router.get("/:id", requireAuth, userController.getById);
router.patch("/:id", requireAuth, userController.updateUser);
router.patch("/:id/password", requireAuth, userController.updatePassword);
router.delete("/:id", requireAuth, userController.deleteUser);

export default router;
