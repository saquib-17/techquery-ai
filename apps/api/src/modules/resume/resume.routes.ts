import { Router } from "express";
import multer from "multer";
import { resumeController } from "./resume.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";
import { config } from "../../core/config/index.js";

const router: Router = Router();

// Configure memory storage multer with 5MB ceiling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_FILE_SIZE_BYTES, // 5MB
    files: 1,
  },
});

router.use(requireAuth);

router.post("/", upload.single("file"), resumeController.upload);
router.get("/", resumeController.list);
router.get("/:id", resumeController.getById);
router.get("/:id/download", resumeController.download);
router.patch("/:id/primary", resumeController.setPrimary);
router.delete("/:id", resumeController.delete);
router.post("/:id/analyze", resumeController.analyze);
router.get("/:id/analysis", resumeController.getAnalysis);
router.get("/:id/parsed-data", resumeController.getParsedData);

export const resumeRoutes = router;
