import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/auth";
import { resolveScope, canAgregarMaterial, canReportarAveria, canValidarMaterialPendiente } from "@/lib/rbac";
import { ESTADO_MATERIAL_LABEL, ESTADO_MATERIAL_TAG, breadcrumbText, seccionLabel } from "@/lib/catalog";
import { MaterialScreen, type MaterialRow } from "./material-screen";

export default async function MaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string; sub?: string }>;
}) {
  const viewer = await getViewerContext();
  if (!viewer) redirect("/login");
  const { persona, activeRole } = viewer;

  const sp = await searchParams;
  const scope = resolveScope(persona, activeRole, { section: sp.seccion, sub: sp.sub });

  const material = await prisma.material.findMany({
    where: {
      ...(scope.section ? { seccion: scope.section } : {}),
      ...(scope.sub ? { sub: scope.sub } : {}),
    },
    include: {
      responsable: { select: { nombre: true } },
      casos: { where: { stage: { not: "CERRADO" } }, select: { id: true } },
    },
    orderBy: { codigo: "asc" },
  });

  const rows: MaterialRow[] = material.map((m) => ({
    id: m.id,
    codigo: m.codigo,
    nombre: m.nombre,
    tipo: m.tipo,
    numeroSerie: m.numeroSerie,
    tipoNumeroLabel: `${m.tipo} · ${m.numeroSerie ? `Nº ${m.numeroSerie}` : "sin serie"}`,
    seccionLabel: seccionLabel(m.seccion, m.sub),
    estado: m.estado,
    estadoLabel: ESTADO_MATERIAL_LABEL[m.estado],
    tagClass: ESTADO_MATERIAL_TAG[m.estado],
    pendienteValidacion: m.pendienteValidacion,
    responsableNombre: m.responsable?.nombre ?? "—",
    prestadoLabel: m.prestado ? `Prestado a ${m.prestadoA ?? "—"} · en ${m.ubicacion ?? "—"}` : null,
    canReportar: canReportarAveria(activeRole) && m.casos.length === 0 && m.estado !== "BAJA",
    canValidarMaterial: m.pendienteValidacion && canValidarMaterialPendiente(activeRole),
    canEditarPropio: m.addedById === persona.id && m.pendienteValidacion,
  }));

  const total = material.length;
  const operativo = material.filter((m) => m.estado === "OPERATIVO").length;
  const condicional = material.filter((m) => m.estado === "CONDICIONAL").length;
  const inoperativoBaja = material.filter((m) => m.estado === "INOPERATIVO" || m.estado === "BAJA").length;
  const operativoPct = total ? Math.round((operativo / total) * 100) : 0;

  const inopCount = material.filter((m) => m.estado === "INOPERATIVO").length;
  const bajaCount = material.filter((m) => m.estado === "BAJA").length;
  const alerts = [
    ...(inopCount > 0
      ? [{ tagClass: "tag-red", tagLabel: "Inoperativo", text: `${inopCount} material(es) inoperativo(s) pendiente(s) de resolución.` }]
      : []),
    ...(bajaCount > 0
      ? [{ tagClass: "tag-neutral", tagLabel: "Baja", text: `${bajaCount} material(es) de baja sin sustituir.` }]
      : []),
  ];

  return (
    <MaterialScreen
      rows={rows}
      stats={{ total, operativo, condicional, inoperativoBaja }}
      operativoPct={operativoPct}
      alerts={alerts}
      scope={scope}
      canAgregar={canAgregarMaterial(activeRole)}
      breadcrumb={breadcrumbText(scope.section, scope.sub)}
    />
  );
}
