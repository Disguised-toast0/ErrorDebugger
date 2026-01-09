import { Bug } from "../models/Bug.js";
import { BugProgress } from "../models/BugProgress.js";
import { BugResolution } from "../models/BugResolution.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const createBug = asyncHandler(async (req, res) => {
  const bug = await Bug.create(req.body);
  res.status(201).json(bug);
});

export const getBugs = asyncHandler(async (req, res) => {
  const bugs = await Bug.find().sort({ createdAt: -1 });
  res.json(bugs);
});

export const getBugById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bug = await Bug.findById(id);
  if (!bug) {
    const err = new Error("Bug not found");
    err.statusCode = 404;
    throw err;
  }

  const progress = await BugProgress.find({ bugId: id }).sort({
    createdAt: 1
  });

  const resolution = await BugResolution.findOne({ bugId: id });

  res.json({ bug, progress, resolution });
});

export const saveProgress = asyncHandler(async (req, res) => {
  const { nodeId } = req.body;

  const existing = await BugProgress.findOne({
    bugId: req.params.id,
    nodeId
  });

  if (existing) {
    const err = new Error("Node already answered");
    err.statusCode = 400;
    throw err;
  }

  const progress = await BugProgress.create({
    bugId: req.params.id,
    ...req.body
  });

  res.json(progress);
});

export const undoLastProgress = asyncHandler(async (req, res) => {
  const last = await BugProgress.findOne({ bugId: req.params.id }).sort({
    createdAt: -1
  });

  if (!last) {
    return res.status(400).json({ message: "No progress to undo" });
  }

  await last.deleteOne();
  await BugResolution.deleteMany({ bugId: req.params.id });

  res.json({ message: "Last step removed" });
});

export const resolveBug = asyncHandler(async (req, res) => {
  await Bug.findByIdAndUpdate(req.params.id, {
    status: "RESOLVED"
  });

  const resolution = await BugResolution.create({
    bugId: req.params.id,
    ...req.body
  });

  res.json(resolution);
});
