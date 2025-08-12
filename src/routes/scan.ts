import { Router } from "express";
import { z } from "zod";
import {
    scanRequestSchema,
    vulnerabilitySchema,
    Vulnerability,
} from "../schemas/scan";
import logger from "../core/logger";
import { analyzeCode } from "../core/llmClient";
import passport from "passport";

const log = logger.child({ module: "scanRoute" });
const router = Router();

router.post(
    "/",
    passport.authenticate("jwtAuth", { session: false }),
    async (req, res) => {
        // 1) Validate the incoming request body against our Zod schema
        const parsed = scanRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            const message = z.treeifyError(parsed.error); // keeping your formatter
            log.warn({ errors: message }, "Invalid scan request");
            return res.status(400).json({ code: "INVALID_REQUEST", message });
        }
        const { source, content } = parsed.data;
        log.info({ source }, "Scan request received");

        try {
            // 2) Invoke the LLM ONCE
            const llmOut = await analyzeCode(content);

            // 3) If string -> parse JSON, else use directly
            let issuesUnknown: unknown;
            if (typeof llmOut === "string") {
                log.debug(
                    { rawSnippet: llmOut.slice(0, 200) },
                    "LLM response (string, truncated)"
                );
                try {
                    issuesUnknown = JSON.parse(llmOut);
                } catch (err) {
                    log.error({ err, raw: llmOut }, "Failed to parse LLM JSON");
                    return res.status(502).json({
                        code: "LLM_RESPONSE_PARSE_ERROR",
                        message: "Invalid JSON format from LLM",
                    });
                }
            } else {
                issuesUnknown = llmOut;
                log.debug(
                    {
                        kind: Array.isArray(llmOut) ? "array" : typeof llmOut,
                        length: Array.isArray(llmOut),
                    },
                    "LLM response (non-string)"
                );
            }

            // 4) Validate against our schema
            const validated = z
                .array(vulnerabilitySchema)
                .safeParse(issuesUnknown);
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

            // 5) Return the validated Vulnerability[]
            return res.json(validated.data as Vulnerability[]);
        } catch (err: any) {
            log.error({ err }, "Error during scanning process");
            return res.status(502).json({
                code: "LLM_CALL_ERROR",
                message: err.message || "Failed to call LLM",
            });
        }
    }
);

export default router;
