import type { Vulnerability } from "../types";

type Props = { results: Vulnerability[] };

export default function ResultsTable({ results }: Props) {
    return (
        <section>
            <h3 style={{ margin: "8px 0" }}>Findings ({results.length})</h3>
            <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
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
