import { Router } from "express";
import { authController } from "./auth.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

const router: Router = Router();

// Registration & Verification routes
router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);

// Authentication & Session routes
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", requireAuth, authController.logoutAll);

export const authRoutes = router;
