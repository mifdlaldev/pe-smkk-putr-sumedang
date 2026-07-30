# Design: full-cloudflare-rebuild

## 1. High-level architecture

```
[Browser - poor network]
    |  HTTPS, small JSON, retry
    v
[Cloudflare Pages: Next.js web]
    |  API calls only (no direct D1/R2 secrets)
    v
[Cloudflare Worker: Hono API]
    |-- auth middleware (session)
    |-- authz (role + resource)
    |-- zod validate
    |-- rate limit
    |-- Drizzle --> D1
    |-- R2 binding (presign or stream)
    v
[D1]  [R2 private]
```

**Principle:** browser never holds DB credentials or R2 secret keys.

## 2. Monorepo (target)

```
apps/web/          Next.js UI (Pages)
apps/api/          Hono Worker
packages/shared/   zod schemas, types, role enums, API contracts
packages/db/       drizzle schema + migrations (or inside api — pick one in first impl task)
openspec/          specs & changes
AGENTS.md
```

Legacy `app/`, `prisma/` remain until cutover tasks delete/archive them (explicit task — not accidental `rm`).

## 3. Auth design (strict)

- Credentials login (username + password); password hash (argon2id or bcrypt cost tinggi — pilih satu di impl, dokumentasikan).
- Session: prefer **httpOnly secure cookie** (same-site) issued by Worker; short TTL + refresh/sliding window; “remember me” longer refresh bound server-side.
- JWT in localStorage **discouraged** for primary session (XSS); if used, short-lived access + careful CSRF story.
- Every API route: `requireSession` → `requireRole` → `requireResourceAccess` when ID in path.
- User status INACTIVE/SUSPENDED: reject API + clear session.
- Password reset: opaque token, expiry, single use, hashed at rest; email link only.
- Admin reset: temporary password **or** force-reset link — **never** HTML email with long-lived plain password as primary design (legacy anti-pattern).

### Authz matrix (minimum — expand in specs)

| Area | ADMIN | SURVEYOR |
|------|-------|----------|
| User CRUD | yes | no |
| Dinas / settings / form builder | yes | no |
| Project fields definition | yes | no |
| Own projects + reports | yes (all) | own / dinas scope as legacy rules |
| Submit report | yes (policy) | own draft→submitted |
| Approvals | yes | read/limited per legacy |
| R2 object | if authorized on parent report/user | same |

Exact dinas scoping: mirror legacy intended rules; document in `openspec/specs/authz.md` during tasks — **do not invent looser access**.

## 4. Data model direction

- Keep domain entities; **add real `projects` table** (replace bare string `projectId` without FK).
- Form template tree shared abstractions to kill L1/L2 route explosion.
- Enums in DB/drizzle for role, status, approval type, report status.
- Answers + unique constraints reviewed (reportId+questionId vs subquestions).

Migration: scripted export from Prisma Postgres → D1 (batch); validate row counts.

## 5. R2

- Buckets: e.g. `documents`, `avatars`, `system` (names final in impl).
- Private; no public ACL for sensitive docs.
- Upload: client requests permission → Worker checks authz → returns short-lived upload URL **or** Worker multipart proxy (prefer presign if free/tooling allows; else proxy with size cap).
- Path: `reports/{reportId}/...`, `users/{userId}/avatar` — no user-controlled raw key prefix escape.
- Virus/type: allowlist MIME; max size; optional async scan later (out of MVP).

## 6. Autosave / draft

```
UI edit --> local IndexedDB/queue (pending ops)
        --> debounce 2-5s
        --> PATCH /reports/:id/draft (batch fields)
        --> server merges draft only if status=draft & owner ok
        --> ack --> mark local synced
Offline --> queue grows; banner "offline"; flush on online
Conflict --> last-write-wins + updatedAt check (document); optional 409
```

- Never write per keystroke to D1.
- Submitted reports: autosave off or new revision policy (default: no silent edit after submit unless admin policy spec’d).

## 7. Low network

- Route-based code splitting; avoid huge admin bundles on surveyor paths.
- List endpoints: cursor/limit; no unbounded `findMany`.
- Compress images client-side before upload when possible.
- HTTP caching for public logos only; private data `Cache-Control: private, no-store` default.
- Skeleton UI; optimistic draft indicators.

## 8. Security headers & platform

- Worker: CORS allowlist web origin only; no `*` with credentials.
- CSRF: same-site cookies + origin check on mutating routes.
- `wrangler` secrets; `.dev.vars` gitignored.
- Dependency audit in CI later (task).

## 9. Phased delivery

| Phase | Outcome |
|-------|---------|
| P0 | AGENTS + OpenSpec + git hygiene (this change start) |
| P1 | Monorepo skeleton, D1 schema v1, Hono hello + auth skeleton |
| P2 | Auth complete + users/dinas |
| P3 | Form templates + projects |
| P4 | Reports L1/L2 + autosave |
| P5 | R2 uploads + approvals + dashboard |
| P6 | Hardening, tests, docs, public-ready scrub |
| P7 | Data migration + cutover + archive legacy |

No phase skips authz “temporary”.

## 10. Testing strategy

- Unit: pure shared zod + authz helpers
- Worker: route tests with miniflare/vitest CF
- Critical path e2e later (playwright) optional for portfolio
- Manual authz matrix checklist before public

## 11. Open questions (resolve before or during P1)

1. Exact Next-on-Pages adapter (OpenNext CF version pin).
2. Email provider on free tier (Resend free? CF Email Routing limited?).
3. Single Worker vs separate for cron/queue.
4. Whether demo seed is **local-only** wrangler command (yes recommended).
