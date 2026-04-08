import express from "express";
import taskRoute from "./routes/tasksRouters.js";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

const app = express();

// middlewares
app.use(express.json());

const corsOriginEnv = process.env.CORS_ORIGIN || "";
const devDefaultOrigins =
  process.env.NODE_ENV !== "production"
    ? ["http://localhost:5173", "http://127.0.0.1:5173"]
    : [];

const allowedOrigins = [
  ...devDefaultOrigins,
  ...corsOriginEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
];

if (allowedOrigins.length > 0) {
  app.use(
    cors({
      origin(origin, cb) {
        // allow non-browser clients (no Origin header)
        if (!origin) return cb(null, true);
        // dev: allow any Vite port on localhost/127.0.0.1 (5173, 5174, ...)
        if (
          process.env.NODE_ENV !== "production" &&
          /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
        ) {
          return cb(null, true);
        }
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked origin: ${origin}`));
      },
    }),
  );
}

app.use("/api/tasks", taskRoute);
app.use("/api/auth", authRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});
