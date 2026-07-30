"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Project = {
  id: string;
  name: string;
  reportType: string;
  status: string;
  updatedAt: string;
};

type ReportType = "LAPORAN1" | "LAPORAN2" | "BOTH";

export default function SurveyorProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [reportType, setReportType] = useState<ReportType>("LAPORAN1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ data: { items: Project[] } }>("/projects");
      setItems(data.data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal muat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createProject(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({ name, reportType }),
      });
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal buat");
    }
  }

  return (
    <AppShell
      title="Proyek"
      subtitle="Informasi paket / proyek lapangan (field dinamis admin)"
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Proyek baru</CardTitle>
            <CardDescription>Flow sama monolit create-project</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createProject} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama paket</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nama paket pekerjaan"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tipe laporan</Label>
                <Select
                  value={reportType}
                  onValueChange={(v) => {
                    if (v === "LAPORAN1" || v === "LAPORAN2" || v === "BOTH") {
                      setReportType(v);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAPORAN1">Laporan 1</SelectItem>
                    <SelectItem value="LAPORAN2">Laporan 2</SelectItem>
                    <SelectItem value="BOTH">Keduanya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Buat proyek
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {loading ? (
            <p className="text-sm font-medium text-muted-foreground">
              Memuat…
            </p>
          ) : null}
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold text-primary">{p.name}</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {p.reportType} · diperbarui {p.updatedAt.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={p.status === "submitted" ? "success" : "warning"}
                  >
                    {p.status}
                  </Badge>
                  <Button asChild size="sm" variant="yellow">
                    <Link href={`/surveyor/reports?projectId=${p.id}`}>
                      Laporan
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && !items.length ? (
            <Card>
              <CardContent className="p-6 text-sm font-medium text-muted-foreground">
                Belum ada proyek. Buat di form kiri.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
