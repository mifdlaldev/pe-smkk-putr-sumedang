"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPage() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const data = await apiFetch<{
        data: { ok: boolean; devToken?: string };
      }>("/auth/request-reset", {
        method: "POST",
        body: JSON.stringify({ usernameOrEmail }),
      });
      setMessage(
        "Jika akun cocok, instruksi reset dikirim. (Dev: token muncul di bawah.)",
      );
      if (data.data.devToken) {
        setToken(data.data.devToken);
        setStep("reset");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setMessage("Password diganti. Silakan masuk.");
      setStep("request");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal reset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-primary" />
      <div className="brand-rail pointer-events-none absolute inset-x-0 top-40" />

      <Card className="relative z-10 w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Reset password</CardTitle>
          <CardDescription>
            Token one-time · tidak kirim password plain di email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "request" ? (
            <form onSubmit={requestReset} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="id">Username atau email</Label>
                <Input
                  id="id"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                Minta reset
              </Button>
            </form>
          ) : (
            <form onSubmit={doReset} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="token">Token</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="np">Password baru</Label>
                <Input
                  id="np"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={10}
                />
              </div>
              <Button type="submit" variant="yellow" disabled={loading}>
                Simpan password
              </Button>
            </form>
          )}
          {message ? (
            <Alert variant="success">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <p className="text-center text-sm">
            <Link
              href="/auth/login"
              className="font-semibold text-primary hover:underline"
            >
              Kembali ke login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
