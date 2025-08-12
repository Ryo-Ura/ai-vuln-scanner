import { z } from "zod";

// Incoming request shape
export const scanRequestSchema = z.object({
    source: z.enum(["raw", "gist"]),
    content: z
        .string()
        .min(1)
        .max(100 * 1024), // up to 100 KB
});

export const vulnerabilitySchema = z.object({
    line: z.number().int().nonnegative(),
    issueType: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    description: z.string(),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type Vulnerability = z.infer<typeof vulnerabilitySchema>;
