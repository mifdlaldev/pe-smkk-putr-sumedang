import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * Fonts: avoid next/font Google fetch at build (network flaky in CI/agents).
 * IBM Plex loaded at runtime via link; CSS vars fall back to system stack.
 */
export const metadata: Metadata = {
  title: "PE-SMKK – Sistem Pemantauan Keselamatan Konstruksi",
  description:
    "Sistem Pemantauan Keselamatan Konstruksi — Dinas PUTR Kabupaten Sumedang (Cloudflare rebuild)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
