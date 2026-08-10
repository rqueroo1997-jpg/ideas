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
/** Whether this role's sub-section filter is locked to the persona's own sub-section. */
export const isSubLocked = (role: Role) => isSectionLocked(role) && role !== "jefe_seccion";

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
