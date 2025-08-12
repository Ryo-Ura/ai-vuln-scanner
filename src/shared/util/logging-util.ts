export function extractUserMessage(raw: string): string {
    try {
        const obj = JSON.parse(raw) as {
            message?: string;
            error?: string | { message?: string };
            detail?: string;
        };
        return (
            obj?.message ??
            (typeof obj?.error === "string"
                ? obj.error
                : obj?.error?.message) ??
            obj?.detail ??
            raw
        );
    } catch {
        return raw;
    }
}
