import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/catalog";
import type { Role } from "@/app/generated/prisma/enums";
import type { Persona, AccessGrant } from "@/app/generated/prisma/client";

export type PersonaWithGrant = Persona & { accessGrant: AccessGrant | null };

/**
 * Reads the logged-in persona for the current request. Read-only — does not
 * touch the session cookie, since cookie writes are only allowed inside
 * Server Actions/Route Handlers. A deactivated account is treated as logged
 * out here; the stale cookie itself is cleared the next time a Server
 * Action runs (login/logout), which is fine since requireAuth() below
 * always sends deactivated/absent sessions back to /login.
 */
export async function getCurrentPersona(): Promise<PersonaWithGrant | null> {
  const session = await getSession();
  if (!session.personaId) return null;

  const persona = await prisma.persona.findUnique({
    where: { id: session.personaId },
    include: { accessGrant: true },
  });
  if (!persona || !persona.activo) return null;

  return persona;
}

/** The set of role-views this persona may switch to: their home role, plus any granted role. */
export function allowedRoles(persona: PersonaWithGrant): Role[] {
  const roles = [persona.homeRole];
  if (persona.accessGrant) roles.push(persona.accessGrant.grantedRole);
  return [...new Set(roles)];
}

export interface ViewerContext {
  persona: PersonaWithGrant;
  /** Role currently selected via the header's role-view switcher. */
  activeRole: Role;
  allowedRoles: Role[];
  /** Section/subsection this role is locked to, or null for unit-wide roles. */
  homeScope: { section: string | null; sub: string | null };
}

/**
 * Resolves the full viewer context (persona + active role-view + scope) for
 * the current request, falling back to the persona's home role if the
 * session's activeRole is stale (e.g. a grant was revoked after login).
 */
export async function getViewerContext(): Promise<ViewerContext | null> {
  const persona = await getCurrentPersona();
  if (!persona) return null;

  const session = await getSession();
  const roles = allowedRoles(persona);
  const activeRole = roles.includes(session.activeRole as Role)
    ? (session.activeRole as Role)
    : persona.homeRole;

  const home = ROLE_HOME[activeRole];
  return {
    persona,
    activeRole,
    allowedRoles: roles,
    homeScope: { section: home.section, sub: home.sub },
  };
}
