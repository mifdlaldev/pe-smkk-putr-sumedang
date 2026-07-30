# UI design system (P8)

## Goal

Field-ready PE-SMKK UI: **shadcn-style primitives**, **IBM Plex Sans** (tegas), brand **navy + yellow + white** from monolit PKL.

## Brand

| Token | Value | Use |
|-------|-------|-----|
| Primary / button | `#173e5e` | CTA, headers |
| Sidebar | `#173f5f` | Nav shell |
| Accent yellow | `#f5c518` | Stripe, badges, secondary CTA |
| Surface | white / `#f4f7fb` | Cards, page bg |
| Font | IBM Plex Sans + Mono | Body + code answers |

## Stack

- Tailwind CSS v4 (`@import "tailwindcss"` in `globals.css`)
- `class-variance-authority` + `clsx` + `tailwind-merge`
- Radix Slot / Label / Separator
- Lucide icons
- Components under `apps/web/src/components/ui/*`

## Shell

- `AppSidebar` + `AppShell` — session via `/auth/me`, redirect login if 401
- Nav mirrors monolit: Dashboard / Forms area / Projects / Users / Settings by role

## Out of scope P8

- Full admin tables (API already exists)
- R2 upload UI (P5)
- Chart dashboard (P5)
