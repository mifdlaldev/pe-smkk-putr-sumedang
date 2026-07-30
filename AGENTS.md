# AGENTS.md — PE-SMKK PUTR Sumedang

**Status:** BINDING. Semua AI agent (Hermes, Cursor, Claude, Copilot, dll.) WAJIB patuh.
**Bahasa kerja:** ikuti bahasa user. Kode/identifier/error: English/asli.
**Terakhir disepakati:** 2026-07-30 — full Cloudflare free stack + OpenSpec, flow bisnis tetap.

---

## 0. Satu kalimat misi

Rebuild teknis ke **full Cloudflare (gratis)** dengan **security ketat**, **performa hemat jaringan lapangan**, **autosave/draft**, dan **dokumentasi portfolio-grade** — **tanpa mengubah alur bisnis** PE-SMKK.

---

## 1. LARANGAN KERAS (HALUSINASI & MERUSAK PROYEK)

### 1.1 Anti-halusinasi

1. **JANGAN mengarang** file path, API route, schema field, env var, secret, commit SHA, URL deploy, atau “sudah diimplementasi” tanpa bukti tool (baca file / jalankan perintah / output nyata).
2. **JANGAN mengklaim** test/build/deploy lulus tanpa menjalankan dan menempel output.
3. **JANGAN mengisi** placeholder palsu seolah production (`sk_live_…`, connection string real, password sample yang terlihat nyata).
4. **JANGAN mengutip** docs/API dari ingatan jika ragu — buka docs resmi atau kode di repo dulu.
5. Jika tidak tahu: **tulis “tidak tahu / perlu dicek”** + langkah verifikasi. Bukan tebak.

### 1.2 Anti-rusak proyek

1. **JANGAN** `git push --force`, rewrite history shared, hapus remote branch, atau ubah visibility repo **tanpa perintah eksplisit user**.
2. **JANGAN** commit/push secret (`.env`, key R2, token CF, password, private key).
3. **JANGAN** hapus massal folder `app/`, `prisma/`, data, atau rewrite monolit **tanpa** OpenSpec task yang approved + plan aktif.
4. **JANGAN** “improve” flow bisnis (role, status laporan, approval types, field makna domain) tanpa user setuju tertulis di spec.
5. **JANGAN** install dependency besar / ganti stack di luar **STACK LOCK** (bagian 3) tanpa update OpenSpec + persetujuan user.
6. **JANGAN** matikan security “sementara” (skip auth, public R2, `CORS *` + credentials, seed endpoint terbuka di production).
7. **JANGAN** autosave tiap keystroke ke D1 (bakar free write quota + rusak UX lapangan).
8. **JANGAN** edit file di luar scope task aktif. Scope creep = stop + tanya user.
9. **JANGAN** merge/commit half-broken yang bikin `main` tidak build — kerja di branch fitur.
10. **JANGAN** meniru bug legacy (create-user tanpa authz, middleware blokir reports, bucket public, plain password di email) di stack baru.

### 1.3 Perintah merusak — butuh konfirmasi user

Sebelum: `rm -rf` luas, drop database, wipe R2 bucket, `wrangler delete`, ganti production secrets, publish repo public, migrasi data irreversible — **tanya user dulu**, jelaskan dampak 1–3 kalimat.

---

## 2. Flow bisnis — JANGAN UBAH (kecuali spec change disetujui)

| Item | Nilai tetap |
|------|-------------|
| Roles | `ADMIN`, `SURVEYOR` |
| User status | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| Laporan | Laporan 1 & Laporan 2 (struktur section → subsection → question → subquestion) |
| Report status | `draft`, `submitted` (+ autosave memperkuat draft) |
| Proyek | Field dinamis per report type; surveyor isi nilai |
| Approval types | PEMERIKSA_1..4, KONTRAKTOR, PENGAWAS, TIM_PELAKSANA |
| Dinas | Relasi user ↔ dinas |
| Auth entry | Login username/password; reset password aman (bukan plain password email) |

**Boleh diubah:** implementasi teknis, struktur folder, API shape internal, UX non-breaking (loading, offline indicator), security harden, performa.

**Tidak boleh diam-diam:** hapus role, gabung L1+L2 jadi satu makna domain beda, hilangkan approval, ubah arti skor/grade tanpa spec.

---

## 3. STACK LOCK (disepakati user)

| Layer | Wajib | Dilarang (default) |
|-------|--------|---------------------|
| Frontend | Next.js di **Cloudflare Pages** | Vercel-only assumptions; Express di Pages |
| API | **Hono** di **Cloudflare Workers** | Express.js monolit Node di CF Pages |
| DB | **Cloudflare D1** + **Drizzle ORM** | Prisma+Postgres production path; Hyperdrive+external PG (kecuali spec migrasi nanti) |
| File | **Cloudflare R2** private | Supabase Storage; R2 public list/anon write |
| Auth | Session/token ketat di Worker; role + resource checks | Endpoint “cukup ada token”; create-user publik |
| Deploy | Cloudflare only (free tier dulu) | Multi-cloud wajib bayar untuk MVP showcase |
| Monorepo target | `apps/web`, `apps/api`, `packages/*` (lihat OpenSpec) | Campur API di `app/api` Next jangka panjang |

**Legacy** code is **not** shipped in this portfolio monorepo. Domain lessons live in `openspec/specs/legacy-risks.md`. Do not reintroduce those bugs.

---

## 4. Security non-negotiable (stack baru)

1. Setiap route mutasi/data: **authn + authz** (role **dan** ownership/resource bila perlu).
2. Validasi input (Zod atau setara) di boundary API.
3. R2: private; upload/download lewat Worker (presign atau proxy); batasi MIME/size; path terisolasi per user/report.
4. Secrets hanya di Cloudflare secrets / `.dev.vars` lokal (gitignored).
5. Rate limit login + reset password.
6. Reset password: token one-time berakhir; **jangan** kirim password plain di email.
7. Security headers; cookie `HttpOnly; Secure; SameSite` jika session cookie.
8. Tidak ada seed/init/check endpoint terbuka di production.
9. Logging: no password, no token, no isi dokumen sensitif full.
10. Public portfolio: scrub history/docs dari credential nyata.

---

## 5. Performa & jaringan lapangan (wajib desain)

1. Payload API kecil; pagination; field select sadar.
2. Code-split; bundle sadar; image/doc compress sebelum R2.
3. Cache read-only di edge bila aman.
4. **Autosave:** local-first queue → debounce (mis. 2–5s) → batch PATCH; indikator offline/pending/saved/error; retry backoff.
5. Jangan full-page reload untuk autosave.
6. Hormati free tier D1 (terutama **100k rows written/day** di Workers Free): desain write hemat.

---

## 6. OpenSpec & urutan kerja

Sumber kebenaran proses: `openspec/` (lihat `openspec/AGENTS.md`).

**Urutan default:**

1. Baca `AGENTS.md` + `openspec/project.md` + spec aktif.
2. Task kecil dari plan — jangan big-bang tanpa checklist.
3. Implement sesuai spec; **baca file nyata** sebelum edit.
4. Verifikasi (typecheck/test/build sesuai task).
5. Update OpenSpec/tasks jika perilaku berubah.
6. Commit atomik di branch fitur; pesan jelas.

**Dilarang:** coding massal “karena terlihat bagus” tanpa task OpenSpec/plan.

Plan kerja Hermes (opsional detail): `.hermes/plans/`.

---

## 7. Bukti sebelum klaim

| Klaim | Bukti minimum |
|-------|----------------|
| “File X berisi Y” | `read_file` / search output |
| “Build OK” | perintah build + exit 0 |
| “Authz aman” | test atau checklist route × role |
| “Deployed” | URL + wrangler/pages output |
| “Migrasi selesai” | schema + migration file + verifikasi query |
| “Secret tidak bocor” | `.gitignore` + scan + no secret in tree |

---

## 8. Gaya agent di repo ini

- Ubah minimal yang perlu (surgical).
- Prefer hapus duplikasi L1/L2 lewat abstraksi **setelah** model domain stabil di spec — bukan copy-paste lagi.
- Jangan tambah fitur di luar spek “karena nice to have”.
- Setelah task rumit: ringkas apa yang berubah + cara verifikasi user.
- User minta plan saja → **jangan** implement.

---

## 9. Kontak keputusan manusia

Jika bentrok: **keamanan > kebenaran domain > free-tier survival > performa lapangan > keindahan kode > kecepatan agent.**

Ketidakjelasan requirement → **satu pertanyaan klarifikasi**, jangan asumsi diam-diam yang mengubah produk.

---

## 10. File terkait

| File | Isi |
|------|-----|
| `openspec/project.md` | Konstitusi proyek + stack + constraints |
| `openspec/AGENTS.md` | Cara agent memakai OpenSpec di repo ini |
| `openspec/specs/` | Spec domain & teknis |
| `openspec/changes/` | Change proposal aktif |
| `.hermes/plans/` | Plan implementasi detail (Hermes) |
| `.env.local.example` / `.dev.vars.example` | Template env **tanpa** secret nyata |

---

**Ingat:** agent yang “berhasil” di repo ini = **patuh spec + bukti tool + tidak merusak**, bukan volume diff terbesar.
