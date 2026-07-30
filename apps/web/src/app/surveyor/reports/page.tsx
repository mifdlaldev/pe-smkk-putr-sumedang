"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8787";

type Report = {
  id: string;
  reportTitle: string | null;
  status: string;
  revision: number;
  formTemplateId: string;
  projectId: string | null;
  updatedAt: string;
};

type Template = {
  id: string;
  name: string;
  reportType: "LAPORAN1" | "LAPORAN2";
};

type SaveState = "idle" | "pending" | "saving" | "saved" | "error" | "offline";

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

/** Debounce batch draft PATCH — never per-keystroke D1 writes. */
function useDraftAutosave(
  reportId: string | null,
  revision: number,
  payload: { reportTitle?: string; answers?: unknown[] },
  enabled: boolean,
) {
  const [state, setState] = useState<SaveState>("idle");
  const [rev, setRev] = useState(revision);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revRef = useRef(revision);
  revRef.current = rev;

  useEffect(() => {
    setRev(revision);
  }, [revision]);

  useEffect(() => {
    if (!enabled || !reportId) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setState("offline");
      return;
    }
    setState("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setState("saving");
      try {
        const data = await api<{ data: { report: Report } }>(
          `/reports/${reportId}/draft`,
          {
            method: "PATCH",
            body: JSON.stringify({
              expectedRevision: revRef.current,
              reportTitle: payload.reportTitle,
              answers: payload.answers,
            }),
          },
        );
        setRev(data.data.report.revision);
        setState("saved");
      } catch {
        setState("error");
      }
    }, 2500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, reportId, payload.reportTitle, JSON.stringify(payload.answers)]);

  return { state, revision: rev };
}

function ReportsInner() {
  const search = useSearchParams();
  const projectId = search.get("projectId");
  const [items, setItems] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [answersText, setAnswersText] = useState("[]");
  const [activeRevision, setActiveRevision] = useState(0);
  const [activeStatus, setActiveStatus] = useState("draft");
  const [error, setError] = useState<string | null>(null);

  let answersParsed: unknown[] = [];
  try {
    const parsed = JSON.parse(answersText) as unknown;
    answersParsed = Array.isArray(parsed) ? parsed : [];
  } catch {
    answersParsed = [];
  }

  const autosave = useDraftAutosave(
    activeId,
    activeRevision,
    { reportTitle: title, answers: answersParsed },
    activeStatus === "draft" && !!activeId,
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await api<{ data: { items: Report[] } }>("/reports");
      setItems(r.data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
    void (async () => {
      try {
        const data = await api<{ data: { items: Template[] } }>(
          "/admin/form-templates",
        );
        setTemplates(data.data.items);
        if (data.data.items[0]) setTemplateId(data.data.items[0].id);
      } catch {
        setTemplates([]);
      }
    })();
  }, [load]);

  async function createReport(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await api<{ data: { report: Report } }>("/reports", {
        method: "POST",
        body: JSON.stringify({
          formTemplateId: templateId,
          projectId: projectId || null,
          reportTitle: title || null,
        }),
      });
      setActiveId(data.data.report.id);
      setActiveRevision(data.data.report.revision);
      setActiveStatus(data.data.report.status);
      setTitle(data.data.report.reportTitle ?? "");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function openReport(id: string) {
    setError(null);
    try {
      const data = await api<{
        data: { report: Report; answers: unknown[] };
      }>(`/reports/${id}`);
      setActiveId(data.data.report.id);
      setActiveRevision(data.data.report.revision);
      setActiveStatus(data.data.report.status);
      setTitle(data.data.report.reportTitle ?? "");
      setAnswersText(JSON.stringify(data.data.answers ?? [], null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Open failed");
    }
  }

  async function submit() {
    if (!activeId) return;
    setError(null);
    try {
      const data = await api<{ data: { report: Report } }>(
        `/reports/${activeId}/submit`,
        { method: "POST", body: "{}" },
      );
      setActiveStatus(data.data.report.status);
      setActiveRevision(data.data.report.revision);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    }
  }

  return (
    <main style={pageStyle}>
      <p style={{ opacity: 0.6, fontSize: 13 }}>
        <Link href="/surveyor/projects" style={{ color: "#93c5fd" }}>
          Projects
        </Link>
        {" · "}
        <Link href="/auth/login" style={{ color: "#93c5fd" }}>
          Login
        </Link>
      </p>
      <h1 style={{ fontSize: "1.5rem" }}>Reports</h1>
      <p style={{ opacity: 0.7, fontSize: 14 }}>
        Draft autosave debounce ~2.5s · status:{" "}
        <strong>{autosave.state}</strong>
        {activeId ? ` · rev ${autosave.revision}` : null}
      </p>
      {projectId ? (
        <p style={{ fontSize: 13, opacity: 0.65 }}>projectId={projectId}</p>
      ) : null}

      <form
        onSubmit={createReport}
        style={{ display: "grid", gap: 8, maxWidth: 480 }}
      >
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          style={inputStyle}
          required
        >
          <option value="">Pilih form template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.reportType})
            </option>
          ))}
        </select>
        {!templates.length ? (
          <p style={{ fontSize: 13, color: "#fcd34d" }}>
            Belum ada template. Login ADMIN → POST /admin/form-templates dulu.
          </p>
        ) : null}
        <button type="submit" style={btnStyle} disabled={!templateId}>
          Buat laporan draft
        </button>
      </form>

      {error ? <p style={{ color: "#f6a5a5" }}>{error}</p> : null}

      <div
        style={{
          display: "grid",
          gap: 16,
          marginTop: 24,
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1rem" }}>Daftar</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {items.map((r) => (
              <li key={r.id} style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => void openReport(r.id)}
                  style={{
                    ...btnStyle,
                    background: activeId === r.id ? "#1d4ed8" : "#1e293b",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  {r.reportTitle || r.id.slice(0, 8)} · {r.status}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 style={{ fontSize: "1rem" }}>Editor draft</h2>
          {activeId ? (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={activeStatus !== "draft"}
                placeholder="Judul laporan"
                style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
              />
              <textarea
                value={answersText}
                onChange={(e) => setAnswersText(e.target.value)}
                disabled={activeStatus !== "draft"}
                rows={12}
                style={{
                  ...inputStyle,
                  width: "100%",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 12,
                }}
                placeholder='JSON answers, e.g. [{"questionId":"...","adaTidakAda":"Ada"}]'
              />
              <p style={{ fontSize: 12, opacity: 0.6 }}>
                Autosave batch JSON (format L1/L2 legacy).
              </p>
              {activeStatus === "draft" ? (
                <button
                  type="button"
                  onClick={() => void submit()}
                  style={btnStyle}
                >
                  Submit laporan
                </button>
              ) : (
                <p style={{ color: "#86efac" }}>
                  Sudah submitted — autosave off
                </p>
              )}
            </>
          ) : (
            <p style={{ opacity: 0.6 }}>Pilih atau buat laporan</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SurveyorReportsPage() {
  return (
    <Suspense
      fallback={
        <main style={pageStyle}>
          <p style={{ opacity: 0.6 }}>Loading reports…</p>
        </main>
      }
    >
      <ReportsInner />
    </Suspense>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 960,
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
  padding: "0.55rem 0.85rem",
  borderRadius: 8,
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};
