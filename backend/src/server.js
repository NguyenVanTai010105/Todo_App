import express from "express";
import taskRoute from "./routes/tasksRouters.js";
import authRoutes from "./routes/authRoutes.js";
import activitiesRoutes from "./routes/activitiesRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import { stripeWebhook } from "./controller/billingController.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

function resolveFrontendDistPath() {
  const candidates = [
    // repo root layout
    path.join(projectRoot, "frontend", "dist"),
    // if server started from backend/ as cwd
    path.resolve(process.cwd(), "..", "frontend", "dist"),
    // some deployments build dist at root
    path.join(projectRoot, "dist"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(path.join(p, "index.html"))) return p;
  }

  // fallback to default candidate for debugging/health endpoint
  return candidates[0];
}

const frontendDistPath = resolveFrontendDistPath();
const frontendIndexPath = path.join(frontendDistPath, "index.html");

const app = express();

app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

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
        // production: allow same-site Render domains by default
        if (
          process.env.NODE_ENV === "production" &&
          /^https?:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)
        ) {
          return cb(null, true);
        }
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked origin: ${origin}`));
      },
    }),
  );
} else if (process.env.NODE_ENV !== "production") {
  // dev fallback if user didn't set CORS_ORIGIN
  app.use(cors({ origin: true }));
}

app.use("/api/tasks", taskRoute);
app.use("/api/auth", authRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/stats", statsRoutes);

app.get("/api/health", (req, res) => {
  const distExists = fs.existsSync(frontendDistPath);
  const indexExists = fs.existsSync(frontendIndexPath);
  let distFiles = [];
  try {
    if (distExists) distFiles = fs.readdirSync(frontendDistPath).slice(0, 50);
  } catch {
    distFiles = [];
  }
  res.status(200).json({
    ok: true,
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    frontendDistPath,
    distExists,
    indexExists,
    distFiles,
  });
});

if (process.env.NODE_ENV === "production") {
  // Serve static assets; don't auto-serve index.html here
  app.use(express.static(frontendDistPath, { index: false }));

  // SPA fallback: only for non-API routes without file extensions
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    if (/\.[a-z0-9]+$/i.test(req.path)) {
      return res.status(404).end();
    }
    return res.sendFile(frontendIndexPath);
  });
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});
