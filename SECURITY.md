# Security Policy

## Supported versions

This repository is under active rebuild. Security fixes target the **monorepo** stack (`apps/api`, `apps/web`, `packages/*`) on the default branch.

## Reporting a vulnerability

Do **not** open a public issue for sensitive findings.

1. Email or message the maintainer via GitHub: [@mifdlaldev](https://github.com/mifdlaldev)
2. Include: description, impact, steps to reproduce, affected path/commit if known
3. Allow reasonable time for a fix before public disclosure

## Project security posture (targets)

| Area | Rule |
|------|------|
| Auth | Session/token validated on Worker; short TTL; status gates |
| Authz | Role **and** resource ownership checks on mutating routes |
| Storage | R2 private; no browser-held storage secrets |
| Secrets | Cloudflare secrets / local `.dev.vars` only — never committed |
| Input | Zod (or equivalent) at API boundary |
| Auth endpoints | Rate limited; reset tokens one-time, hashed at rest |
| Logging | No passwords, tokens, or full sensitive document bodies |

Known anti-patterns we refuse to reintroduce are listed in `openspec/specs/legacy-risks.md` (historical lessons).
