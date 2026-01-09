import express from "express";
import {
  getErrors,
  getErrorById,
  createError,
  deleteError,
} from "../controllers/errorController.js";
import { adminOnly } from "../middlewares/adminOnly.js";

const router = express.Router();

router.get("/", getErrors);
router.get("/:id", getErrorById);
router.post("/", adminOnly, createError);
router.delete("/:errorId", adminOnly, deleteError);

export default router;
  