import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

const API_BASE = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;
if (!API_KEY) throw new Error("Missing OPENROUTER_API_KEY (or OPENROUTER_KEY)");

const tplPath = path.resolve(__dirname, "../prompts/scan.tpl");
let rawTemplate: string;
(async () => {
    rawTemplate = await fs.readFile(tplPath, "utf-8");
})();

const vulnListSchema = {
    name: "vulnerability_list",
    strict: true,
    schema: {
        type: "array",
        items: {
            type: "object",
            properties: {
                line: { type: "integer" },
                issueType: { type: "string" },
                severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                description: { type: "string" },
            },
            required: ["line", "issueType", "severity", "description"],
            additionalProperties: false,
        },
    },
} as const;

export async function analyzeCode(code: string): Promise<string> {
    const prompt = rawTemplate.replace("{{code}}", code);

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
    };

    // ——— Attempt 1: Assistant Prefill + Structured Outputs (json_schema) ———
    const payloadWithSchema = {
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: "[" },
        ],
        response_format: {
            type: "json_schema",
            json_schema: vulnListSchema,
        },
    };

    try {
        const res = await fetch(API_BASE, {
            method: "POST",
            headers,
            body: JSON.stringify(payloadWithSchema),
        });

        if (res.ok) {
            const json = (await res.json()) as any;
            const content = json.choices?.[0]?.message?.content ?? "";
            return typeof content === "string"
                ? content
                : JSON.stringify(content);
        }

        // If the model/provider doesn’t support json_schema,
        // OpenRouter returns an error; we’ll fall back.
        const errText = await res.text();
        logger.warn(
            { errText },
            "Structured outputs unsupported; falling back to prefill-only"
        );
    } catch (e) {
        logger.warn(
            { err: (e as Error).message },
            "Error on structured-output attempt; falling back"
        );
    }

    // ——— Attempt 2: Assistant Prefill only (broadly supported) ———
    const payloadPrefillOnly = {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: "[" },
        ],
        // IMPORTANT: no response_format here because json_object would force an object,
        // and we want an array. (json_schema might not be supported by this model.)
    };

    const res2 = await fetch(API_BASE, {
        method: "POST",
        headers,
        body: JSON.stringify(payloadPrefillOnly),
    });

    if (!res2.ok) {
        const text = await res2.text();
        throw new Error(`LLM error ${res2.status}: ${text}`);
    }

    const json2 = (await res2.json()) as any;
    const message = json2.choices?.[0]?.message?.content;
    if (!message) throw new Error("No content in LLM response");
    return message;
}
