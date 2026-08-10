import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/auth";
import { canEditCuadrante } from "@/lib/rbac";
import { SERVICIOS, ESTADO_PERSONAL_LABEL, ESTADO_PERSONAL_TAG } from "@/lib/catalog";
import { buildMonthDays, buildServicioGrid, exentoPorPermisoVerano } from "@/lib/cuadrantes";
import { CuadrantesScreen, type ServicioCard, type Excluido } from "./cuadrantes-screen";

export default async function CuadrantesPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const viewer = await getViewerContext();
  if (!viewer) redirect("/login");
  const { activeRole } = viewer;

  const sp = await searchParams;
  const now = new Date();
  const anio = sp.anio ? Number(sp.anio) : now.getFullYear();
  const mes = sp.mes ? Number(sp.mes) : now.getMonth();

  const diasDelMes = buildMonthDays(anio, mes);
  const rangeStart = diasDelMes[0].iso;
  const rangeEnd = diasDelMes[diasDelMes.length - 1].iso;

  const [personal, permisosRaw, exceptionsRaw] = await Promise.all([
    prisma.persona.findMany({
      select: { id: true, nombre: true, rango: true, antiguedad: true, estado: true, viveSealoj: true },
    }),
    prisma.permisoRequest.findMany({
      select: { personaId: true, tipo: true, estado: true, dias: true, desde: true, hasta: true },
    }),
    prisma.cuadranteExcepcion.findMany({
      where: { fecha: { gte: new Date(`${rangeStart}T00:00:00.000Z`), lte: new Date(`${rangeEnd}T00:00:00.000Z`) } },
    }),
  ]);

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const permisos = permisosRaw.map((p) => ({ ...p, desde: iso(p.desde), hasta: iso(p.hasta) }));

  const canEdit = canEditCuadrante(activeRole);

  const servicioCards: ServicioCard[] = SERVICIOS.map((svc) => {
    const exceptions = exceptionsRaw
      .filter((e) => e.servicioId === svc.id)
      .map((e) => ({ fecha: iso(e.fecha), slotIndex: e.slotIndex, overridePersonaId: e.overridePersonaId, falta: e.falta }));
    const { pool, poolTooSmall, grid } = buildServicioGrid(svc, personal, permisos, exceptions, diasDelMes, rangeStart, rangeEnd);

    const overrideByKey = new Map(exceptions.filter((e) => e.overridePersonaId != null).map((e) => [`${e.fecha}_${e.slotIndex}`, e.overridePersonaId!]));
    const editRows = canEdit
      ? Array.from({ length: svc.titulares }, (_, s) => ({
          label: svc.titulares > 1 ? `Titular ${s + 1}` : "Titular",
          cells: diasDelMes.map((day) => ({
            fecha: day.iso,
            slotIndex: s,
            value: overrideByKey.get(`${day.iso}_${s}`) ?? null,
          })),
        }))
      : [];

    return {
      id: svc.id,
      label: svc.label,
      subtitle:
        `${svc.titulares}${svc.titulares > 1 ? " titulares" : " titular"} · ${svc.suplentes} imaginaria(s)` +
        (svc.requiereSealoj ? " · viven en SEALOJ" : "") +
        (svc.bloque ? " · relevo lun-mié / mié-vie / vie-lun" : ""),
      poolTooSmall,
      canEdit,
      grid: grid.map((row) => ({ ...row, isMe: row.personaId === viewer.persona.id })),
      poolOptions: pool.map((p) => ({ value: p.id, label: p.nombre })),
      editRows,
    };
  });

  const excluidos: Excluido[] = [
    ...personal
      .filter((p) => p.estado !== "ACTIVO")
      .map((p) => ({ nombre: p.nombre, estadoLabel: ESTADO_PERSONAL_LABEL[p.estado], tagClass: ESTADO_PERSONAL_TAG[p.estado] })),
    ...personal
      .filter((p) => p.estado === "ACTIVO" && exentoPorPermisoVerano(p.id, permisos, rangeStart, rangeEnd))
      .map((p) => ({ nombre: p.nombre, estadoLabel: "Permiso oficial (≥5 días)", tagClass: "tag-accent" })),
  ];

  const cuadranteDias = diasDelMes.map((d) => ({ label: d.label }));
  const mesLabel = new Date(anio, mes, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <CuadrantesScreen
      anio={anio}
      mes={mes}
      mesLabel={mesLabel}
      cuadranteDias={cuadranteDias}
      servicioCards={servicioCards}
      excluidos={excluidos}
    />
  );
}
