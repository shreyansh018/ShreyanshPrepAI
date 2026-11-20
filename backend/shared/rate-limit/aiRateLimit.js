import redis from "../redis/redis.js";

const DEFAULT_LIMIT = 12;
const DEFAULT_WINDOW_SECONDS = 60;

// Lightweight per-user limiter for expensive AI endpoints. Redis is shared by
// the unified process, so this also works if the backend is later scaled out.
export const aiRateLimit = ({
  prefix = "ai",
  limit = DEFAULT_LIMIT,
  windowSeconds = DEFAULT_WINDOW_SECONDS,
} = {}) => {
  return async (req, res, next) => {
    const identity =
      req.user?.userId || req.headers["x-user-id"] || req.ip || "anonymous";
    const key = `ratelimit:${prefix}:${identity}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > limit) {
        const ttl = await redis.ttl(key);
        if (ttl > 0) res.set("Retry-After", String(ttl));
        return res.status(429).json({
          success: false,
          message: "AI is busy right now. Please try again shortly.",
        });
      }

      return next();
    } catch (error) {
      console.error("Rate limit check failed:", error.message);
      return next();
    }
  };
};
