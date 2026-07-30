import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "PE-SMKK PUTR Sumedang",
  description: "Sistem evaluasi proyek — Cloudflare rebuild (skeleton)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0b1220",
          color: "#e8eefc",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
