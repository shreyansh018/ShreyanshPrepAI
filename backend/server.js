import "./load-env.js";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import mongoose from "mongoose";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));

// Dynamic imports make sure load-env.js has run before modules that create
// Redis/Groq/Firebase clients at import time.
const [
  redisModule,
  authRouterModule,
  resumeRouterModule,
  interviewRouterModule,
  roadmapRouterModule,
  billingRouterModule,
  isAuthModule,
  userControllerModule,
] = await Promise.all([
  import("./shared/redis/redis.js"),
  import("./services/auth/routes/auth.route.js"),
  import("./services/resume/routes/resume.route.js"),
  import("./services/interview/routes/interview.route.js"),
  import("./services/roadmap/routes/roadmap.route.js"),
  import("./services/billing/routes/billing.route.js"),
  import("./gateway/middleware/isAuth.js"),
  import("./gateway/controllers/user.controller.js"),
]);

const redis = redisModule.default;
const authRouter = authRouterModule.default;
const resumeRouter = resumeRouterModule.default;
const interviewRouter = interviewRouterModule.default;
const roadmapRouter = roadmapRouterModule.default;
const billingRouter = billingRouterModule.default;
const { isAuth } = isAuthModule;
const { getCurrentUser } = userControllerModule;

const app = express();
const PORT = process.env.PORT || 10000;

const rawOrigins = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Replaces the gateway's proxyWithHeaders step in the monolith.
const injectUser = (req, _res, next) => {
  if (req.user?.userId) {
    req.headers["x-user-id"] = String(req.user.userId);
  }
  next();
};

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/", (_req, res) => {
  res.send("Hello from ShreyanshPrepAI");
});

app.use("/api/auth", authRouter);
app.get("/api/me", isAuth, getCurrentUser);

app.use("/api/resume", isAuth, injectUser, resumeRouter);
app.use("/api/interview", isAuth, injectUser, interviewRouter);
app.use("/api/roadmap", isAuth, injectUser, roadmapRouter);
app.use("/api/billing", isAuth, injectUser, billingRouter);

const frontendDist = path.join(backendRoot, "..", "frontend", "dist");
if (process.env.SERVE_FRONTEND === "true" && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    return res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use("/api", (_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, _req, res, _next) => {
  if (err.message?.startsWith("CORS blocked")) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: "Something went wrong" });
});

const connectDB = async () => {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    console.error("MONGODB_URL is missing. Database features will not work.");
    return;
  }
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
};

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
  connectDB();
});

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down...`);
  server.close();
  await Promise.allSettled([
    redis.quit(),
    mongoose.disconnect(),
  ]);
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
