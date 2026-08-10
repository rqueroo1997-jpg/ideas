# SIGO — Plataforma de Operatividad

Next.js 16 + TypeScript + Prisma 7 + Postgres implementation of the design handoff in
`../design-handoff/`. See `../PLAN.md` for the architecture, data model, and build roadmap.

## Setup

1. `cp .env.example .env` and fill in `DATABASE_URL` (any Postgres 16+ instance) and
   `SESSION_SECRET` (`openssl rand -base64 32`).
2. `npm install`
3. `npx prisma migrate dev` — creates the schema.
4. `npm run db:seed` — loads the placeholder roster/material/etc. ported from the prototype
   (see `prisma/seed.ts`). Nobody has a login yet; use "Crear cuenta" on `/login` to claim a
   persona via the primer-acceso flow.
5. `npm run dev` — starts the app at http://localhost:3000.

## Structure

- `app/(app)/` — the authenticated shell (sidebar/tab nav, breadcrumb, role switcher) and the
  six screens (`material`, `mantenimiento`, `personal`, `permisos`, `cuadrantes`, `papeleo`).
  Screens beyond Phase 0 are placeholders until their build phase lands.
- `app/login/` — combined login / primer-acceso page.
- `lib/auth.ts`, `lib/session.ts` — session + viewer-context (persona, active role-view, scope).
- `lib/actions/auth.ts` — login/logout/primer-acceso/role-switch Server Actions.
- `lib/catalog.ts` — domain constants (secciones, roles, servicios, tipos...) ported verbatim
  from the prototype, plus Prisma-enum ↔ Spanish-label mappings.
- `prisma/schema.prisma` — full data model. `prisma/seed.ts` — seed script.
- `proxy.ts` — redirects unauthenticated requests to `/login` (Next 16's renamed `middleware`).

## Notes

- Prisma 7 requires a driver adapter — `lib/prisma.ts` wires up `@prisma/adapter-pg` over any
  standard Postgres connection string (not tied to Prisma's managed Postgres).
- Design tokens are ported verbatim into `app/globals.css` from the Industry design system
  (`../design-handoff/_ds/`); fonts (Barlow / Barlow Condensed) are self-hosted via `next/font`.
