import Link from "next/link";
import { HardHat, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Landing = Decide/Learn surface (frontend-design).
 * Signature: navy band + yellow rail + institutional field product, not SaaS hero grid.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6 px-6 py-12">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
              Dinas Pekerjaan Umum dan Penataan Ruang · Kab. Sumedang
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              PE-SMKK
            </h1>
            <p className="mt-3 text-base font-medium leading-relaxed text-primary-foreground/90">
              Pemantauan Keselamatan Konstruksi di lapangan — laporan L1/L2,
              draft autosave, peran ketat ADMIN / SURVEYOR. Rebuild Cloudflare
              full free tier.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                variant="yellow"
                size="lg"
                className="min-h-11 font-bold"
              >
                <Link href="/auth/login">Masuk sistem</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-h-11 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="/auth/reset">Reset password</Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex size-16 items-center justify-center rounded-xl bg-brand-yellow text-2xl font-black text-brand-yellow-foreground shadow-md">
              PE
            </div>
            <p className="text-right text-xs font-semibold text-primary-foreground/70">
              Portfolio rebuild
              <br />
              monorepo CF
            </p>
          </div>
        </div>
        <div className="brand-rail" />
      </header>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 py-10 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <HardHat className="size-5" />
            </div>
            <CardTitle>Surveyor lapangan</CardTitle>
            <CardDescription>
              Proyek, laporan draft, autosave hemat jaringan, submit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/surveyor">Dashboard</Link>
            </Button>
            <Button asChild size="sm" variant="yellow">
              <Link href="/surveyor/projects">Proyek</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/surveyor/reports">Laporan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-brand-yellow/30 text-brand-yellow-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle>Admin dinas</CardTitle>
            <CardDescription>
              User, dinas, field proyek, form template — API P3 siap.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/admin">Dashboard admin</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/users">Pengguna</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/settings">Pengaturan</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center text-xs font-medium text-muted-foreground">
        Flow bisnis monolit PE-SMKK · stack Cloudflare · proprietary license
      </footer>
    </div>
  );
}
