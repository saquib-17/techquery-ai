import { Router } from "express";
import { candidateController } from "./candidate.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

const profileRouter: Router = Router();
profileRouter.use(requireAuth);

profileRouter.get("/", candidateController.getProfile);
profileRouter.post("/", candidateController.createProfile);
profileRouter.patch("/", candidateController.updateProfile);

export const profileRoutes = profileRouter;

const onboardingRouter: Router = Router();
onboardingRouter.use(requireAuth);

onboardingRouter.get("/", candidateController.getOnboarding);
onboardingRouter.patch("/", candidateController.updateOnboarding);

export const onboardingRoutes = onboardingRouter;
