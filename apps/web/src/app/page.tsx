import { Role } from "@pe-smkk/shared";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8787";

async function fetchHealth(): Promise<{
  ok: boolean;
  body?: unknown;
  error?: string;
}> {
  try {
    const res = await fetch(`${apiUrl}/health`, {
      next: { revalidate: 0 },
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true, body: await res.json() };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "fetch failed",
    };
  }
}

export default async function HomePage() {
  const health = await fetchHealth();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <p style={{ opacity: 0.7, fontSize: 14, letterSpacing: "0.04em" }}>
        PE-SMKK · PUTR Sumedang
      </p>
      <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0 1rem" }}>
        Cloudflare monorepo skeleton
      </h1>
      <p style={{ lineHeight: 1.6, opacity: 0.9 }}>
        Target stack: Next.js (Pages) + Hono (Workers) + D1 + R2. Business flow
        unchanged. Roles still{" "}
        <code style={{ background: "#1a2438", padding: "0.1rem 0.35rem" }}>
          {Role.ADMIN}
        </code>{" "}
        /{" "}
        <code style={{ background: "#1a2438", padding: "0.1rem 0.35rem" }}>
          {Role.SURVEYOR}
        </code>
        .
      </p>

      <section
        style={{
          marginTop: "2rem",
          padding: "1rem 1.25rem",
          borderRadius: 12,
          border: "1px solid #243049",
          background: "#121a2b",
        }}
      >
        <h2 style={{ fontSize: "1rem", marginTop: 0 }}>API health</h2>
        <p style={{ fontSize: 13, opacity: 0.75 }}>
          <code>NEXT_PUBLIC_API_URL</code> = {apiUrl}
        </p>
        {health.ok ? (
          <pre
            style={{
              fontSize: 13,
              overflow: "auto",
              background: "#0b1220",
              padding: "0.75rem",
              borderRadius: 8,
            }}
          >
            {JSON.stringify(health.body, null, 2)}
          </pre>
        ) : (
          <p style={{ color: "#f6a5a5" }}>
            API unreachable: {health.error}. Start with{" "}
            <code>npm run dev:api</code>.
          </p>
        )}
      </section>

      <p style={{ marginTop: "2rem", fontSize: 13, opacity: 0.55 }}>
        <a href="/auth/login" style={{ color: "#93c5fd" }}>
          Sign in
        </a>
        {" · "}
        Spec: <code>openspec/</code> · Rules: <code>AGENTS.md</code>
      </p>
    </main>
  );
}
