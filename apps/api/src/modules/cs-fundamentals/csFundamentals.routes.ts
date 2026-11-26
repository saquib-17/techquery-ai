import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth.middleware.js";
import { csFundamentalsController } from "./csFundamentals.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", csFundamentalsController.getSheet);
router.put("/:topicSlug/progress", csFundamentalsController.updateProgress);
router.post(
  "/:topicSlug/walkthrough",
  csFundamentalsController.generateWalkthrough
);

export const csFundamentalsRoutes = router;
