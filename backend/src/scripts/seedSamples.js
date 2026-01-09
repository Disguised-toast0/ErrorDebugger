import mongoose from "mongoose";
import dotenv from "dotenv";
import { Bug } from "../models/Bug.js";
import { BugProgress } from "../models/BugProgress.js";
import { BugResolution } from "../models/BugResolution.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

await Bug.deleteMany({ isSample: true });
await BugProgress.deleteMany({});
await BugResolution.deleteMany({});

const samples = [
  {
    errorType: "ERR_503",
    status: "RESOLVED",
    isSample: true
  },
  {
    errorType: "ERR_503",
    status: "OPEN",
    isSample: true
  }
];

await Bug.insertMany(samples);

console.log("Sample bugs seeded");
process.exit();
