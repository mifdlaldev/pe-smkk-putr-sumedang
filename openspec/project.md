# PE-SMKK PUTR Sumedang — Project Constitution

| Field | Value |
|-------|--------|
| Product | Sistem evaluasi / laporan proyek (Laporan 1 & 2) — PE SMKK / PUTR Sumedang |
| Repo (asal) | `mifdlaldev/PE-SMKK-SUMEDANG-WEB-PKL` (private → target public portfolio) |
| Goal rebuild | Full Cloudflare free tier, security ketat, low-bandwidth field use, autosave draft, OpenSpec docs |
| Business flow | **Unchanged** (see root AGENTS.md §2) |
| Decision date | 2026-07-30 |

## Stack lock (authoritative)

| Concern | Choice |
|---------|--------|
| UI | Next.js on Cloudflare Pages |
| API | Hono on Cloudflare Workers |
| DB | Cloudflare D1 + Drizzle ORM + SQL migrations |
| Objects | Cloudflare R2 (private) |
| Auth | Strict session/JWT at Worker; per-route + resource authz |
| Email (reset) | Provider TBD in change design (must not email plaintext passwords) |
| Package layout (target) | Monorepo: `apps/web`, `apps/api`, `packages/shared` (exact names in migration change) |

### Rejected for default path

- Express.js on Cloudflare Pages (incompatible runtime story)
- Prisma + hosted Postgres as **primary** (not full-CF / not single-vendor free)
- Hyperdrive + external Postgres (extra vendor; Neon sleep hurts field UX) — only if free tier D1 proven insufficient via measured metrics
- Supabase Storage (replaced by R2)
- Vercel as primary deploy target

## Free tier design budget (Workers Free — verify on CF dashboard; numbers drift)

Treat as **soft ceilings**; optimize writes:

- D1: plan for ~5M rows read/day, ~100k rows written/day, ~5 GB storage (Workers Free docs as of research 2026-07)
- Autosave must be debounced + batched + local queue
- R2: private; prefer Worker-mediated access; watch Class A ops

If limits hit: document metrics → propose paid Workers **or** Hyperdrive change — do not silently degrade security.

## Quality bar (portfolio public)

- No secrets in git; clean README (domain + architecture + local dev + deploy)
- OpenSpec readable by reviewers
- Authz matrix documented and tested for critical routes
- Legacy security bugs must not ship in new stack
- License chosen before public

## Legacy system (reference only — code not in tree)

Previous private monolit (Next App Router + Prisma Postgres + NextAuth + Supabase + Vercel) was removed from this public monorepo for portfolio hygiene. Domain constraints and security lessons remain in `openspec/specs/legacy-risks.md` and frozen business flow in root `AGENTS.md`.

Known issues to **not** reintroduce: open `create-user`, token-only middleware without role on many routes, middleware blocking `/reports` paths incorrectly, public storage buckets, plaintext password emails, missing `Project` entity (string `projectId` EAV only), heavy L1/L2 duplication.

## Change control

All large work goes through `openspec/changes/<id>/`. First active change: `full-cloudflare-rebuild`.
