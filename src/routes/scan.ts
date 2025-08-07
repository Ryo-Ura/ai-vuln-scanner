// src/routes/scan.ts
import { Router } from "express";
import { z } from "zod";
import {
    scanRequestSchema,
    vulnerabilitySchema,
    Vulnerability,
} from "../schemas/scan";
import logger from "../core/logger";
import { analyzeCode } from "../core/llmClient";

const log = logger.child({ module: "scanRoute" });
const router = Router();

router.post("/", async (req, res, next) => {
    // 1) Validate the incoming request body against our Zod schema
    const parsed = scanRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        const message = z.treeifyError(parsed.error);
        log.warn({ errors: z.treeifyError(parsed.error) }, "Invalid scan request");
        return res.status(400).json({ code: "INVALID_REQUEST", message });
    }
    const { source, content } = parsed.data;
    log.info({ source }, "Scan request received");

    try {
        // 2) Invoke the LLM with the user’s code snippet
        const raw = await analyzeCode(content);
        log.info(
            { rawSnippet: raw.slice(0, 200) },
            "Raw LLM response (truncated)"
        );

        // 3) Parse the LLM’s reply as JSON
        let issues: unknown[];
        try {
            issues = JSON.parse(raw);
        } catch (err) {
            log.error({ err, raw }, "Failed to parse LLM JSON");
            return res.status(502).json({
                code: "LLM_RESPONSE_PARSE_ERROR",
                message: "Invalid JSON format from LLM",
            });
        }

        // 4) Validate each item against our vulnerability schema
        const validated = z.array(vulnerabilitySchema).safeParse(issues);
        if (!validated.success) {
            log.error(
                { errors: z.treeifyError(validated.error) },
                "LLM response schema mismatch"
            );
            return res.status(502).json({
                code: "LLM_RESPONSE_SCHEMA_ERROR",
                message: "LLM response format is incorrect",
            });
        }

        // 5) Return the array of validated Vulnerability objects
        return res.json(validated.data as Vulnerability[]);
    } catch (err: any) {
        // 6) Catch any network/LLM errors and surface as 502
        log.error({ err }, "Error during scanning process");
        return res.status(502).json({
            code: "LLM_CALL_ERROR",
            message: err.message || "Failed to call LLM",
        });
    }
});

export default router;
