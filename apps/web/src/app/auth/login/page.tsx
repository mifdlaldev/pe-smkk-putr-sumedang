"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{
        data: { user: { role: string } };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password, rememberMe }),
      });
      const role = data.data.user.role;
      router.push(
        role === "ADMIN" ? "/dashboard/admin" : "/dashboard/surveyor",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-primary" />
      <div className="brand-rail pointer-events-none absolute inset-x-0 top-40" />

      <Card className="relative z-10 w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground">
            PE
          </div>
          <CardTitle className="text-2xl text-primary">Masuk PE-SMKK</CardTitle>
          <CardDescription className="font-medium">
            Pemantauan Keselamatan Konstruksi · PUTR Sumedang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <Label htmlFor="remember" className="font-medium text-muted-foreground">
                Ingat sesi (30 hari)
              </Label>
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses…" : "Masuk"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Lupa password?{" "}
              <Link
                href="/auth/reset"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Reset
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
