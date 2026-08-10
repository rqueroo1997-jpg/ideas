import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/auth";
import { permisoScopeFor, canActInstancia1, canActInstancia2 } from "@/lib/rbac";
import { ESTADO_PERMISO_LABEL, ESTADO_PERMISO_TAG } from "@/lib/catalog";
import { PermisosScreen, type PermisoRow, type OwnPermiso } from "./permisos-screen";

export default async function PermisosPage() {
  const viewer = await getViewerContext();
  if (!viewer) redirect("/login");
  const { persona, activeRole } = viewer;

  const scope = permisoScopeFor(persona, activeRole);
  const where =
    scope.mode === "all"
      ? {}
      : scope.mode === "seccion"
        ? { persona: { seccion: scope.seccion } }
        : { personaId: scope.personaId };

  const [permisos, misPermisos] = await Promise.all([
    prisma.permisoRequest.findMany({
      where,
      include: { persona: { select: { nombre: true } }, justificanteFile: { select: { id: true, nombre: true } } },
      orderBy: { desde: "desc" },
    }),
    prisma.permisoRequest.findMany({
      where: { personaId: persona.id, estado: { not: "DENEGADO" } },
      select: { desde: true, hasta: true, estado: true },
    }),
  ]);

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const rows: PermisoRow[] = permisos.map((p) => ({
    id: p.id,
    persona: p.persona.nombre,
    tipo: p.tipo,
    dias: p.dias,
    rango: `${iso(p.desde)} → ${iso(p.hasta)}`,
    estadoLabel: ESTADO_PERMISO_LABEL[p.estado],
    tagClass: ESTADO_PERMISO_TAG[p.estado],
    canAct:
      (p.estado === "PENDIENTE_INSTANCIA1" && canActInstancia1(activeRole)) ||
      (p.estado === "PENDIENTE_UNIDAD" && canActInstancia2(activeRole)),
    canCancelar:
      p.personaId === persona.id && (p.estado === "PENDIENTE_INSTANCIA1" || p.estado === "PENDIENTE_UNIDAD"),
    justificante: p.justificanteFile ? { id: p.justificanteFile.id, nombre: p.justificanteFile.nombre } : null,
  }));

  const ownPermisos: OwnPermiso[] = misPermisos.map((p) => ({
    desde: iso(p.desde),
    hasta: iso(p.hasta),
    estado: p.estado,
  }));

  return <PermisosScreen rows={rows} ownPermisos={ownPermisos} />;
}
