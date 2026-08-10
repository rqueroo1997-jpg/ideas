import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/auth";
import { resolveScope, canGestionarPersonal, canIncorporarPersonal } from "@/lib/rbac";
import { ESTADO_PERSONAL_LABEL, ESTADO_PERSONAL_TAG, SUBSECCIONES, breadcrumbText, seccionLabel } from "@/lib/catalog";
import { PersonalScreen, type PersonalRow } from "./personal-screen";

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string; sub?: string }>;
}) {
  const viewer = await getViewerContext();
  if (!viewer) redirect("/login");
  const { persona, activeRole } = viewer;

  const sp = await searchParams;
  const scope = resolveScope(persona, activeRole, { section: sp.seccion, sub: sp.sub });

  const isJefeSeccion = canIncorporarPersonal(activeRole) && persona.seccion === "Transmisiones";
  const jefeSeccionSub = scope.sub ?? SUBSECCIONES[0];

  const [personal, pendientes] = await Promise.all([
    prisma.persona.findMany({
      where: {
        ...(scope.section ? { seccion: scope.section } : {}),
        ...(scope.sub ? { sub: scope.sub } : {}),
      },
      orderBy: { antiguedad: "asc" },
    }),
    isJefeSeccion
      ? prisma.persona.findMany({
          where: { seccion: "Transmisiones", sub: null, rango: { not: "Oficial" } },
          orderBy: { antiguedad: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const canGestionar = canGestionarPersonal(activeRole);
  const rows: PersonalRow[] = personal.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    antiguedadLabel: `${p.rango} · antigüedad ${p.antiguedad}`,
    seccionLabel: seccionLabel(p.seccion, p.sub),
    estadoLabel: ESTADO_PERSONAL_LABEL[p.estado],
    tagClass: ESTADO_PERSONAL_TAG[p.estado],
    desde: p.desde ? p.desde.toISOString().slice(0, 10) : "-",
    hasta: p.hasta ? p.hasta.toISOString().slice(0, 10) : "-",
    usuario: p.usuario,
    cuentaCreada: p.cuentaCreada,
    activo: p.activo,
    canGestionar,
  }));

  const total = personal.length;
  const activo = personal.filter((p) => p.estado === "ACTIVO").length;
  const curso = personal.filter((p) => p.estado === "CURSO_VACACIONES").length;
  const rebajado = personal.filter((p) => p.estado === "REBAJADO").length;
  const operativoPct = total ? Math.round((activo / total) * 100) : 0;

  const bajaMedCount = personal.filter((p) => p.estado === "BAJA_MEDICA").length;
  const alerts = [
    ...(bajaMedCount > 0
      ? [{ tagClass: "tag-red", tagLabel: "Baja médica", text: `${bajaMedCount} persona(s) de baja médica, no disponible(s) para servicio.` }]
      : []),
    ...(rebajado > 0
      ? [{ tagClass: "tag-amber", tagLabel: "Rebajado", text: `${rebajado} persona(s) rebajada(s): revisar restricciones antes de asignar servicio.` }]
      : []),
  ];

  return (
    <PersonalScreen
      rows={rows}
      stats={{ total, activo, curso, rebajado }}
      operativoPct={operativoPct}
      alerts={alerts}
      scope={scope}
      breadcrumb={breadcrumbText(scope.section, scope.sub)}
      isJefeSeccion={isJefeSeccion}
      jefeSeccionSub={jefeSeccionSub}
      pendientes={pendientes.map((p) => ({ id: p.id, nombre: p.nombre }))}
    />
  );
}
