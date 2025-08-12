import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

type User = { id: number; email: string };

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 1) On first load, capture ?accessToken=... from URL and save to localStorage
    useEffect(() => {
        const url = new URL(window.location.href);
        const token = url.searchParams.get("accessToken");
        if (token) {
            localStorage.setItem("accessToken", token);
            url.searchParams.delete("accessToken");
            window.history.replaceState({}, "", url.toString());
        }
    }, []);

    // 2) If we have a token, fetch the current user
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        fetch(`${API_BASE}/api/auth/user`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (r) => {
                if (!r.ok) {
                    if (r.status === 401) {
                        // token expired or invalid
                        localStorage.removeItem("accessToken");
                        setUser(null);
                        setError("Session expired. Please sign in again.");
                        return;
                    }
                    const text = await r.text();
                    throw new Error(text || `HTTP ${r.status}`);
                }
                return r.json();
            })
            .then((u) => u && setUser(u))
            .catch((e) => setError(e.message));
    }, []);

    const loginUrl = `${API_BASE}/api/auth/google`;
    const logout = () => {
        localStorage.removeItem("accessToken");
        setUser(null);
        setError(null);
    };

    if (!user) {
        return (
            <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
                <h2>AI Vulnerability Scanner</h2>
                {error && <p style={{ color: "crimson" }}>{error}</p>}
                <a href={loginUrl}>Sign in with Google</a>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
            <h2>AI Vulnerability Scanner</h2>
            <p>
                Signed in as <b>{user.email}</b>
            </p>
            <button onClick={logout}>Logout</button>
        </div>
    );
}
