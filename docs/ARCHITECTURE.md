# Architecture

## Goals

1. Full **Cloudflare** free-tier deploy path (Pages + Workers + D1 + R2)
2. **Strict security** for government-adjacent field data
3. **Low-bandwidth** UX for surveyors on weak mobile networks
4. **Process maturity**: OpenSpec + AGENTS.md before rewrites
5. Portfolio-readable structure and CI

## System context

```
┌──────────────────────────────────────────────────────────┐
│                     Cloudflare edge                       │
│  ┌─────────────┐     ┌──────────────┐     ┌───────────┐  │
│  │ Pages       │     │ Worker       │     │ D1 / R2   │  │
│  │ apps/web    │────►│ apps/api     │────►│ packages  │  │
│  │ Next.js     │     │ Hono         │     │ /db       │  │
│  └─────────────┘     └──────────────┘     └───────────┘  │
└──────────────────────────────────────────────────────────┘
```

- **Browser never holds** D1 credentials or R2 secret keys.
- **CORS** allowlists the web origin only (credentials enabled when using cookies).

## Workspaces

| Package | Role |
|---------|------|
| `@pe-smkk/web` | UI; talks to API via `NEXT_PUBLIC_API_URL` |
| `@pe-smkk/api` | HTTP API, authz, bindings to D1/R2 |
| `@pe-smkk/shared` | Enums + Zod contracts shared FE/BE |
| `@pe-smkk/db` | Drizzle schema + SQL migrations for D1 |

## Data (v1 skeleton)

Tables (see `packages/db/src/schema` + `migrations/`):

- `dinas` — organization units
- `users` — credentials hash, role, status, optional dinas
- `projects` — first-class project entity (fixes legacy free-form `projectId`)

Later phases: form templates, answers, approvals, file metadata.

## Autosave (design)

Not implemented in P1; specified for P4:

1. Local queue (IndexedDB or equivalent)
2. Debounce 2–5s
3. Batch `PATCH` draft only
4. Offline banner + retry backoff
5. Never per-keystroke D1 writes (free write quota)

## Auth (P2+)

- Password hash (algorithm chosen in P2 tasks; document in code)
- HttpOnly secure session preferred over long-lived tokens in `localStorage`
- `requireSession` → `requireRole` → `requireResourceAccess`
- Rate limit login/reset

## Free-tier awareness

D1 Workers Free (order-of-magnitude; verify on dashboard): limited rows read/written per day and storage. Design queries and autosave accordingly. Document graceful errors when limits hit.

## CI

GitHub Actions runs `npm install` → `typecheck` → `test:api` on push/PR.

Deploy pipelines (Pages/Workers) are added when credentials and environments exist — not hard-coded production secrets in the repo.
