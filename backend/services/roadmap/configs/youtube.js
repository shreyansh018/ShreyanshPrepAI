import axios from "axios";
import dotenv from "dotenv";
import redis from "../../../shared/redis/redis.js";

dotenv.config();

const BASE_URL = "https://www.googleapis.com/youtube/v3/search";
const CACHE_TTL = 60 * 60 * 24 * 7;
const FAILED_CACHE_TTL = 60 * 60;

const getCacheKey = (topic) =>
  `youtube:${topic.toLowerCase().trim().replace(/\s+/g, " ")}`;

const readCache = async (key) => {
  try {
    const cached = await redis.get(key);
    return cached === null ? undefined : JSON.parse(cached);
  } catch (error) {
    console.error("YouTube cache read failed:", error.message);
    return undefined;
  }
};

const writeCache = async (key, value, ttl) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (error) {
    console.error("YouTube cache write failed:", error.message);
  }
};

const search = async (query) => {
  const { data } = await axios.get(BASE_URL, {
    params: {
      key: process.env.YOUTUBE_API_KEY,
      part: "snippet",
      q: query,
      maxResults: 1,
      type: "video",
    },
  });
  return data.items?.[0] ?? null;
};

const toResource = (video) => ({
  title: video.snippet.title,
  channel: video.snippet.channelTitle,
  url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
});

const searchVideo = async (topic) => {
  const cacheKey = getCacheKey(topic);
  const cached = await readCache(cacheKey);
  if (cached !== undefined) return cached;

  try {
    let video = await search(`Virtual Code ${topic}`);

    if (
      video?.snippet?.channelTitle
        ?.toLowerCase()
        .includes("virtual code")
    ) {
      const result = toResource(video);
      await writeCache(cacheKey, result, CACHE_TTL);
      return result;
    }

    video = await search(`${topic} tutorial`);
    const result = video ? toResource(video) : null;
    await writeCache(cacheKey, result, result ? CACHE_TTL : FAILED_CACHE_TTL);
    return result;
  } catch (error) {
    console.error(error);
    await writeCache(cacheKey, null, FAILED_CACHE_TTL);
    return null;
  }
};

export default searchVideo;
