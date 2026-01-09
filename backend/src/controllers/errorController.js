import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadErrors, loadErrorById } from "../services/errorLoader.js";
import { validateErrorDefinition } from "../utils/validateErrorDefinition.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const errorsPath = path.join(__dirname, "../data/errors");

export const getErrors = (req, res) => {
  res.json(loadErrors());
};

export const getErrorById = (req, res) => {
  const error = loadErrorById(req.params.id);
  if (!error) {
    return res.status(404).json({ message: "Error not found" });
  }
  res.json(error);
};

export const deleteError = async (req, res) => {
  try {
    const { errorId } = req.params;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const filePath = path.join(__dirname, "../data/errors", `${errorId}.json`);

    console.log("Resolved path:", filePath);
    console.log("Exists:", fs.existsSync(filePath));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Error file not found",
        filePath,
      });
    }

    fs.unlinkSync(filePath);

    res.json({ message: "Error deleted successfully" });
  } catch (err) {
    console.error("Delete error failed:", err);
    res.status(500).json({ message: "Failed to delete error" });
  }
};

export const createError = (req, res) => {
  const data = req.body;

  if (!data.errorId || !data.nodes || !data.resolutions) {
    return res.status(400).json({
      message: "Invalid error definition",
    });
  }

  if (!validateErrorDefinition(data)) {
    return res.status(400).json({
      message: "Invalid error definition structure",
    });
  }

  const filePath = path.join(errorsPath, `${data.errorId}.json`);

  if (fs.existsSync(filePath)) {
    return res.status(400).json({ message: "Error already exists" });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.status(201).json({ message: "Error created" });
};
