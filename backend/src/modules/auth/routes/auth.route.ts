import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../../../common/middlewares/requireAuth.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", requireAuth, authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/reset-password", authController.renderResetPasswordForm);

export default router;
