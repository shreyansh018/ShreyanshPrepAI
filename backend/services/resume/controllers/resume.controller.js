import redis from "../../../shared/redis/redis.js";
import { resumeAgent } from "../agents/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";

const RESUME_CACHE_TTL = 60 * 60 * 24;

const cacheResume = async (userId, resume) => {
  try {
    await redis.set(
      `resume:${userId}`,
      JSON.stringify(resume),
      "EX",
      RESUME_CACHE_TTL,
    );
  } catch (error) {
    console.error("Redis cache write failed:", error.message);
  }
};

const readCachedResume = async (userId) => {
  try {
    return await redis.get(`resume:${userId}`);
  } catch (error) {
    console.error("Redis cache read failed:", error.message);
    return null;
  }
};

export const uploadResume = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF is required",
      });
    }

    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required",
      });
    }

    const resumeText = await extractText(file.buffer);
    const aiResponse = await resumeAgent(resumeText);
    const resumeData = JSON.parse(aiResponse);

    let resume = await Resume.findOne({ userId });

    if (resume) {
      Object.assign(resume, {
        ...resumeData,
        extractedText: resumeText,
      });
      await resume.save();
    } else {
      resume = await Resume.create({
        userId,
        extractedText: resumeText,
        ...resumeData,
      });
    }

    await cacheResume(userId, resume);

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      data: resume,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getResume = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    const cache = await readCachedResume(userId);
    if (cache) {
      return res.status(200).json({
        success: true,
        source: "redis",
        data: JSON.parse(cache),
      });
    }

    const resume = await Resume.findOne({ userId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "resume not found",
      });
    }

    await cacheResume(userId, resume);

    return res.status(200).json({
      success: true,
      source: "mongoDb",
      data: resume,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
