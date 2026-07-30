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

- [ ] Users table + password hashing
- [ ] Login / logout / session middleware
- [ ] Role + status gates
- [ ] Rate limit login
- [ ] Password reset token flow (no plaintext password email)
- [ ] Authz helpers + tests
- [ ] Web login pages wired to API

## P3 — Admin core

- [ ] Dinas CRUD (admin)
- [ ] Users CRUD (admin) — **no open register**
- [ ] System settings
- [ ] Project field definitions
- [ ] Form template builder abstraction (shared L1/L2)

## P4 — Surveyor projects & reports + autosave

- [ ] `projects` entity + field values
- [ ] Reports create/list/get
- [ ] Draft PATCH batch + conflict policy
- [ ] Client autosave queue + offline banner
- [ ] Submit transition draft→submitted
- [ ] L1/L2 answers model

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
- [ ] Public repo readiness sign-off

---

## Notes log

| Date | Note |
|------|------|
| 2026-07-30 | P0 docs created; implementation blocked until user approves design |
| 2026-07-30 | User “lanjut”; proposal approved; P1 monorepo + legacy/ move started |
| 2026-07-30 | P1 verified: typecheck, vitest health, d1 migrate local, wrangler dry-run, next build, curl /health |
| 2026-07-30 | Legacy tree removed; portfolio docs LICENSE/SECURITY/CONTRIBUTING/ARCHITECTURE; public repo cutover |
