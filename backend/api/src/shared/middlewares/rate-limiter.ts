import type { Request, Response, NextFunction } from "express";
import redis from "../configs/redis";

/**
 * @export
 * @param {number} [limit=100]
 * @param {number} [windowInSeconds=60]
 * @param {string} [namespace="global"]
 * @return {*}
 */
export function rateLimiter(
  limit = 100,
  windowInSeconds = 60,
  namespace = "global"
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    //? The namespace is part of the key because every limited route used to
    //? share one sorted set per IP, so a strict limit on one endpoint silently
    //? throttled all the others attached to the same visitor.
    const key = `rate_limit:${namespace}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowInSeconds * 1000;

    try {
      //? One round trip. The previous version read the count twice, once
      //? inside multi() and again via a separate zcard, so two concurrent
      //? requests could both observe a stale value and both be admitted.
      const results = await redis
        .multi()
        .zremrangebyscore(key, 0, windowStart)
        .zadd(key, now, `${now}-${Math.random()}`)
        .zcard(key)
        .expire(key, windowInSeconds)
        .exec();

      //? exec() resolves to null when any queued command fails, so the result
      //? cannot be indexed without checking.
      const count = Number(results?.[2]?.[1] ?? 0);

      if (count > limit) {
        return res.status(429).json({
          success: false,
          status: 429,
          message: "Too many requests"
        });
      }
    } catch {
      //? Fail open. A rate limiter is a guard, not a correctness requirement,
      //? and rejecting every request when Redis blips takes the site down.
      //? Strictness belongs at the endpoint that must be protected, not here.
    }

    next();
  };
}

/**
  Usage:
 
  import { rateLimiter } from "./middlewares/rate-limiter";
 
  //* global
  app.use(rateLimiter(100, 60));

  //* per route, each with its own bucket
  app.get("/", rateLimiter(5, 60, "root"), (req, res) => {
    res.send("Hello World!");
  });
 
 */
