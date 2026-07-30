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

export default function SurveyorDashboardPage() {
  return (
    <AppShell
      title="Dashboard Surveyor"
      subtitle="Ringkasan kerja lapangan — stats penuh di P5"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proyek</CardTitle>
            <CardDescription>Kelola paket pekerjaan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="yellow">
              <Link href="/surveyor/projects">Buka proyek</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laporan</CardTitle>
            <CardDescription>Draft L1/L2 + autosave</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/surveyor/reports">Buka laporan</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
            <CardDescription>API health via Worker</CardDescription>
          </CardHeader>
          <CardContent className="text-sm font-medium text-muted-foreground">
            Charts & approval → P5
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
