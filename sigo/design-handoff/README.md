
# Handoff: SIGO — Plataforma de Operatividad (Batallón CG IX)

## Overview
SIGO is an internal web platform for a military unit ("Batallón CG IX") to manage: material inventory, maintenance/repair tickets, personnel, duty rosters (cuadrantes), leave requests (permisos), and a document repository (papeleo/oficina) with AI-assisted search. Access is role-based by rank, and each screen shows/hides data and actions depending on the logged-in person's role and section/subsection.

## About the Design Files
The files in this bundle (`Plataforma de Operatividad.dc.html` and any related design-system assets) are **design references built in HTML** — high-fidelity prototypes of layout, content, and interaction behavior. They are not production code to lift directly. The task is to **recreate this design in the target codebase's existing stack** (React/Vue/whatever the receiving app already uses — pick the most appropriate modern framework if none exists yet), backed by a real database and auth system, not client-side state.

## Fidelity
**High-fidelity.** Layout, copy (in Spanish — keep verbatim), component choice, and role-based visibility rules are final. Colors/type/spacing come from the bound "Industry" design system tokens (see Design Tokens below) — treat those as final values, not placeholders. The AI search in "Papeleo" is a **mocked placeholder** in the prototype — it needs a real implementation (see Open Items).

## Roles & Access Model
Role hierarchy (highest to lowest), each with a `home section` / `home subsection` that scopes their default view:

| Role (key) | Label | Home scope | Notes |
|---|---|---|---|
| `admin` | Administrador | All | Bypasses every restriction |
| `jefe_unidad` | Jefe de unidad | All sections | Grants/revokes role-view access to other people; deactivates accounts; sees all data |
| `jefe_seccion` | Jefe de sección | One section (e.g. "Transmisiones") | Manages personnel within own section |
| `suboficial` | Suboficial | Section-locked | Validates material added by soldiers/corporals; acts on maintenance |
| `cabo_acceso` | Cabo (con acceso) | Section + subsection | Like Cabo, plus can edit duty rosters |
| `cabo` | Cabo | Section + subsection | Cannot edit rosters |
| `soldado` | Soldado | Section + subsection | Narrowest scope — own data only |

**Account model:** Each `persona` (person) exists as a personnel record first; they create their login (username + password) once via a "primer acceso" (first access) flow that picks their own name from the unassigned personnel list, sets username/password, and picks their section/subsection. After that, the account is permanent — password reset is admin-only. Inactive/deactivated accounts must be blocked at login.

**Access grants:** `jefe_unidad` (or admin) can grant any other person temporary access to view the app **as if they were a different role** (a role-view switch, stored per-person), and revoke it. The logged-in person's role switcher (top nav segmented control) only shows their home role plus any granted role.

## Screens / Views
Navigation is a persistent sidebar (desktop) / horizontal tab bar (mobile, <880px), with sections in this order:

1. **Material** (`dashboard`) — Inventory dashboard. Section/subsection filters (locked to the user's own scope unless they're a leader role). Stat cards (counts by estado: Operativo/Inoperativo/Baja, etc.). Alert banners for inoperative or unresolved "baja" items. Soldado/Cabo can add material (fungible or with serial number) via "+ Añadir material" — new items are flagged **"pendiente"** (dashed-outline badge) until a Suboficial validates them. Soldado/Cabo can edit/delete only material they personally added while it's still pending.
2. **Mantenimiento** — Repair ticket workflow. Tickets reference a material item, have a `solución` (resolution) field, and keep a repair history log. Soldado sees only tickets tied to their own material; Suboficial/leaders see the section's tickets and can action them.
3. **Personal** — Personnel roster. Jefe de Sección incorporates people into their own section. Jefe de Unidad (and admin) get a deactivation toggle per person (blocks login).
4. **Permisos** — Leave/permission requests. Year-round calendar UI with day-range selection; type picker: `Vacaciones`, `Asuntos propios`, `Permiso oficial`, `Permiso extraordinario` (capped at 10 days/year), `Otros`. File upload for supporting document ("justificante"). Requests can be cancelled while status is "pendiente". Calendar cells are color-coded: selected, aprobado (approved/green), pendiente (amber), denegado (denied/red, strikethrough), and festivo/weekend (neutral, non-selectable). Soldado sees/manages only their own requests; leaders see their scope.
5. **Cuadrantes** — Duty roster. Rotation is seniority-ordered across a fixed list of `SERVICIOS` (services): Cabo cuartel, Cuartelero de batallón, Cuartelero de vestuario, Limpieza SEALOJ, Limpieza de base, Limpieza de lavadero, and Suboficial de cuartel (this last one runs in Mon–Wed / Wed–Fri / Fri–Mon blocks rather than single days). Each service defines required `titulares` (primary) and `suplentes` (backup) headcount and a minimum rank. The logged-in person's own assigned services are highlighted. People on **"Permiso Oficial"** in summer (15 Jun–15 Sep, block of 5+ consecutive business days) are exempted from rotation during that block. Cabo (con acceso), Suboficial, Jefe de Sección and Jefe de Unidad can edit assignments per service/slot (manual override dropdown vs. "rotación automática"); plain Cabo/Soldado are read-only.
6. **Papeleo / oficina** — Document repository for S1/S2/S3/S4 office documents (PDF, Word, etc.), with a "tipo" (document type, drawn from a fixed list — Permiso oficial, Asuntos propios, Permiso por operación de familiar, Permiso extraordinario, Permiso de paternidad, Permiso de lactancia) and a free-text query box that runs an **AI search over the selected document** to surface relevant clauses/answers — currently a mocked/placeholder response in the prototype.

Every screen shows a breadcrumb (`Batallón CG IX › [Sección] › [Subsección]`) reflecting the active filter/scope.

## Interactions & Behavior
- **Login gate:** the whole app is behind `loggedIn` state; unauthenticated users only see the login / first-access flow.
- **First access ("primer acceso"):** pick your own name from personnel who haven't created an account yet → set username + password → pick section (and subsection if "Transmisiones") → logged in as your home role.
- **Role-view switch:** segmented control in the header, populated with the user's home role + any role granted to them; switching changes which screen variant renders without re-login.
- **Notifications badge:** header shows a "N novedades" tag when there are pending items relevant to the user (needs a real count/feed on the backend — currently a simple derived count).
- **Section/subsection filters:** disabled (locked) for scoped roles; free for `jefe_unidad`/admin.
- **Validation workflow:** items/requests move through pending → validated/approved/denied states; only the appropriate role can transition each state.
- **Responsive breakpoint:** 880px — sidebar hides, top tab bar appears, stat grid drops from 4 to 2 columns, dialogs go to 92vw, toolbars stack vertically.
- **Modals:** used for "add material", role grants, editing roster slots, etc. — backdrop + centered dialog, no page navigation.

## State Management (from the prototype — re-derive against a real backend)
Key client state the prototype tracks (this must become server-backed, persisted data, not in-memory state):
- `personal[]` — full personnel list: id, nombre, seccion, sub, homeRole, usuario/password, cuentaCreada (bool), estado (Activo/Baja médica/Rebajado), activo/deactivated flag.
- `accessGrants` — map of personaId → granted role key.
- `material[]` — inventory items: tipo (fungible/serial), serial, seccion, sub, estado (Operativo/Inoperativo/Baja), pendiente (bool), addedBy.
- Mantenimiento tickets — linked to a material id, solución text, historial (array of past actions/dates).
- Permisos requests — personaId, tipo, fechas (range), estado (pendiente/aprobado/denegado), justificante file, is-cancelable flag.
- Cuadrantes assignments — per SERVICIOS entry, per date/block, list of titulares/suplentes person ids, manual override vs auto-rotation.
- Papeleo documents — file, tipo, and AI-search query/response pairs.
- UI/filter state — filterSection, filterSub, active screen, dialog-open flags, form drafts.

State transitions to preserve: material pendiente → validated (Suboficial action); permiso pendiente → aprobado/denegado (leader action) or cancelled (owner action, only while pendiente); account cuentaCreada false → true (first access); account activo → deactivated (Jefe de Unidad/admin action, must block login).

## Design Tokens
Sourced from the bound **Industry** design system (`_ds/industry-.../styles.css`) — pull the actual token values from that stylesheet rather than guessing:
- **Color:** light ground `--color-bg` (~#f2f2f3), text `--color-text` (~#1d1f20), single steel-blue accent `--color-accent` (~#5980a6) with 100–900 tonal ramps (`--color-accent-100…900`, `--color-neutral-100…900`). This is a mono-accent scheme.
- **Status colors** (custom, added on top of the DS, in OKLCH): green (aprobado/operativo), amber (pendiente/rebajado), red (denegado/inoperativo/baja médica) — see `.tag-green/.tag-amber/.tag-red` and `.cal-aprobado/.cal-pendiente/.cal-denegado` in the file's `<style>` block for exact OKLCH values.
- **Type:** Barlow Condensed for headings (`--font-heading`), Barlow for body (`--font-body`).
- **Components:** `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-ghost`, `.card.blueprint` (square-cornered, hairline border, "+" corner registration marks via `<i class="corner tl/tr/bl/br">`), `.tag`, `.field`/`.input`/`.select`, `.seg`/`.seg-opt` (segmented control, used for the role switcher), `.table`, `.dialog`/`.dialog-backdrop`. Do not round corners or add fills to card/figure elements — they are line drawings by design; the primary button is the one solid-fill element.
- **Layout:** modular grid, `--space-*` scale (density 0.85×), `--radius-*` = 4px baked into the scale.
- Breakpoint: 880px for mobile tab-bar / stacked layouts.

## Assets
No photographs or custom icons are used. All visuals are the Industry design system's wireframe components (blueprint cards, buttons, tags) plus native form controls. If icons are wanted, the DS spec calls for Lucide icons at stroke-width 1.5.

## Files
- `Plataforma de Operatividad.dc.html` — the full prototype (single file: markup + inline logic). This is the primary reference; read it top to bottom for exact copy, field lists (SECCIONES, SUBSECCIONES, SERVICIOS, TIPOS_PAPELEO, TIPOS_CALENDARIO, FESTIVOS), and per-role conditional rendering logic (search for `ROLE_HOME`, `NAV_SCREENS`, `canAgregarMaterial`, `isJefeUnidad`, etc. to see exactly which role unlocks which control).
- `_ds/` — the Industry design system source (tokens, component reference pages, `styles.css`). Use this for exact token values and component markup patterns; don't recreate components from scratch if the target stack can reuse the CSS approach, otherwise port the tokens 1:1 into the target styling system.

## Open Items for the Developer
1. **AI search in Papeleo is mocked.** Needs a real implementation: document text extraction (PDF/Word) + retrieval/QA over the selected document. Confirm which LLM/provider the target codebase should call.
2. **Deactivation → login block** is a UI toggle in the prototype with no real auth enforcement behind it — implement server-side account status checks on login.
3. **Notifications count** is a simple derived number in the prototype — decide on a real notification/event model.
4. Replace all client-only state with a proper backend/database; the prototype has no persistence beyond a single session.
