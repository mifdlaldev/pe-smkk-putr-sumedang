"use client";

import { FormEvent, useState } from "react";

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

const btnStyle: React.CSSProperties = {
  padding: "0.65rem 1rem",
  borderRadius: 8,
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

export default function ResetPage() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [identifier, setIdentifier] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const json = (await res.json()) as {
        error?: string;
        data?: { message?: string; devToken?: string };
      };
      if (!res.ok) {
        setError(json.error ?? "Request failed");
        return;
      }
      setMessage(json.data?.message ?? "Check your email.");
      if (json.data?.devToken) {
        setToken(json.data.devToken);
        setStep("reset");
        setMessage(
          `${json.data.message ?? ""} (dev: token filled — production sends link only)`,
        );
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = (await res.json()) as {
        error?: string;
        data?: { message?: string };
      };
      if (!res.ok) {
        setError(json.error ?? "Reset failed");
        return;
      }
      setMessage(json.data?.message ?? "Password updated.");
      setStep("request");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "0 auto",
        padding: "3rem 1.25rem",
        fontFamily: "system-ui, sans-serif",
        color: "#e8eefc",
      }}
    >
      <h1 style={{ fontSize: "1.5rem" }}>Reset password</h1>
      <p style={{ opacity: 0.7, fontSize: 14 }}>
        One-time token · never emails a permanent plaintext password
      </p>

      {step === "request" ? (
        <form
          onSubmit={requestReset}
          style={{ display: "grid", gap: 12, marginTop: 24 }}
        >
          <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
            Username or email
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "…" : "Request reset"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={doReset}
          style={{ display: "grid", gap: 12, marginTop: 24 }}
        >
          <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
            Reset token
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
            New password (min 10, letter + number)
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={10}
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "…" : "Set new password"}
          </button>
        </form>
      )}

      {error ? <p style={{ color: "#f6a5a5", fontSize: 14 }}>{error}</p> : null}
      {message ? (
        <p style={{ color: "#86efac", fontSize: 14 }}>{message}</p>
      ) : null}
      <p style={{ marginTop: 16, fontSize: 13 }}>
        <a href="/auth/login" style={{ color: "#93c5fd" }}>
          Back to sign in
        </a>
      </p>
    </main>
  );
}
