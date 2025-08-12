import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { scanCode } from "./lib/api";
import ScanForm from "./components/ScanForm";
import ResultsTable from "./components/ResultTable";
import type { Vulnerability } from "./types";
import { HttpError } from "./lib/httpError";
import { GENERIC_ERROR_MESSAGE } from "./constant"

export default function App() {
    const { user, token, authError, loginHref, logout } = useAuth();

    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [results, setResults] = useState<Vulnerability[] | null>(null);

    async function handleScan(req: {
        source: "raw" | "gist";
        content: string;
    }) {
        setIsScanning(true);
        setScanError(null);
        setResults(null);
        try {
            const data = await scanCode(req, token ?? undefined);
            setResults(data);
        } catch (e: unknown) {
            if (e instanceof HttpError) {
                if (e.status === 401 || e.status === 429) {
                    setScanError(e.message);
                } else {
                    setScanError(GENERIC_ERROR_MESSAGE);
                    if (import.meta.env.DEV)
                        console.warn(
                            "Scan error detail:",
                            e.status,
                            e.code,
                            e.body
                        );
                }
            } else {
                setScanError(GENERIC_ERROR_MESSAGE);
                if (import.meta.env.DEV) console.warn("Unknown error:", e);
            }
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
                        <a href={loginHref}>Sign in with Google</a>
                    )}
                </div>
            </header>

            {authError && <p style={{ color: "crimson" }}>{authError}</p>}

            <ScanForm
                onScan={handleScan}
                isScanning={isScanning}
                error={scanError}
            />

            {results && <ResultsTable results={results} />}
        </div>
    );
}
