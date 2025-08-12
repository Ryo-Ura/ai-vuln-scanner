import express from "express";
import dotenv from "dotenv";
import scanRouter from "./routes/scan";
import logger from "./core/logger";
import { logRequest } from "./pre-request-handlers/log-request";

import cors from "cors";
import passport from "passport";
import { initPassport } from "./auth/passport";
import authRouter from "./routes/auth";

dotenv.config();
const app = express();

app.use(logRequest);
app.use(express.json({ limit: "100kb" }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3001" }));

initPassport(passport);
app.use(passport.initialize());

app.use("/api/auth", authRouter);
app.use("/api/scan", scanRouter);

app.use((err: any, req: any, res: any, next: any) => {
    if (err.type === "entity.too.large") {
        return res
            .status(413)
            .json({ code: "PAYLOAD_TOO_LARGE", message: "Payload too large" });
    }
    logger.error(err);
    res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
});
