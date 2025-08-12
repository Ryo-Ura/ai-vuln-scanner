import dotenv from "dotenv";
dotenv.config();

import { createClient } from "redis";
import logger from "../utils/logger";

const url = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = createClient({ url });

redis.on("connect", () => logger.info({ url }, "Redis connected"));
redis.on("error", (err) => logger.error({ err }, "Redis error"));

(async () => {
    try {
        await redis.connect();
    } catch (err) {
        logger.error({ err }, "Failed to connect to Redis");
    }
})();
