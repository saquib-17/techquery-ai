import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth.middleware.js";
import { aiTutorController } from "./aiTutor.controller.js";

const router = Router();

router.use(requireAuth);
router.post("/chat", aiTutorController.chat);

export const aiTutorRoutes = router;
