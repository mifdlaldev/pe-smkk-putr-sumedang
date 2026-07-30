import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Public landing — CTAs only; authenticated users go via login redirect. */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary px-6 py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-yellow">
              Dinas PUTR · Kabupaten Sumedang
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              PE-SMKK
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-primary-foreground/85">
              Sistem Pemantauan Keselamatan Konstruksi — rebuild Cloudflare
              (Pages + Workers + D1 + R2). Flow bisnis monolit tetap.
            </p>
          </div>
          <div className="h-2 w-24 rounded-full bg-brand-yellow" />
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Masuk aplikasi</CardTitle>
            <CardDescription>
              Session cookie HttpOnly · role ADMIN / SURVEYOR
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/reset">Reset password</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Area kerja</CardTitle>
            <CardDescription>
              Setelah login — shell sidebar navy + accent kuning
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="yellow">
              <Link href="/surveyor/projects">Proyek</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/surveyor/reports">Laporan</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/surveyor">Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
