import type { Request, Response, NextFunction } from "express";
import { redis } from "../core/redis";
import logger from "../utils/logger";

const MAX = Number(process.env.RATE_LIMIT_MAX ?? "15");
const WINDOW = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "900");

export async function rateLimitRolling(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const user = req.user as { id: number } | undefined;
    if (!user) {
        return res
            .status(401)
            .json({ code: "UNAUTHORIZED", message: "Authentication required" });
    }

    const key = `rate:${user.id}`;

    try {
        const count = await redis.incr(key);

        if (count === 1) {
            await redis.expire(key, WINDOW);
        } else {
            const ttlNow = await redis.ttl(key);
            if (ttlNow === -1) {
                await redis.expire(key, WINDOW);
            }
        }

        let ttl = await redis.ttl(key);
        // Edge cases: -2 (no key), -1 (no expire) — normalize
        if (ttl < 0) ttl = WINDOW;

        const resetUnix = Math.ceil((Date.now() + ttl * 1000) / 1000);
        const remaining = Math.max(MAX - count, 0);

        res.setHeader("X-RateLimit-Limit", String(MAX));
        res.setHeader("X-RateLimit-Remaining", String(remaining));
        res.setHeader("X-RateLimit-Reset", String(resetUnix));

        if (count > MAX) {
            return res.status(429).json({
                code: "RATE_LIMIT_EXCEEDED",
                message: `Too many requests. Try again in ${ttl} seconds.`,
            });
        }

        return next();
    } catch (err) {
        logger.warn({ err }, "Rate limiter degraded (Redis error)");
        return next();
    }
}
