"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8787";

const inputStyle: React.CSSProperties = {
  padding: "0.55rem 0.65rem",
  borderRadius: 8,
  border: "1px solid #243049",
  background: "#121a2b",
  color: "#e8eefc",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      });
      const json = (await res.json()) as {
        error?: string;
        data?: { user: { role: string } };
      };
      if (!res.ok) {
        setError(json.error ?? "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error — check API is running");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 400,
        margin: "0 auto",
        padding: "3rem 1.25rem",
        fontFamily: "system-ui, sans-serif",
        color: "#e8eefc",
      }}
    >
      <h1 style={{ fontSize: "1.5rem" }}>Sign in</h1>
      <p style={{ opacity: 0.7, fontSize: 14 }}>
        PE-SMKK · session cookie · credentials never stored in localStorage
      </p>
      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12, marginTop: 24 }}
      >
        <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
          Username
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontSize: 14,
          }}
        >
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me (30 days)
        </label>
        {error ? (
          <p style={{ color: "#f6a5a5", fontSize: 14, margin: 0 }}>{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13, opacity: 0.55 }}>
        <a href="/auth/reset" style={{ color: "#93c5fd" }}>
          Forgot password
        </a>
      </p>
    </main>
  );
}
