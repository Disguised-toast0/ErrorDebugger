import express from "express";
import cors from "cors";

import errorRoutes from "./routes/errorRoutes.js";
import bugRoutes from "./routes/bugRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/errors", errorRoutes);
app.use("/api/bugs", bugRoutes);

app.use(errorHandler);

export default app;
