const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export type ScanRequest = { source: "raw" | "gist"; content: string };

export async function fetchUser(token: string) {
    const r = await fetch(`${API_BASE}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw r;
    return r.json();
}

export async function scanCode(req: ScanRequest, token?: string) {
    const r = await fetch(`${API_BASE}/api/scan`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(req),
    });
    if (!r.ok) {
        const text = await r.text();
        const message =
            r.status === 401
                ? "Unauthorized. Please sign in."
                : r.status === 413
                ? "Payload too large (max 100 KB)."
                : text || `HTTP ${r.status}`;
        throw new Error(message);
    }
    return r.json();
}

export function loginUrl() {
    return `${API_BASE}/api/auth/google`;
}
