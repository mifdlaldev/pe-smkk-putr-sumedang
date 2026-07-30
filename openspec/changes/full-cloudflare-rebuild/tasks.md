# Tasks: full-cloudflare-rebuild

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` cancelled

## P0 — Governance (no app rewrite yet)

- [x] Root `AGENTS.md` anti-hallucination / anti-damage
- [x] `openspec/project.md` + `openspec/AGENTS.md`
- [x] Change folder proposal + design + tasks
- [x] User **explicit approve** design → status proposal `approved` (user: “lanjut”)
- [x] Strengthen `.gitignore` for CF secrets / agent junk
- [x] Baseline note: legacy security findings captured in `openspec/specs/legacy-risks.md`

## P1 — Skeleton

- [x] Create monorepo structure (`apps/web`, `apps/api`, `packages/shared`, `packages/db`; legacy → `legacy/`)
- [x] Pin tooling: npm workspaces, TypeScript, wrangler
- [x] `apps/api` Hono hello on Workers + wrangler.toml D1/R2 placeholders
- [x] Drizzle schema v1 empty/migrate pipeline to local D1
- [x] `apps/web` Next minimal deployable to Pages (no business UI yet)
- [x] Shared package: Role, UserStatus, API error shape
- [x] CI lint/typecheck (basic)
- [x] Document local dev in README draft section

## P2 — Auth

- [x] Users table + password hashing (PBKDF2-SHA256 Web Crypto)
- [x] Login / logout / session middleware (HttpOnly cookie)
- [x] Role + status gates (`requireSession` / `requireRole`)
- [x] Rate limit login (+ reset endpoints)
- [x] Password reset token flow (no plaintext password email)
- [x] Authz helpers + tests (crypto + cookies unit)
- [x] Web login pages wired to API (`/auth/login`, `/auth/reset`)
- [x] Authz matrix doc `openspec/specs/authz.md`
- [x] License: proprietary (not MIT)

## P3 — Admin core

- [x] Dinas CRUD (admin)
- [x] Users CRUD (admin) — **no open register**
- [x] System settings
- [x] Project field definitions
- [x] Form template builder abstraction (shared L1/L2 skeleton + sections)
- [x] Local-only `seed:admin` script

## P4 — Surveyor projects & reports + autosave

- [x] `projects` entity + field values
- [x] Reports create/list/get
- [x] Draft PATCH batch + conflict policy (revision 409)
- [x] Client autosave queue + offline/pending/saved indicator
- [x] Submit transition draft→submitted
- [x] L1/L2 answers model

## P8 — UI design system (parity monolit + shadcn)

- [x] Brand tokens: navy `#173e5e` / `#173f5f`, accent yellow, white surfaces
- [x] Tailwind + shadcn-style primitives (Button, Input, Card, Badge, …)
- [x] Field-bold typography (IBM Plex Sans)
- [x] App shell sidebar (role nav mirror monolit)
- [x] Login / reset restyle
- [x] Surveyor projects/reports restyle
- [x] Admin shell routes placeholders

## P5 — R2, approvals, dashboard

- [ ] R2 private upload/download authz
- [ ] Avatar + document attach to answers
- [ ] Approvals multi-type
- [ ] Dashboard stats (efficient queries)

## P6 — Portfolio harden

- [ ] Authz matrix doc complete
- [ ] Secret scan + example env only
- [ ] README architecture + screenshots placeholders
- [ ] License
- [ ] Remove/disable legacy insecure routes from ship path
- [ ] Free-tier runbook (what happens at limit)

## P7 — Migration & cutover

- [ ] Export tools from legacy Prisma DB
- [ ] Import to D1 + verify counts
- [ ] Cutover checklist
- [x] Archive/remove legacy tree (explicit task — user portfolio cleanup 2026-07-30)
- [x] Public repo readiness sign-off (https://github.com/mifdlaldev/pe-smkk-putr-sumedang)

---

## Notes log

| Date | Note |
|------|------|
| 2026-07-30 | P0 docs created; implementation blocked until user approves design |
| 2026-07-30 | User “lanjut”; proposal approved; P1 monorepo + legacy/ move started |
| 2026-07-30 | P1 verified: typecheck, vitest health, d1 migrate local, wrangler dry-run, next build, curl /health |
| 2026-07-30 | Legacy tree removed; portfolio docs LICENSE/SECURITY/CONTRIBUTING/ARCHITECTURE; public repo cutover |
| 2026-07-30 | P4: projects/reports/L1-L2 answers + draft autosave + ownership authz |
