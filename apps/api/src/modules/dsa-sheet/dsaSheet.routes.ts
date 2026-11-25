import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth.middleware.js";
import { dsaSheetController } from "./dsaSheet.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", dsaSheetController.getSheet);
router.put("/:problemSlug/progress", dsaSheetController.updateProgress);
router.post("/:problemSlug/walkthrough", dsaSheetController.generateWalkthrough);

export const dsaSheetRoutes = router;
