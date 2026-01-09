import mongoose from "mongoose";

const BugResolutionSchema = new mongoose.Schema(
  {
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: "Bug" },
    resolutionId: String,
    notes: String
  },
  { timestamps: true }
);

export const BugResolution = mongoose.model(
  "BugResolution",
  BugResolutionSchema
);
