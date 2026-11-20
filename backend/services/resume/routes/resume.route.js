import express from "express";

import { aiRateLimit } from "../../../shared/rate-limit/aiRateLimit.js";
import { getResume, uploadResume } from "../controllers/resume.controller.js";
import { upload } from "../middleware/multer.js";

const resumeRouter = express.Router();

resumeRouter.post(
  "/upload",
  aiRateLimit({ prefix: "resume", limit: 8 }),
  upload.single("resume"),
  uploadResume,
);

resumeRouter.get("/get-resume", getResume);

export default resumeRouter;
