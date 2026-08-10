# SIGO — Plataforma de Operatividad (Batallón CG IX)
Architecture & build plan, derived from the design handoff in `design-handoff/`.

Status: **plan for review — no application code written yet.** Nothing below is built; this
is the proposal to sign off on before Phase 0 starts.

## 1. What this is

SIGO is an internal web app for a military unit to manage material inventory, maintenance
tickets, personnel, leave requests, duty rosters, and a document repository with AI-assisted
search — all gated by a 7-level role hierarchy that scopes data by section/subsection. The
source is a static HTML prototype (`design-handoff/Plataforma de Operatividad.dc.html`,
1925 lines) with real interaction logic and seed data but no backend, auth, or persistence.
Full behavioral spec: `design-handoff/README.md`.

The repo is currently empty, so this plan also picks the stack.

## 2. Recommended stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | One deployable for UI + API routes; avoids running/CORS-ing a separate backend for a single-team internal app. Server Components fit the RBAC-scoped-data model well (filter server-side, never ship other sections' data to the client). |
| Database | **Postgres**, accessed via **Prisma** | Relational fits this domain exactly (personas, material, casos, permisos, asignaciones all have real foreign keys and state machines). Prisma migrations give an auditable schema history, important for a system of record. |
| Auth | **Custom credentials auth** (username/password, bcrypt, signed session cookie via `iron-session` or NextAuth Credentials provider) | The spec's login model (persona picks their own name once, sets username/password, no self-serve reset) doesn't map to OAuth/passwordless providers — needs custom logic anyway, so keep it lightweight rather than fighting a provider's assumptions. |
| Styling | **CSS custom properties ported 1:1 from the Industry DS** (`design-handoff/design-handoff/_ds/.../styles.css`) + Tailwind for layout utilities | README is explicit: colors/type/spacing are final values, not placeholders. Port the tokens verbatim instead of re-deriving them from a component library. |
| File storage | **Postgres-adjacent object storage** (S3-compatible bucket, or local disk volume if self-hosted with no cloud budget) | Justificantes (leave docs) and Papeleo documents (PDF/Word) are binary uploads that shouldn't live in the DB as blobs at this scale. |
| AI search (Papeleo) | **Anthropic Claude API** (`claude-sonnet-5`), text extraction via `pdf-parse` (PDF) / `mammoth` (docx) | Detailed in §6 — user confirmed this should be real, not mocked, in this pass. |
| Hosting | Deferred — works on any Node host (Vercel, Fly, a VM) once containerized | Not blocking the plan; revisit once Phase 0 needs a deploy target. |

This is a recommendation, not a locked decision — flag now if a different stack is preferred
(e.g. a Python/Django backend, or Supabase instead of self-managed Postgres) since it's cheap
to change before Phase 0 and expensive after.

## 3. Data model (Prisma-shape sketch)

```
Persona        id, nombre, rango, antiguedad, seccion, sub, estado(Activo/CursoVacaciones/Rebajado/BajaMedica),
               homeRole, usuario, passwordHash, cuentaCreada, activo, viveSealoj, desde, hasta
AccessGrant    personaId → grantedRole   (unique per persona; jefe_unidad/admin manage)
Material       id, codigo, nombre, tipo(Oficial/Fungible), numeroSerie?, seccion, sub?,
               estado(Operativo/Condicional/Inoperativo/EnEscalon/Baja), responsableId,
               prestado, prestadoA?, ubicacion?, pendienteValidacion, addedById
CasoMantenimiento  id, materialId, stage(reportado/en_escalon/en_reparacion/cerrado),
               reportadoPorId, fecha, orden?, lugar?, transportistaId?, solucion?, resultado?
HistorialCaso  id, casoId, fecha, accion, actorId      -- append-only log per ticket
PermisoRequest id, personaId, tipo(enum TIPOS_CALENDARIO), desde, hasta, dias,
               estado(pendiente_instancia1/pendiente_unidad/aprobado/denegado),
               justificacion?, justificanteFileId?, cancelable
Servicio       id (fixed catalog, see §4), label, rango, titulares, suplentes, requiereSealoj, bloque
AsignacionCuadrante  id, servicioId, fecha_or_bloque, slot(titular/suplente),
               personaId, manual(bool), marca(S/I/F/S*)
DocumentoPapeleo  id, titulo, categoria, seccionOrigen, normativa, fecha, tipo, fileId,
               extractedText   -- cached extraction for AI search
Session        standard cookie-session table if not using JWT-only
```

Enums (`Seccion`, `Subseccion`, `TipoPapeleo`, `TipoCalendario`, `Role`) are ported verbatim
from the prototype's `SECCIONES`, `SUBSECCIONES`, `TIPOS_PAPELEO`, `TIPOS_CALENDARIO`,
`ROLE_HOME` constants (lines 1017–1041 of the `.dc.html`) so labels match the Spanish copy
exactly, per the "keep copy verbatim" fidelity note.

## 4. The two pieces of real business logic to port carefully

These aren't just CRUD — they're the parts of the prototype worth reading line-by-line
before implementing, since the rules are specific and easy to get subtly wrong:

- **Cuadrantes rotation** (`.dc.html` ~L1151–1211): seniority-ordered rotation across 7 fixed
  `SERVICIOS`, each with its own titular/suplente headcount and minimum rank; `Suboficial de
  cuartel` runs in Mon–Wed/Wed–Fri/Fri–Mon blocks instead of single days
  (`blockIndexOf`, L1187–1198); summer "Permiso Oficial" (15 Jun–15 Sep, 5+ consecutive
  business days) exempts from rotation (`exentoPorPermisoVerano`, L1199–1202); a missed
  titular is backfilled by that service's imaginaria (suplente).
- **Permisos workflow**: two-stage approval (`pendiente_instancia1` → `pendiente_unidad` →
  `aprobado`/`denegado`), `Permiso extraordinario` capped at 10 days/year with mandatory
  justification, cancel-only-while-pending, calendar cells computed from `FESTIVOS` +
  weekends + existing approved ranges (`buildYearCalendar`, L1043–1066).

Everything else (Material, Mantenimiento's 4-stage pipeline, Personal, Papeleo listing) is
straightforward state-machine CRUD scoped by role/section.

## 5. RBAC approach

Role hierarchy and per-screen visibility rules are fully specified in the README (§"Roles &
Access Model", §"Screens / Views") and in the prototype's `canAgregarMaterial`,
`isJefeUnidad`, `isJefeSeccion`, etc. helpers. Plan: a single `can(action, resource, actor)`
authorization module (not scattered `if (role === ...)` checks across components) so the
~15 distinct permission rules stay in one auditable place and every API route + Server
Component calls through it. Section/subsection scoping is enforced server-side as a query
filter, not a client-side hide — a `soldado` must never receive other sections' rows over
the wire.

## 6. AI search in Papeleo — real implementation

Per your answer, this is built for real rather than left mocked:

1. On document upload, extract text server-side (`pdf-parse` for PDF, `mammoth` for
   `.docx`/`.odt`) and cache it on `DocumentoPapeleo.extractedText`.
2. On a search query, send the extracted text of matching/candidate documents + the user's
   question to the Claude API and return a grounded answer citing the source document —
   same "don't invent, say when unsure" instruction the prototype's
   `PAPELEO_SYSTEM_PROMPT` (L1076–1079) already specifies for the adjacent leave-request
   review assistant; reuse that same guardrail pattern for document Q&A.
3. Needs `ANTHROPIC_API_KEY` configured as an env var on whatever host runs this — flag if
   there's a preferred existing account/key to use versus provisioning a new one.
4. Scope check for later: full corpus semantic search (embeddings + vector index) vs.
   simpler keyword-prefilter + full-text-to-Claude (cheaper, likely sufficient at the
   expected document-count scale for one battalion). Recommend starting with the simpler
   approach and only adding embeddings if the document count grows past what fits in one
   prompt.

## 7. Build phases

Each phase ends in a working, deployable increment — not a stub.

- **Phase 0 — Foundation. ✅ Done** (see `app/`). Next.js 16 + TypeScript scaffold, Prisma 7
  schema + migrations for the full model in §3 (driver-adapter setup, since Prisma 7 requires
  one), design tokens ported verbatim into `app/globals.css` with self-hosted Barlow/Barlow
  Condensed via `next/font`, auth (login, "primer acceso" first-access flow, iron-session,
  role-view switch), layout shell (sidebar/tab-bar nav, breadcrumb, role switcher), and a seed
  script porting the prototype's placeholder roster/material/etc. Deactivated-account login
  block (README open item #2) is enforced on every request via `getCurrentPersona()`, not just
  at login. Verified with a full browser run: primer-acceso → login → role-scoped breadcrumb →
  nav → logout → wrong-password rejection, plus a clean `next build`.
- **Phase 1 — Material + Mantenimiento. ✅ Done** (see `app/app/(app)/material/`,
  `.../mantenimiento/`). Dashboard stats/donut, section/sub toolbar, add/edit/delete-own-
  pending material, Suboficial validation, the 4-stage repair ticket pipeline with historial
  log entries per transition. Fixed two role-scope bugs the prototype's own state-derivation
  formula would have had (suboficial locked to one sub-section, and no section filter at all
  on maintenance tickets for any non-soldado role) — see `lib/rbac.ts` for the reasoning.
  Verified across three roles in a browser (soldado add + report avería, suboficial validate
  and drive a ticket through all four stages, confirmed section-scoping) plus a clean build.
- **Phase 2 — Personal + Permisos. ✅ Done** (see `app/app/(app)/personal/`, `.../permisos/`).
  Roster with jefe_unidad-only credential renewal and account activation toggle, jefe_seccion's
  incorporate-pending-personnel panel; year calendar with day selection and contiguous-block
  splitting, two-stage approval, extraordinario's 10-day cap, justificante upload served via an
  authenticated route handler rather than the public folder. Same README-vs-prototype scope fix
  as Phase 1 applied here too (see `lib/rbac.ts`'s `permisoScopeFor` — dropped a prototype
  branch that let any staff-section role see every permiso unit-wide). Verified across three
  roles including a full two-stage approval traced on one specific request, plus a clean build.
- **Phase 3 — Cuadrantes. ✅ Done** (see `lib/cuadrantes.ts`, `app/app/(app)/cuadrantes/`).
  The seniority rotation formula, block scheduling for suboficial_cuartel, falta → imaginaria
  promotion, manual overrides. Redesigned the schema from Phase 0's `AsignacionCuadrante`
  (assumed one row per day) to `CuadranteExcepcion` (exceptions only) once the actual — fully
  computed, not stored — algorithm was understood. Same README-vs-prototype-code pattern as
  Phases 1-2 turned up two more real fixes: `canEditCuadrante` now matches the README's five
  editing roles instead of the prototype's `cabo_acceso`-only check, and the summer exemption
  now actually checks the 15 Jun-15 Sep window. Verified in a browser across roles plus a clean
  build.
- **Phase 4 — Papeleo + real AI search. ✅ Done** (see `lib/ai.ts`, `lib/actions/papeleo.ts`,
  `app/app/(app)/papeleo/`). Document upload with server-side text extraction (`pdf-parse` for
  PDF, `mammoth` for `.docx`, cached on `DocumentoPapeleo.extractedText`), a real Claude-backed
  document search that returns a grounded answer citing source documents (upgraded from the
  prototype's mocked id-only matching, per the README's "retrieval/QA" open item and §6.2's
  keyword-prefilter-then-full-text approach), and the permiso-text reviewer ported from the
  prototype's `PAPELEO_SYSTEM_PROMPT`. `canSubirDocumento` (staff sections S1-S4 + admin)
  gates the upload button; the document repository itself is visible to every logged-in
  persona, same as the prototype. The authenticated file route (`api/archivos/[id]`) now also
  serves Papeleo document downloads alongside justificantes. Verified in a browser across two
  roles (upload button gating, document list, both AI panels degrading gracefully with a
  friendly error since no real `ANTHROPIC_API_KEY` is configured in this sandbox — see open
  item #2) plus a clean build. Access grants UI and a real notifications count are deferred to
  Phase 5 hardening, since they're small and independent of the AI work this phase was about.
- **Phase 5 — Hardening. ✅ Done.** Confirmed the 880px responsive breakpoint built in Phase 0
  (sidebar → tab bar, 4→2 stat columns, 92vw dialogs, stacked toolbars) still holds with no
  horizontal overflow on any screen, including the new Papeleo screen — checked at 375px across
  all six screens in a browser. Ran a role-matrix pass across jefe_unidad, jefe_seccion,
  suboficial, cabo_acceso, cabo, and soldado test accounts (cabo_acceso/cabo didn't have test
  logins yet, created via primer acceso) verifying each rbac.ts predicate's real effect in the
  browser (cuadrantes edit, material add, papeleo upload, grants panel, personal credential
  renewal) — all matched the README's table with no gaps. Built the access grants UI (`+
  Conceder acceso` panel on the Material dashboard, jefe_unidad/admin-only, ported from the
  prototype's `concederAcceso`/`revocarAcceso`/`grantsList` state, backed by the `AccessGrant`
  model) and verified the full grant→role-switch→revoke cycle end-to-end, including that a
  granted `cabo_acceso` view correctly unlocks cuadrantes editing for the grantee. Replaced the
  `notificacionesCount={0}` stub in `app/(app)/layout.tsx` with `lib/notifications.ts`, a real
  query porting the prototype's exact formula (own permiso requests just resolved + closed
  maintenance cases on material the viewer added). Added `prisma/import-roster.ts` (`npm run
  db:import-roster -- path.csv`), an idempotent CSV importer that upserts personas by `nombre`
  without touching login/account fields — tested against create, update, and validation-error
  paths against the dev database.

Proceeding phase-by-phase with a checkpoint after each, per your "full build, in phases"
answer — I'll report back at the end of each phase rather than going silent for the whole
build.

## 8. Open items

Resolved for Phase 0 with defaults, since you said "ok" to proceed: stack as proposed in §2,
local disk for file storage until Phase 2 needs it for real, prototype `SEED_PERSONAL` kept as
placeholder roster. Still open:

1. **`DATABASE_URL` for anywhere other than this dev sandbox.** Phase 0 runs against a local
   Postgres 16 instance inside this container (not committed, not portable) — a real
   deployment needs its own Postgres and connection string.
2. **`ANTHROPIC_API_KEY`** for the real AI search built in Phase 4 (§6) — new key or existing
   account.
3. Hosting target, if known yet (affects nothing about Phase 0–4 code, only deploy config).
4. Real personnel roster, whenever it's ready to replace the placeholder seed data.

## 9. Files in this folder

- `design-handoff/` — the uploaded prototype, copied here verbatim so it's version-controlled
  and every phase can reference exact copy/fields/logic without needing a re-upload.
- `PLAN.md` — this document.
