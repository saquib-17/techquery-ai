import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth.middleware.js";
import { codingController } from "./coding.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/problems", codingController.listProblems);
router.get("/problems/:id", codingController.getProblemById);
router.post("/problems/generate", codingController.generateProblem);
router.post("/run", codingController.runCode);

export const codingRoutes = router;
