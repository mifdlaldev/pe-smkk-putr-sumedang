import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <AppShell
      title="Dashboard Admin"
      subtitle="Kelola master data — CRUD API P3 siap, UI form builder menyusul"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pengguna</CardTitle>
            <CardDescription>ADMIN only · no open register</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" disabled>
              <span>UI list → next</span>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proyek / Laporan</CardTitle>
            <CardDescription>Lihat semua (ownership bypass)</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/surveyor/projects">Proyek</Link>
            </Button>
            <Button asChild size="sm" variant="yellow">
              <Link href="/surveyor/reports">Laporan</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">R2 / Approval</CardTitle>
            <CardDescription>Phase P5</CardDescription>
          </CardHeader>
          <CardContent className="text-sm font-medium text-muted-foreground">
            Upload private + multi approval types
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
