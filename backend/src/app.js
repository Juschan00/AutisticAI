import express from "express";
import cors from "cors";
import dotenv from "dotenv";


import locationsRoutes from "./routes/locations.js";
import reviewsRoutes from "./routes/reviews.js";
import profilesRoutes from "./routes/profiles.js";
import rankingsRoutes from "./routes/rankings.js";
import aiRoutes from "./routes/ai.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ status: 'SensorySafe backend running' });
});

app.use("/locations", locationsRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/profiles", profilesRoutes);
app.use("/rankings", rankingsRoutes);
app.use("/ai", aiRoutes);
app.use("/upload", uploadRoutes);

export default app;