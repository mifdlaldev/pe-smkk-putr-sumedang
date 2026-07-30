# UI design system (P8 + enhance)

## Direction

- **Surface:** Operate (app shell) + Configure (forms) + Decide (landing)
- **Stack:** shadcn **base-lyra** preset (`buFywKm`) + Anthropic `frontend-design` skill
- **Brand lock (monolit):** navy `#173e5e` / sidebar `#173f5f`, yellow `#f5c518`, white surfaces
- **Type:** IBM Plex Sans (tegas lapangan) — not Inter default from preset

## Signature

Thin **yellow rail** under navy chrome (`.brand-rail`). No gradient SaaS hero sludge.

## Tooling

```bash
# skill (repo)
npx skills add https://github.com/anthropics/skills --skill frontend-design -y

# shadcn (apps/web only)
cd apps/web
npx shadcn@latest init --preset buFywKm --template next --pointer -y -f
npx shadcn@latest add … -y
```

After init: **re-map** `globals.css` tokens to monolit navy/yellow (preset overwrites).

## Components

`apps/web/src/components/ui/*` — Button (yellow + asChild), Input, Card, Badge (status variants), …

## Shell

`AppShell` + `AppSidebar` — session `/auth/me`, mobile tab strip, desktop sticky sidebar.
