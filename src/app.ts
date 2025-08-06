import express from "express";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const app = express();
app.use(express.json({ limit: "100kb" }));

// A stubbed POST /api/scan endpoint
app.post("/api/scan", (req, res) => {
    // Validate shape with Zod
    const schema = z.object({
        source: z.enum(["raw", "gist"]),
        content: z
            .string()
            .min(1)
            .max(100 * 1024),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            code: "INVALID_REQUEST",
            message: result.error.name,
        });
    }

    // Stub response
    return res.json([
        {
            line: 1,
            issueType: "SQL Injection",
            severity: "HIGH",
            description: "This is a stubbed issue.",
        },
    ]);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
