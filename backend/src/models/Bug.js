import mongoose from "mongoose";

const BugSchema = new mongoose.Schema(
  {
    errorType: { type: String, required: true },
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED"],
      default: "OPEN"
    },
    assignedTo: String,
    isSample: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Bug = mongoose.model("Bug", BugSchema);
