import express from "express";

import { aiRateLimit } from "../../../shared/rate-limit/aiRateLimit.js";
import {
  generateRoadmap,
  getAllRoadmap,
  getRoadmapbyId,
} from "../controllers/roadmap.controller.js";

const roadmapRouter = express.Router();

roadmapRouter.post(
  "/generate",
  aiRateLimit({ prefix: "roadmap", limit: 8 }),
  generateRoadmap,
);
roadmapRouter.get("/all", getAllRoadmap);
roadmapRouter.get("/:id", getRoadmapbyId);

export default roadmapRouter;
