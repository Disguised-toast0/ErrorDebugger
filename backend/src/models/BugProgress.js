import mongoose from "mongoose";

const BugProgressSchema = new mongoose.Schema(
  {
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: "Bug" },
    nodeId: String,
    answer: String
  },
  { timestamps: true }
);

export const BugProgress = mongoose.model(
  "BugProgress",
  BugProgressSchema
);
