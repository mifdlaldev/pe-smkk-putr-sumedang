# Authz matrix

Source of truth for route guards. Expand as features land.

## Principles

1. **No anonymous mutations** except: login, request-reset, reset-password, health.
2. **Authn** then **status ACTIVE** then **role / ownership**.
3. Surveyor: own projects/reports only. Admin: all.
4. Never open create-user / seed as public HTTP.
5. **R2 private only** — no public bucket; no client-supplied object keys.

## Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | public | |
| POST | `/auth/login` | public + rate limit | |
| POST | `/auth/logout` | session | |
| GET | `/auth/me` | session | |
| POST | `/auth/request-reset` | public + rate limit | |
| POST | `/auth/reset-password` | public + token | |
| * | `/admin/dinas*` | ADMIN | |
| * | `/admin/users*` | ADMIN | |
| * | `/admin/settings*` | ADMIN | |
| * | `/admin/project-fields*` | ADMIN | |
| GET | `/admin/form-templates*` | session | surveyor may list/get |
| POST/PATCH/DELETE | `/admin/form-templates*` | ADMIN | |
| * | `/admin/form-sections*` (mut) | ADMIN | |
| * | `/admin/form-questions*` | ADMIN | |
| GET/POST/PATCH/DELETE | `/projects*` | session + own (admin all) | |
| GET/POST/DELETE | `/reports*` | session + own | |
| PATCH | `/reports/:id/draft` | session + own + draft | revision conflict 409 |
| POST | `/reports/:id/submit` | session + own + draft | |
| POST | `/files/upload` | session + own report (if report_document) | multipart; MIME/size cap |
| GET | `/files` | session + filter authz | `?reportId=` or `?purpose=avatar` |
| GET | `/files/:id/download` | session + own report/owner | stream; no public URL |
| DELETE | `/files/:id` | session + owner or report owner | deletes R2 + row |

## Ownership

- Project: `ownerUserId`
- Report: `userId`
- Document: `ownerUserId` + report access for `report_document`
- Admin bypass via `canAccessOwned`.

## R2 path rules

| Purpose | Key pattern |
|---------|-------------|
| report_document | `reports/{reportId}/{docId}-{safeName}` |
| avatar | `users/{userId}/avatar/{docId}-{safeName}` |

Client never chooses the key. Allowlist MIME: jpeg, png, webp, pdf. Size: avatar 5MB, report 15MB.
