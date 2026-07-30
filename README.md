# PE-SMKK PUTR Sumedang

[![CI](https://github.com/mifdlaldev/pe-smkk-putr-sumedang/actions/workflows/ci.yml/badge.svg)](https://github.com/mifdlaldev/pe-smkk-putr-sumedang/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Cloudflare-F38020)](docs/ARCHITECTURE.md)

**Field evaluation & project reporting platform** for PE SMKK / PUTR Sumedang (Indonesia).

Surveyors capture **Laporan 1** and **Laporan 2** in the field; admins configure forms, users, dinas, and review approvals — designed for **poor mobile networks**, **strict authz**, and a **100% Cloudflare free-tier** deploy story.

> Status: **active rebuild** (OpenSpec change `full-cloudflare-rebuild`). P1 monorepo skeleton is live; domain auth & report flows land in later phases. Business roles and report flow are **frozen** — only the technical stack is being replaced.

---

## Why this project (portfolio)

| Concern | Approach |
|---------|----------|
| Single-vendor free cloud | Cloudflare Pages + Workers + D1 + R2 |
| Security | Worker-side session, per-route role **and** resource checks, private R2 |
| Field networks | Small JSON, code-split UI, debounced/batched **autosave drafts** (local queue) |
| Engineering process | `AGENTS.md` + OpenSpec proposals/design/tasks before mass rewrites |
| Maintainability | npm workspaces monorepo; shared enums/contracts; Drizzle migrations |

---

## Architecture (target)

```
Browser (surveyor / admin)
   │  HTTPS, small payloads, retry
   ▼
Cloudflare Pages ── Next.js (apps/web)
   │
   ▼
Cloudflare Worker ── Hono API (apps/api)
   ├── AuthN / AuthZ / Zod validation / rate limits
   ├── Drizzle ──► D1
   └── R2 (private docs & avatars)
```

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · process: [AGENTS.md](AGENTS.md) · specs: [openspec/](openspec/).

---

## Monorepo layout

```
apps/
  web/                 Next.js UI (Pages target)
  api/                 Hono Worker API + wrangler
packages/
  shared/              Domain enums, API shapes (Zod)
  db/                  Drizzle schema + D1 SQL migrations
openspec/              Constitution, change proposals, tasks
docs/                  Architecture & runbooks
.github/workflows/     CI
AGENTS.md              Rules for humans + AI agents
```

---

## Stack lock

| Layer | Choice |
|-------|--------|
| UI | Next.js → Cloudflare Pages |
| API | Hono → Cloudflare Workers |
| DB | Cloudflare D1 + Drizzle |
| Objects | Cloudflare R2 (private) |
| Auth | Strict session on Worker (P2+) |
| Package manager | npm workspaces |

**Not** the production path: Express on Pages, Prisma+Postgres primary, public object storage, open registration endpoints.

---

## Domain (unchanged)

- Roles: `ADMIN` · `SURVEYOR`
- User status: `ACTIVE` · `INACTIVE` · `SUSPENDED`
- Reports: Laporan 1 & 2 (`draft` → `submitted`) + multi-party approvals
- Projects: first-class entity in D1 (schema v1 already includes `projects`)

---

## Quick start (local)

**Requirements:** Node.js ≥ 20, npm.

```bash
git clone https://github.com/mifdlaldev/pe-smkk-putr-sumedang.git
cd pe-smkk-putr-sumedang
npm install

# API (Wrangler + local D1)
cp apps/api/.dev.vars.example apps/api/.dev.vars
# edit APP_ORIGIN / SESSION_SECRET
npm run db:migrate:local
npm run dev:api
# → http://127.0.0.1:8787/health

# Web (second terminal)
cp apps/web/.env.example apps/web/.env.local
npm run dev:web
# → http://localhost:3000
```

### Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run typecheck` | Typecheck all workspaces |
| `npm run test:api` | Vitest (API) |
| `npm run build:api` | Wrangler dry-run bundle |
| `npm run build:web` | Next production build |
| `npm run db:generate` | Drizzle SQL from schema |
| `npm run db:migrate:local` | Apply D1 migrations locally |

---

## Roadmap (OpenSpec)

Tracked in [`openspec/changes/full-cloudflare-rebuild/tasks.md`](openspec/changes/full-cloudflare-rebuild/tasks.md):

1. **P0** Governance — done  
2. **P1** Monorepo skeleton — done  
3. **P2** Auth (hash, session, rate limit, safe reset)  
4. **P3** Admin core (users, dinas, form builder)  
5. **P4** Projects, reports, autosave  
6. **P5** R2, approvals, dashboard  
7. **P6–P7** Harden, docs, cutover  

---

## Security

- No secrets in git (`.env*`, `.dev.vars` ignored; examples only).
- See [SECURITY.md](SECURITY.md) for reporting.
- Design rules: private R2, no plaintext passwords in email, authz matrix before public demo data.

---

## Contributing

Internal / portfolio development. See [CONTRIBUTING.md](CONTRIBUTING.md) and `AGENTS.md` before large changes.

---

## License

[MIT](LICENSE) © 2026 mifdlaldev / PE SMKK Sumedang context.
