# Authz matrix

Source of truth for route guards. Expand as features land.

## Principles

1. **No anonymous mutations** except: login, request-reset, reset-password, health.
2. **Authn** then **status ACTIVE** then **role** then **resource ownership** when path has IDs.
3. Surveyor never manages users/dinas/form templates/settings/project-fields.
4. **No open registration** — users created only by ADMIN.
5. Failed auth returns generic messages where enumeration matters (login, reset).

## Roles

| Capability | ADMIN | SURVEYOR | Anonymous |
|------------|-------|----------|-----------|
| `GET /health` | yes | yes | yes |
| `POST /auth/login` | yes | yes | yes |
| `POST /auth/logout` | yes | yes | no |
| `GET /auth/me` | yes | yes | no |
| `POST /auth/request-reset` | — | — | yes (generic) |
| `POST /auth/reset-password` | — | — | yes (token) |
| `/admin/dinas/*` | yes | no | no |
| `/admin/users/*` | yes | no | no |
| `/admin/settings/*` | yes | no | no |
| `/admin/project-fields/*` | yes | no | no |
| `/admin/form-templates/*` | yes | no | no |
| Own projects/reports | all | own (+ dinas scope later) | no |

## Session

- Cookie name: `pe_smkk_session`
- Flags: `HttpOnly; Secure; SameSite=Lax; Path=/`
- TTL default 2h; remember-me 30d (server-side expiry only)
- Token raw in cookie; **SHA-256** in `sessions.token_hash`
- INACTIVE/SUSPENDED: reject + revoke session
- Password change / deactivate: revoke all sessions for that user
- Admin cannot demote/deactivate/delete **self**

## Rate limits (defaults)

| Action | Limit | Window |
|--------|-------|--------|
| login | 10 / IP | 15 min |
| request-reset | 5 / IP | 15 min |
| reset-password | 10 / IP | 15 min |

## Local seed (not a public API)

```bash
SEED_ADMIN_PASSWORD='YourPass123' npm run seed:admin
```

Uses `wrangler d1 execute --local` only.
