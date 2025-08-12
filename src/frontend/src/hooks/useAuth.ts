import { useEffect, useState } from "react";
import { fetchUser, loginUrl as makeLoginUrl } from "../lib/api";

export type User = { id: number; email: string };

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Capture ?accessToken on first load
    useEffect(() => {
        const url = new URL(window.location.href);
        const fromUrl = url.searchParams.get("accessToken");
        const stored = localStorage.getItem("accessToken");

        if (fromUrl) {
            localStorage.setItem("accessToken", fromUrl);
            setToken(fromUrl);
            url.searchParams.delete("accessToken");
            window.history.replaceState({}, "", url.toString());
            return;
        }
        if (stored) setToken(stored);
    }, []);

    // Fetch user when we have a token
    useEffect(() => {
        if (!token) return;
        fetchUser(token)
            .then((u) => {
                setUser(u);
                setAuthError(null);
            })
            .catch(() => {
                // handle expired/invalid tokens
                localStorage.removeItem("accessToken");
                setToken(null);
                setUser(null);
                setAuthError("Session expired. Please sign in again.");
            });
    }, [token]);

    const logout = () => {
        localStorage.removeItem("accessToken");
        setToken(null);
        setUser(null);
        setAuthError(null);
    };

    const loginHref = makeLoginUrl();

    return { user, token, authError, loginHref, logout };
}
