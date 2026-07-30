import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPlaceholder() {
  return (
    <AppShell
      title="Pengaturan"
      subtitle="API /admin/settings & project-fields siap"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm font-medium text-muted-foreground">
          Settings key/value + definisi field proyek. UI editor menyusul.
        </CardContent>
      </Card>
    </AppShell>
  );
}
