import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth.middleware.js";
import { assessmentController } from "./assessment.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/active", assessmentController.getActive);
router.get("/history", assessmentController.history);
router.post("/", assessmentController.start);
router.get("/:id", assessmentController.getById);
router.put("/:id/draft", assessmentController.saveDraft);
router.post("/:id/finish", assessmentController.finish);
router.post("/:id/cancel", assessmentController.cancel);
router.delete("/:sessionId", assessmentController.deleteSession);
router.delete("/", assessmentController.clearHistory);

export const assessmentRoutes = router;
