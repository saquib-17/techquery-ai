import { Router } from "express";
import { matchingController } from "./matching.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

const router: Router = Router();

// Protect all Matching routes with JWT authentication
router.use(requireAuth);

router.post("/", matchingController.create);
router.post("/analyze", matchingController.create); // Alias for API spec compatibility
router.get("/", matchingController.list);
router.get("/:id", matchingController.getById);
router.delete("/:id", matchingController.delete);

export const matchingRoutes = router;
