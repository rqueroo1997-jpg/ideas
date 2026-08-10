/**
 * Header "N novedades" badge count, ported from the prototype's
 * `notificacionesCount` getter (design-handoff .dc.html ~L1815-1820):
 * the viewer's own permiso requests that just got a decision, plus closed
 * maintenance cases for material the viewer originally added.
 */
import { prisma } from "@/lib/prisma";

export async function countNotificaciones(personaId: number): Promise<number> {
  const [permisosNovedad, casosNovedad] = await Promise.all([
    prisma.permisoRequest.count({
      where: { personaId, estado: { in: ["APROBADO", "DENEGADO"] } },
    }),
    prisma.casoMantenimiento.count({
      where: { stage: "CERRADO", material: { addedById: personaId } },
    }),
  ]);
  return permisosNovedad + casosNovedad;
}
