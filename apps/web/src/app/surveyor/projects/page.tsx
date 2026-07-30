"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8787";

type Project = {
  id: string;
  name: string;
  reportType: string;
  status: string;
  updatedAt: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? res.statusText);
  }
  return json as T;
}

export default function SurveyorProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [reportType, setReportType] = useState<"LAPORAN1" | "LAPORAN2" | "BOTH">(
    "LAPORAN1",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ data: { items: Project[] } }>("/projects");
      setItems(data.data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/projects", {
        method: "POST",
        body: JSON.stringify({ name, reportType }),
      });
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  return (
    <main style={pageStyle}>
      <p style={{ opacity: 0.6, fontSize: 13 }}>
        <Link href="/" style={{ color: "#93c5fd" }}>
          Home
        </Link>
        {" · "}
        <Link href="/surveyor/reports" style={{ color: "#93c5fd" }}>
          Reports
        </Link>
      </p>
      <h1 style={{ fontSize: "1.5rem" }}>Projects</h1>
      <p style={{ opacity: 0.7, fontSize: 14 }}>
        Flow sama monolit: surveyor isi informasi proyek (field dinamis admin).
      </p>

      <form onSubmit={createProject} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input
          placeholder="Nama paket / proyek"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
        <select
          value={reportType}
          onChange={(e) =>
            setReportType(e.target.value as "LAPORAN1" | "LAPORAN2" | "BOTH")
          }
          style={inputStyle}
        >
          <option value="LAPORAN1">Laporan 1</option>
          <option value="LAPORAN2">Laporan 2</option>
          <option value="BOTH">Both</option>
        </select>
        <button type="submit" style={btnStyle}>
          Buat proyek
        </button>
      </form>

      {error ? <p style={{ color: "#f6a5a5" }}>{error}</p> : null}
      {loading ? <p style={{ opacity: 0.6 }}>Loading…</p> : null}

      <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
        {items.map((p) => (
          <li
            key={p.id}
            style={{
              border: "1px solid #243049",
              borderRadius: 10,
              padding: "0.75rem 1rem",
              marginBottom: 8,
              background: "#121a2b",
            }}
          >
            <strong>{p.name}</strong>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {p.reportType} · {p.status}
            </div>
            <Link
              href={`/surveyor/reports?projectId=${p.id}`}
              style={{ color: "#93c5fd", fontSize: 13 }}
            >
              Buat / lihat laporan
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "2rem 1.25rem",
  fontFamily: "system-ui, sans-serif",
  color: "#e8eefc",
  minHeight: "100vh",
  background: "#0b1220",
};

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
