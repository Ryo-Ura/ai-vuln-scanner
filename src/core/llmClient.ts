import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import logger from './logger';  // or wherever your logger lives
import fetch from "node-fetch";

dotenv.config();

const API_BASE = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY!;
if (!API_KEY) throw new Error("Missing OPENROUTER_KEY");

const tplPath = path.resolve(__dirname, "../prompts/scan.tpl");
let rawTemplate: string;
(async () => {
    rawTemplate = await fs.readFile(tplPath, "utf-8");
})();

// TODO: allow passing model as a parameter and target specific model
export async function analyzeCode(code: string): Promise<string> {
    // Fill in the code into the template
    const prompt = rawTemplate;
    // const prompt = rawTemplate.replace("{{code}}", code);
    logger.info("Filled-in security scan prompt");

    const payload = {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
    };

    const res = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`LLM error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as any;
    const message = json.choices?.[0]?.message?.content;
    if (!message) throw new Error("No content in LLM response");
    return message;
}

// Format
// fetch("https://openrouter.ai/api/v1/chat/completions", {
//     method: "POST",
//     headers: {
//         Authorization: "Bearer <OPENROUTER_API_KEY>",
//         "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
//         "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
//         "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//         model: "deepseek/deepseek-chat-v3-0324:free",
//         messages: [
//             {
//                 role: "user",
//                 content: "What is the meaning of life?",
//             },
//         ],
//     }),
// });
