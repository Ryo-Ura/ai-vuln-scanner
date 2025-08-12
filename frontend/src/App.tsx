import { useEffect, useMemo, useState } from "react";
import type { Vulnerability } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export default function App() {
    // --- auth state ---
    const [user, setUser] = useState<{ id: number; email: string } | null>(
        null
    );
    const [authError, setAuthError] = useState<string | null>(null);

    // --- scan state ---
    const [source, setSource] = useState<"raw" | "gist">("raw");
    const [content, setContent] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [results, setResults] = useState<Vulnerability[] | null>(null);

    // capture ?accessToken on first load
    useEffect(() => {
        const url = new URL(window.location.href);
        const token = url.searchParams.get("accessToken");
        if (token) {
            localStorage.setItem("accessToken", token);
            url.searchParams.delete("accessToken");
            window.history.replaceState({}, "", url.toString());
        }
    }, []);

    // fetch user if token exists
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        fetch(`${API_BASE}/api/auth/user`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (r) => {
                if (!r.ok) {
                    if (r.status === 401) {
                        localStorage.removeItem("accessToken");
                        setUser(null);
                        setAuthError("Session expired. Please sign in again.");
                        return;
                    }
                    throw new Error(await r.text());
                }
                return r.json();
            })
            .then((u) => u && setUser(u))
            .catch((e) => setAuthError(e.message));
    }, []);

    const loginUrl = `${API_BASE}/api/auth/google`;
    const logout = () => {
        localStorage.removeItem("accessToken");
        setUser(null);
        setResults(null);
        setScanError(null);
        setAuthError(null);
    };

    // byte-length for 100KB cap awareness
    const contentBytes = useMemo(
        () => new TextEncoder().encode(content).length,
        [content]
    );
    const overLimit = contentBytes > 100 * 1024;

    async function onScan() {
        setIsScanning(true);
        setScanError(null);
        setResults(null);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE}/api/scan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ source, content }),
            });

            if (!res.ok) {
                const text = await res.text();
                if (res.status === 401)
                    throw new Error("Unauthorized. Please sign in.");
                if (res.status === 413)
                    throw new Error("Payload too large (max 100 KB).");
                throw new Error(text || `HTTP ${res.status}`);
            }

            const data = (await res.json()) as Vulnerability[];
            setResults(data);
        } catch {
            setScanError("Scan failed");
        } finally {
            setIsScanning(false);
        }
    }

    return (
        <div
            style={{
                padding: 24,
                fontFamily:
                    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                maxWidth: 900,
                margin: "0 auto",
            }}
        >
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                }}
            >
                <h2 style={{ margin: 0 }}>AI Vulnerability Scanner</h2>
                <div style={{ marginLeft: "auto" }}>
                    {user ? (
                        <>
                            <span style={{ marginRight: 12 }}>
                                Signed in as <b>{user.email}</b>
                            </span>
                            <button onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <a href={loginUrl}>Sign in with Google</a>
                    )}
                </div>
            </header>

            {authError && <p style={{ color: "crimson" }}>{authError}</p>}

            {/* Scan form */}
            <section
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 16,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <label>
                        Source:&nbsp;
                        <select
                            value={source}
                            onChange={(e) =>
                                setSource(e.target.value as "raw" | "gist")
                            }
                        >
                            <option value="raw">Raw</option>
                            <option value="gist" disabled>
                                GitHub Gist (soon)
                            </option>
                        </select>
                    </label>
                    <div
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            color: overLimit ? "crimson" : "#666",
                        }}
                    >
                        {contentBytes.toLocaleString()} / 102,400 bytes
                    </div>
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your code snippet here…"
                    rows={12}
                    style={{
                        width: "100%",
                        fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        marginTop: 8,
                    }}
                >
                    <button
                        onClick={onScan}
                        disabled={isScanning || overLimit || !content.trim()}
                    >
                        {isScanning ? "Scanning…" : "Scan"}
                    </button>
                    {scanError && (
                        <span style={{ color: "crimson" }}>{scanError}</span>
                    )}
                </div>
            </section>

            {/* Results */}
            {results && (
                <section>
                    <h3 style={{ margin: "8px 0" }}>
                        Findings ({results.length})
                    </h3>
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                borderCollapse: "collapse",
                                width: "100%",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={th}>Line</th>
                                    <th style={th}>Type</th>
                                    <th style={th}>Severity</th>
                                    <th style={th}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i}>
                                        <td style={td}>{r.line}</td>
                                        <td style={td}>{r.issueType}</td>
                                        <td
                                            style={{
                                                ...td,
                                                ...severityStyle(r.severity),
                                            }}
                                        >
                                            {r.severity}
                                        </td>
                                        <td style={td}>{r.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}

const th: React.CSSProperties = {
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    padding: "8px 6px",
    fontWeight: 600,
};
const td: React.CSSProperties = {
    borderBottom: "1px solid #f3f4f6",
    padding: "8px 6px",
    verticalAlign: "top",
};

function severityStyle(s: "LOW" | "MEDIUM" | "HIGH"): React.CSSProperties {
    const base: React.CSSProperties = { fontWeight: 700 };
    if (s === "HIGH") return { ...base, color: "crimson" };
    if (s === "MEDIUM") return { ...base, color: "#d97706" };
    return { ...base, color: "#16a34a" };
}
