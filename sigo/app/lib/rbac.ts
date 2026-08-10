/**
 * Role predicates and section/sub scoping, ported from the prototype's
 * renderVals() getters (design-handoff/Plataforma de Operatividad.dc.html
 * ~L1572-1628, L1657-1659). Keep in sync with that file if the source
 * design changes — it's the ground truth for exactly which role unlocks
 * which control.
 */
import type { Role } from "@/app/generated/prisma/enums";
import type { PersonaWithGrant } from "@/lib/auth";
import { SUBSECCIONES } from "@/lib/catalog";

export const isAdmin = (role: Role) => role === "admin";
export const isJefeUnidad = (role: Role) => role === "jefe_unidad" || isAdmin(role);
export const isJefeSeccion = (role: Role) => role === "jefe_seccion";

/** Whether this role's section filter is locked to the persona's own section. */
export const isSectionLocked = (role: Role) => role !== "jefe_unidad" && !isAdmin(role);
/**
 * Whether this role's sub-section filter is locked to the persona's own
 * sub-section. Per the design handoff's README role table, `suboficial` and
 * `jefe_seccion` are section-locked only (they validate/manage across their
 * whole section, including every sub-section in it) — only cabo/cabo_acceso/
 * soldado are locked down to their own sub-section too. The prototype's own
 * state-derivation formula (`sectionLocked && role !== 'jefe_seccion'`)
 * disagrees and would also lock suboficial to one sub-section, which
 * contradicts the README and would leave a suboficial unable to validate
 * material reported anywhere outside their own sub-section — so this
 * follows the README's explicit table over that formula.
 */
export const isSubLocked = (role: Role) =>
  role === "cabo" || role === "cabo_acceso" || role === "soldado";

export const canAgregarMaterial = (role: Role) =>
  role === "soldado" || role === "cabo" || role === "cabo_acceso" || isAdmin(role);

export const canReportarAveria = (role: Role) =>
  role === "soldado" || role === "cabo" || role === "cabo_acceso" || isAdmin(role);

export const canValidarMaterialPendiente = (role: Role) =>
  role === "cabo" || role === "cabo_acceso" || role === "suboficial" || isAdmin(role);

/** Suboficial (or admin) drives every mantenimiento stage transition. */
export const canActuarMantenimiento = (role: Role) => role === "suboficial" || isAdmin(role);

export interface ResolvedScope {
  /** Effective section filter — null means "todas las secciones". */
  section: string | null;
  /** Effective sub-section filter — null means "todas". */
  sub: string | null;
  sectionLocked: boolean;
  subLocked: boolean;
  /** Whether the sub-section selector should render at all for this section. */
  showSubFilter: boolean;
}

/**
 * Resolves the effective section/sub scope for a screen's toolbar, given the
 * viewer's role and (for unlocked roles) whatever they picked in the URL.
 * Locked roles always see their own persona's section/sub, regardless of
 * what's in the URL — ported from renderVals() L1574-1578.
 */
export function resolveScope(
  persona: PersonaWithGrant,
  activeRole: Role,
  requested: { section?: string | null; sub?: string | null },
): ResolvedScope {
  const sectionLocked = isSectionLocked(activeRole);
  const subLocked = isSubLocked(activeRole);

  const section = sectionLocked ? persona.seccion : requested.section || null;
  const sub = subLocked ? persona.sub : requested.sub || null;

  const showSubFilter =
    section === "Transmisiones" || (sectionLocked && persona.seccion === "Transmisiones");

  return { section, sub, sectionLocked, subLocked, showSubFilter };
}

export function subOptionsFor(): readonly string[] {
  return SUBSECCIONES;
}

export const canGestionarPersonal = (role: Role) => isJefeUnidad(role);
export const canIncorporarPersonal = isJefeSeccion;

/** Approves pendiente_instancia1 → pendiente_unidad. */
export const canActInstancia1 = (role: Role) => role === "suboficial" || isJefeSeccion(role) || isAdmin(role);
/** Approves pendiente_unidad → aprobado. */
export const canActInstancia2 = isJefeUnidad;

/**
 * Who can see a persona's Permisos requests, ported from renderVals()'s
 * permisosVisibles (~L1698-1706) — with the same README-vs-code correction
 * as isSubLocked: suboficial sees their whole section, not just their own
 * sub-section. Also drops the prototype's `['S1','S2','S3','S4'].indexOf(
 * loggedPerson.seccion) !== -1` branch, which let *any* role (including
 * soldado) see every permiso unit-wide just for being in a staff section —
 * that directly contradicts the README's "Soldado sees/manages only their
 * own requests."
 */
export type PermisoScope =
  | { mode: "all" }
  | { mode: "seccion"; seccion: string }
  | { mode: "own"; personaId: number };

export function permisoScopeFor(persona: PersonaWithGrant, activeRole: Role): PermisoScope {
  if (isJefeUnidad(activeRole)) return { mode: "all" };
  if (isJefeSeccion(activeRole) || activeRole === "suboficial") {
    return { mode: "seccion", seccion: persona.seccion };
  }
  return { mode: "own", personaId: persona.id };
}
