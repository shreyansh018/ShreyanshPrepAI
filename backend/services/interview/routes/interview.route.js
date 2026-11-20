import express from "express";

import { aiRateLimit } from "../../../shared/rate-limit/aiRateLimit.js";
import {
  getAllInterviews,
  getInterview,
  startInterview,
  submitAnswer,
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

interviewRouter.post(
  "/start",
  aiRateLimit({ prefix: "interview-start", limit: 8 }),
  startInterview,
);
interviewRouter.post(
  "/answer",
  aiRateLimit({ prefix: "interview-answer", limit: 20 }),
  submitAnswer,
);
interviewRouter.get("/all", getAllInterviews);
interviewRouter.get("/:id", getInterview);

export default interviewRouter;
