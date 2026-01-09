import express from "express";
import {
  createBug,
  getBugs,
  getBugById,
  saveProgress,
  resolveBug,
  undoLastProgress
} from "../controllers/bugController.js";

import {
  validateCreateBug,
  validateProgress,
  validateResolution
} from "../middlewares/validate.js";

const router = express.Router();

router.post("/", validateCreateBug, createBug);
router.get("/", getBugs);
router.get("/:id", getBugById);
router.post("/:id/progress", validateProgress, saveProgress);
router.post("/:id/undo", undoLastProgress);
router.post("/:id/resolve", validateResolution, resolveBug);

export default router;
