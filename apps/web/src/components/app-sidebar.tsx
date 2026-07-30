"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { cn, apiFetch } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const surveyorNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/surveyor", icon: LayoutDashboard },
  { title: "Proyek", href: "/surveyor/projects", icon: FolderOpen },
  { title: "Laporan", href: "/surveyor/reports", icon: FileText },
];

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Proyek", href: "/surveyor/projects", icon: FolderOpen },
  { title: "Laporan", href: "/surveyor/reports", icon: FileText },
  { title: "Pengguna", href: "/admin/users", icon: Users },
  { title: "Pengaturan", href: "/admin/settings", icon: Settings },
];

export function AppSidebar({
  role,
  userLabel,
}: {
  role: "ADMIN" | "SURVEYOR" | null;
  userLabel?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = role === "ADMIN" ? adminNav : surveyorNav;

  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST", body: "{}" });
    } catch {
      /* ignore */
    }
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-brand-yellow text-sm font-black text-brand-yellow-foreground">
          PE
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">PE-SMKK</p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            PUTR Sumedang
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-90" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <p className="mb-2 truncate px-1 text-xs font-medium text-sidebar-foreground/70">
          {userLabel ?? (role === "ADMIN" ? "Admin" : "Surveyor")}
        </p>
        <Separator className="mb-2 bg-sidebar-border" />
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" />
          Keluar
        </Button>
      </div>
    </aside>
  );
}
