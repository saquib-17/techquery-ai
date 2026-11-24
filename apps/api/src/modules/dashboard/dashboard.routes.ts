import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

export const dashboardRoutes: Router = Router();

// All dashboard routes require authentication
dashboardRoutes.use(requireAuth);

dashboardRoutes.get("/summary", dashboardController.getSummary);
