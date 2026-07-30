"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        const data = await apiFetch<{ data: { report: Report } }>(
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

function saveBadge(state: SaveState) {
  switch (state) {
    case "saved":
      return <Badge variant="success">tersimpan</Badge>;
    case "saving":
      return <Badge variant="secondary">menyimpan…</Badge>;
    case "pending":
      return <Badge variant="warning">menunggu</Badge>;
    case "offline":
      return <Badge variant="danger">offline</Badge>;
    case "error":
      return <Badge variant="danger">gagal</Badge>;
    default:
      return <Badge variant="outline">siap</Badge>;
  }
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
      const r = await apiFetch<{ data: { items: Report[] } }>("/reports");
      setItems(r.data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal muat");
    }
  }, []);

  useEffect(() => {
    void load();
    void (async () => {
      try {
        const data = await apiFetch<{ data: { items: Template[] } }>(
          "/admin/form-templates",
        );
        setTemplates(data.data.items);
        if (data.data.items[0]) setTemplateId(data.data.items[0].id);
      } catch {
        setTemplates([]);
      }
    })();
  }, [load]);

  async function createReport(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiFetch<{ data: { report: Report } }>("/reports", {
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
      setError(err instanceof Error ? err.message : "Gagal buat");
    }
  }

  async function openReport(id: string) {
    setError(null);
    try {
      const data = await apiFetch<{
        data: { report: Report; answers: unknown[] };
      }>(`/reports/${id}`);
      setActiveId(data.data.report.id);
      setActiveRevision(data.data.report.revision);
      setActiveStatus(data.data.report.status);
      setTitle(data.data.report.reportTitle ?? "");
      setAnswersText(JSON.stringify(data.data.answers ?? [], null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal buka");
    }
  }

  async function submit() {
    if (!activeId) return;
    setError(null);
    try {
      const data = await apiFetch<{ data: { report: Report } }>(
        `/reports/${activeId}/submit`,
        { method: "POST", body: "{}" },
      );
      setActiveStatus(data.data.report.status);
      setActiveRevision(data.data.report.revision);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal submit");
    }
  }

  return (
    <AppShell
      title="Laporan"
      subtitle="Draft autosave debounce ~2.5s · L1/L2 answers batch"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {saveBadge(autosave.state)}
        {activeId ? (
          <span className="text-xs font-semibold text-muted-foreground">
            rev {autosave.revision}
            {projectId ? ` · project ${projectId.slice(0, 8)}…` : ""}
          </span>
        ) : null}
        <Button asChild variant="outline" size="sm">
          <Link href="/surveyor/projects">← Proyek</Link>
        </Button>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buat draft</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createReport} className="grid gap-3">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm font-medium"
                required
              >
                <option value="">Pilih template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.reportType})
                  </option>
                ))}
              </select>
              {!templates.length ? (
                <p className="text-xs font-medium text-amber-700">
                  Butuh ADMIN buat form-template dulu.
                </p>
              ) : null}
              <Button type="submit" disabled={!templateId}>
                Buat laporan
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar</CardTitle>
            <CardDescription>{items.length} laporan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => void openReport(r.id)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  activeId === r.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <span className="truncate">
                  {r.reportTitle || r.id.slice(0, 8)}
                </span>
                <Badge
                  variant={r.status === "submitted" ? "success" : "warning"}
                  className="ml-2 shrink-0"
                >
                  {r.status}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editor</CardTitle>
            <CardDescription>JSON answers L1/L2 (batch)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeId ? (
              <>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={activeStatus !== "draft"}
                  placeholder="Judul laporan"
                />
                <Textarea
                  value={answersText}
                  onChange={(e) => setAnswersText(e.target.value)}
                  disabled={activeStatus !== "draft"}
                  rows={12}
                  className="font-mono text-xs"
                />
                {activeStatus === "draft" ? (
                  <Button variant="yellow" onClick={() => void submit()}>
                    Submit laporan
                  </Button>
                ) : (
                  <p className="text-sm font-semibold text-emerald-700">
                    Sudah submitted — autosave off
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Pilih atau buat laporan
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default function SurveyorReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-muted-foreground">
          Memuat laporan…
        </div>
      }
    >
      <ReportsInner />
    </Suspense>
  );
}
