import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPlaceholder() {
  return (
    <AppShell title="Pengguna" subtitle="API /admin/users siap — UI table next">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm font-medium text-muted-foreground">
          CRUD user via Hono sudah live. Halaman table + form create menyusul
          setelah design system stabil.
        </CardContent>
      </Card>
    </AppShell>
  );
}
