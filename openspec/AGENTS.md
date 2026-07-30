# OpenSpec — instruksi agent

Baca **root `AGENTS.md` dulu**. File ini hanya tata cara OpenSpec di repo PE-SMKK.

## Aturan

1. **Spec > opini agent.** Jika kode dan spec beda, perbaiki kode atau ajukan change di `openspec/changes/` — jangan diam-diam ubah produk.
2. **Satu change aktif per inisiatif besar.** Jangan parallel rewrite tanpa nama change.
3. **Jangan implement** change berstatus `draft` sampai user bilang `approved` / “lanjut implementasi”.
4. Setiap PR/commit besar: sebutkan ID change + task ID di pesan commit bila ada.
5. Update `tasks.md` checklist saat task selesai (bukti singkat di notes).

## Layout

```
openspec/
  AGENTS.md          ← file ini
  project.md         ← konstitusi + stack lock
  specs/             ← spek stabil (source of truth domain/teknis)
  changes/           ← proposal & migrasi in-flight
  changes/<id>/
    proposal.md      ← mengapa + scope + non-goals
    design.md        ← arsitektur / security / perf
    tasks.md         ← checklist implementasi
    specs/           ← delta spek (opsional)
```

## Workflow change

1. Buat folder `openspec/changes/<kebab-id>/`.
2. Isi `proposal.md` → user review.
3. Isi `design.md` + `tasks.md` → user approve.
4. Implement task demi task; centang `tasks.md`.
5. Setelah merge stabil: promosikan delta ke `openspec/specs/`, arsipkan change (`changes/archive/` atau status done di proposal).

## Definition of done (task)

- [ ] Kode sesuai task (path nyata)
- [ ] Tidak melanggar STACK LOCK / security non-negotiable
- [ ] Verifikasi dijalankan (perintah + hasil)
- [ ] Tidak ada secret di diff
- [ ] Spec/tasks di-update jika perilaku berubah
