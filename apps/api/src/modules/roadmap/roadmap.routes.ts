import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth.middleware.js";
import { roadmapController } from "./roadmap.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", roadmapController.listRoadmaps);
router.post("/generate", roadmapController.generateRoadmap);
router.patch("/:roadmapId/tasks", roadmapController.toggleTask);
router.delete("/:roadmapId", roadmapController.deleteRoadmap);

export const roadmapRoutes = router;
