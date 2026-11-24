import { Router } from "express";
import { questionController } from "./question.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

const router = Router();

// All question routes are protected
router.use(requireAuth);

router.post("/generate", questionController.generate);
router.post("/", questionController.generate);
router.get("/", questionController.list);
router.get("/:id", questionController.getById);
router.get("/:id/export/pdf", questionController.exportPdf);
router.delete("/:id", questionController.delete);

export const questionRoutes = router;
