import Redis from "ioredis";

import env from "./env";

const redis = new Redis(env.REDIS_URL, {
  //? Without a cap, ioredis retries forever and logs on every attempt, which
  //? floods output when Redis is simply not up yet. Bounded instead, so the
  //? failure is visible and the process can decide.
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false
});

redis.on("error", err => console.log("Redis Client Error:", err));

export default redis;
