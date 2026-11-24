import { Router } from "express";
import { usageController } from "./usage.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

export const usageRoutes: Router = Router();

// All usage routes require authentication
usageRoutes.use(requireAuth);

usageRoutes.get("/quotas", usageController.getQuotas);
usageRoutes.patch("/tier", usageController.updateTier);
