"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { apiFetch, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type MeUser = {
  id: string;
  username: string;
  fullName: string | null;
  role: "ADMIN" | "SURVEYOR";
  status: string;
};

const surveyorLinks = [
  { href: "/dashboard/surveyor", label: "Home" },
  { href: "/surveyor/projects", label: "Proyek" },
  { href: "/surveyor/reports", label: "Laporan" },
];

const adminLinks = [
  { href: "/dashboard/admin", label: "Home" },
  { href: "/surveyor/projects", label: "Proyek" },
  { href: "/surveyor/reports", label: "Laporan" },
  { href: "/admin/users", label: "User" },
  { href: "/admin/settings", label: "Setelan" },
];

/** Operate surface shell — sidebar navy + yellow rail + dense header. */
export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetch<{ data: { user: MeUser } }>("/auth/me");
        if (!cancelled) setUser(data.data.user);
      } catch {
        if (!cancelled) router.replace("/auth/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-pulse rounded-lg bg-primary" />
          <p className="text-sm font-semibold text-muted-foreground">
            Memuat sesi…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const links = user.role === "ADMIN" ? adminLinks : surveyorLinks;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="sticky top-0 hidden h-screen md:flex">
        <AppSidebar
          role={user.role}
          userLabel={user.fullName || user.username}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="brand-rail" />
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              PE-SMKK · PUTR Sumedang
            </p>
            <h1 className="truncate text-lg font-bold tracking-tight text-primary sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-sm text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
          <Badge variant={user.role === "ADMIN" ? "yellow" : "default"}>
            {user.role}
          </Badge>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {links.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 text-xs font-bold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
