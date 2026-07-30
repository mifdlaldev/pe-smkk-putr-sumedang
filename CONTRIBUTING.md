# Contributing

Thanks for interest in PE-SMKK. This repo is primarily a **portfolio + production rebuild** with a locked business domain.

## Ground rules

1. Read **[AGENTS.md](AGENTS.md)** (binding for humans and AI agents).
2. Large changes go through **OpenSpec** (`openspec/changes/<id>/`) — proposal → design → tasks → implement.
3. **Do not change business flow** (roles, report types, approval meanings) without an approved spec change.
4. **Do not** weaken security “temporarily” (open routes, public R2, skip authz).
5. Prefer small commits with clear messages (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

## Dev setup

See root [README.md](README.md). Minimum verification before PR:

```bash
npm run typecheck
npm run test:api
npm run build:api
npm run build:web
```

## Pull requests

- One concern per PR when possible
- Link OpenSpec task IDs in the description
- No secrets, credentials, or production URLs with real keys
- Update docs/spec if behavior changes

## Code style

- TypeScript strict; shared types in `@pe-smkk/shared`
- API validation at the edge of `apps/api`
- Keep L1/L2 logic abstracted — avoid copy-paste explosion
