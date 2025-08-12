import { useMemo, useState } from "react";
import type { ScanRequest } from "../lib/api";
import Editor from "@monaco-editor/react";

type Props = {
    onScan: (req: ScanRequest) => Promise<void> | void;
    isScanning?: boolean;
    error?: string | null;
};

const LANGS = [
    "plaintext",
    "javascript",
    "typescript",
    "python",
    "java",
    "c",
    "cpp",
    "csharp",
    "go",
    "rust",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "sql",
    "json",
];

export default function ScanForm({ onScan, isScanning, error }: Props) {
    const [source, setSource] = useState<"raw" | "gist">("raw");
    const [language, setLanguage] = useState<string>("plaintext");
    const [content, setContent] = useState("");

    const contentBytes = useMemo(
        () => new TextEncoder().encode(content).length,
        [content]
    );
    const overLimit = contentBytes > 100 * 1024;

    async function handleScan() {
        await onScan({ source, content });
    }

    return (
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

                <label style={{ marginLeft: 12 }}>
                    Language:&nbsp;
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {LANGS.map((l) => (
                            <option key={l} value={l}>
                                {l}
                            </option>
                        ))}
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

            <div
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    overflow: "hidden",
                }}
            >
                <Editor
                    height="360px"
                    language={language}
                    theme="vs-dark"
                    value={content}
                    onChange={(v) => setContent(v ?? "")}
                    options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    marginTop: 8,
                }}
            >
                <button
                    onClick={handleScan}
                    disabled={!!isScanning || overLimit || !content.trim()}
                >
                    {isScanning ? "Scanning…" : "Scan"}
                </button>
                {error && <span style={{ color: "crimson" }}>{error}</span>}
            </div>
        </section>
    );
}
