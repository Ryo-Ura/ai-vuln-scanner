export type Vulnerability = {
    line: number;
    issueType: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    description: string;
};

export type ScanRequest = {
    source: "raw" | "gist";
    content: string;
};
