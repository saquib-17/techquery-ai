import { Router } from "express";
import { jobDescriptionController } from "./job-description.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

const router: Router = Router();

// Protect all Job Description routes with JWT authentication
router.use(requireAuth);

router.post("/", jobDescriptionController.create);
router.get("/", jobDescriptionController.list);
router.get("/:id", jobDescriptionController.getById);
router.post("/:id/reanalyze", jobDescriptionController.reanalyze);
router.delete("/:id", jobDescriptionController.delete);

export const jobDescriptionRoutes = router;
