import { Router } from "express";
import { answerController } from "./answer.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

const router = Router();

// All answer routes are protected by authentication
router.use(requireAuth);

router.post("/generate", answerController.generate);
router.post("/", answerController.generate);
router.get("/:questionId", answerController.getByQuestionId);
router.delete("/:questionId", answerController.delete);

export const answerRoutes = router;
