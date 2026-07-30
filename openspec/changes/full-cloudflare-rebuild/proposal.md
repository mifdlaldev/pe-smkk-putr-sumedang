# Change: full-cloudflare-rebuild

**Status:** `approved` — user “lanjut” 2026-07-30; mulai P1 skeleton  
**Date:** 2026-07-30  
**Owner:** project maintainers + AI agents under AGENTS.md

## Why

Legacy monolit Next + Prisma Postgres + Supabase + Vercel:

- tidak full Cloudflare
- celah security (authz, storage, seed-style routes)
- sulit showcase “modern edge stack” untuk portfolio public
- performa/jaringan lapangan belum jadi first-class

User meminta rebuild teknis **tanpa ubah flow bisnis**, full CF free, security ketat, autosave/draft, plan tercatat (OpenSpec).

## What changes (in scope)

1. Target architecture: Pages (Next) + Workers (Hono) + D1 (Drizzle) + R2 private
2. Auth & authz ketat; rate limit auth; safe password reset
3. Domain model diperjelas (termasuk entity Project yang hilang di legacy) **tanpa ubah makna flow**
4. Autosave / draft: local queue + debounce + batch sync + UI status
5. Low-bandwidth: small payloads, split bundles, careful media
6. Monorepo terstruktur + docs portfolio + AGENTS/OpenSpec
7. Migrasi bertahap dari legacy; production secrets scrub untuk public repo

## Non-goals (out of scope unless new change)

- Mengubah role model atau menghapus Laporan 1/2
- Redesign proses approval dinas di dunia nyata
- Multi-tenant SaaS generik
- Offline-first 100% semua fitur admin (prioritas: form laporan/proyek surveyor)
- Express.js backend
- Bayar cloud wajib untuk MVP

## Success criteria

- [ ] Flow login → admin/surveyor kritis jalan di stack CF
- [ ] Tidak ada route data sensitif tanpa authz
- [ ] R2 private; upload path terisolasi
- [ ] Autosave draft tidak meledak D1 write quota pada pemakaian wajar
- [ ] OpenSpec + README cukup untuk reviewer portfolio
- [ ] Repo bisa dipublic tanpa secret
- [ ] Free tier: documented limits + graceful errors saat limit

## Risks

| Risk | Mitigation |
|------|------------|
| D1 write limit + autosave | Debounce, batch, local queue, metrics |
| Next on Pages complexity | Follow OpenNext/CF adapter docs; thin UI, fat Worker API |
| Data migration from Postgres | Export scripts; dual-run window; checksum counts |
| Agent scope creep | AGENTS.md + tasks checklist |
| Public leak | secret scan, example env only |

## Approval

User setuju stack D1 pure CF (2026-07-30).  
**Implementasi:** P1 skeleton in progress on branch `feature/p1-monorepo-skeleton`.
