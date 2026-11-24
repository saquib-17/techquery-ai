import { Router } from "express";
import { collectionController } from "./collection.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

const router = Router();

// All collection routes require authentication
router.use(requireAuth);

router.post("/", collectionController.create);
router.get("/", collectionController.list);
router.get("/:id", collectionController.getById);
router.patch("/:id", collectionController.update);
router.delete("/:id", collectionController.delete);
router.post("/:id/items", collectionController.addItem);
router.delete("/:id/items/:questionId", collectionController.removeItem);
router.get("/:id/export/pdf", collectionController.exportPdf);

export const collectionRoutes = router;
