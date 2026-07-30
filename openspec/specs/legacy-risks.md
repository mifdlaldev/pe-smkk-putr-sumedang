# Legacy risks (must not reappear)

Captured from audit of pre-migration monolit (2026-07-30). Stack baru **wajib** menghindari ini.

| ID | Issue | Location (legacy) | New-stack rule |
|----|--------|-------------------|----------------|
| L1 | `POST /api/create-user` no session/role in handler | `app/api/create-user/route.ts` | No public user create; admin-only + authz |
| L2 | Many APIs rely on middleware “token exists” only | various `app/api/**` | Per-handler role + resource checks |
| L3 | Middleware blocks `/dashboard/*/reports` for both roles while pages exist | `middleware.ts` | Route allowlist matches real product pages |
| L4 | Supabase anon + public buckets | `lib/supabase.ts`, setup md | R2 private + Worker gate |
| L5 | Admin reset emails plaintext password | `app/api/users/[id]/reset-password` | Token/link or one-time temp with force change — no long-lived plain in email as design |
| L6 | Hardcoded Supabase host / NEXTAUTH_URL in repo | `next.config.ts`, `vercel.json` | Env/bindings only |
| L7 | Seed/init/check endpoints usable when authenticated broadly | `seed-*`, `init/*`, `forms/initialize` | Local/dev CLI only or admin+secret |
| L8 | No `Project` model; orphan `projectId` strings | `schema.prisma` | Real projects table + FK |
| L9 | Extreme L1/L2 file duplication | `app/api/forms/laporan*`, admin pages | Shared form engine |
| L10 | ~989 console logs; dual bcrypt packages | app/lib, package.json | Structured log; one hash lib |

Agents: if implementing a feature, grep this file’s “New-stack rule” before inventing shortcuts.
