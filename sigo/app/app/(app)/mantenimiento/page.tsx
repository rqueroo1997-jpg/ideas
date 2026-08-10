import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/auth";
import { canActuarMantenimiento, resolveScope } from "@/lib/rbac";
import { seccionLabel } from "@/lib/catalog";
import { MantenimientoScreen, type CasoRow, type CerradoRow } from "./mantenimiento-screen";

export default async function MantenimientoPage() {
  const viewer = await getViewerContext();
  if (!viewer) redirect("/login");
  const { persona, activeRole } = viewer;

  // Same section/sub scoping as Material — soldado only their own material's
  // section+sub, cabo/cabo_acceso the same, suboficial/jefe_seccion their
  // whole section, jefe_unidad/admin unrestricted. The README's "Suboficial/
  // leaders see the section's tickets" is the source of truth here; nobody
  // is left seeing every other section's tickets by default.
  const scope = resolveScope(persona, activeRole, {});
  const casos = await prisma.casoMantenimiento.findMany({
    where: {
      material: {
        ...(scope.section ? { seccion: scope.section } : {}),
        ...(scope.sub ? { sub: scope.sub } : {}),
      },
    },
    include: { material: true, reportadoPor: { select: { nombre: true } } },
    orderBy: { fecha: "desc" },
  });

  const canActuar = canActuarMantenimiento(activeRole);

  const casoRows: CasoRow[] = casos
    .filter((c) => c.stage !== "CERRADO")
    .map((c) => {
      const stageLabel =
        c.stage === "REPORTADO" ? "Reportado" : c.stage === "EN_ESCALON" ? "En escalón" : "En reparación";
      let detail = "";
      if (c.stage === "EN_ESCALON" && c.orden) detail = `Orden ${c.orden} abierta.`;
      if (c.stage === "EN_REPARACION")
        detail = `${c.orden ? `Orden ${c.orden}. ` : ""}En ${c.lugar || "—"}, transportado por ${c.transportista || "—"}.`;
      return {
        id: c.id,
        codigo: c.material.codigo,
        nombre: c.material.nombre,
        seccionLabel: seccionLabel(c.material.seccion, c.material.sub),
        reportadoPor: c.reportadoPor.nombre,
        fecha: c.fecha.toISOString().slice(0, 10),
        stageLabel,
        stageTagClass: c.stage === "REPORTADO" ? "tag-red" : "tag-accent",
        detail: detail || null,
        canValidar: canActuar && c.stage === "REPORTADO",
        canTransportar: canActuar && c.stage === "EN_ESCALON",
        canCerrar: canActuar && c.stage === "EN_REPARACION",
        materialLabel: `${c.material.codigo} — ${c.material.nombre}`,
      };
    });

  const cerradoRows: CerradoRow[] = casos
    .filter((c) => c.stage === "CERRADO")
    .map((c) => ({
      id: c.id,
      codigo: c.material.codigo,
      nombre: c.material.nombre,
      resultado: c.resultado === "BAJA" ? "Baja" : "Operativo",
      resultadoTagClass: c.resultado === "OPERATIVO" ? "tag-green" : "tag-neutral",
    }));

  return <MantenimientoScreen casoRows={casoRows} cerradoRows={cerradoRows} />;
}
