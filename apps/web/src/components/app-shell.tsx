"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { apiFetch } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type MeUser = {
  id: string;
  username: string;
  fullName: string | null;
  role: "ADMIN" | "SURVEYOR";
  status: string;
};

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
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetch<{ data: { user: MeUser } }>("/auth/me");
        if (!cancelled) setUser(data.data.user);
      } catch {
        if (!cancelled) {
          router.replace("/auth/login");
        }
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
      <div className="flex min-h-screen items-center justify-center bg-background text-sm font-semibold text-muted-foreground">
        Memuat sesi…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role={user.role}
        userLabel={user.fullName || user.username}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <Badge variant={user.role === "ADMIN" ? "yellow" : "default"}>
            {user.role}
          </Badge>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
