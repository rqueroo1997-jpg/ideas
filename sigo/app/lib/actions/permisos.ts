"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPersona, getViewerContext } from "@/lib/auth";
import { canActInstancia1, canActInstancia2, permisoScopeFor } from "@/lib/rbac";
import { TIPOS_CALENDARIO } from "@/lib/catalog";
import { saveUpload } from "@/lib/storage";
import type { ActionState } from "@/lib/actions/material";

const ok: ActionState = { error: null };

function contiguousBlocks(sortedIsoDays: string[]): string[][] {
  const blocks: string[][] = [];
  let block: string[] = [sortedIsoDays[0]];
  for (let i = 1; i < sortedIsoDays.length; i++) {
    const prev = new Date(sortedIsoDays[i - 1]);
    const cur = new Date(sortedIsoDays[i]);
    if ((cur.getTime() - prev.getTime()) / 86_400_000 === 1) block.push(sortedIsoDays[i]);
    else {
      blocks.push(block);
      block = [sortedIsoDays[i]];
    }
  }
  blocks.push(block);
  return blocks;
}

const solicitarSchema = z.object({
  tipo: z.enum(TIPOS_CALENDARIO),
  dias: z.string().min(1),
  justificacion: z.string().trim().optional(),
});

export async function solicitarPermisoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const persona = await getCurrentPersona();
  if (!persona) return { error: "No autorizado." };

  const parsed = solicitarSchema.safeParse({
    tipo: formData.get("tipo"),
    dias: formData.get("dias"),
    justificacion: formData.get("justificacion") || undefined,
  });
  if (!parsed.success) return { error: "Selecciona al menos un día." };
  const { tipo, justificacion } = parsed.data;
  const dias = parsed.data.dias.split(",").filter(Boolean).sort();
  if (dias.length === 0) return { error: "Selecciona al menos un día." };

  if (tipo === "Permiso extraordinario") {
    if (!justificacion?.trim()) {
      return { error: "La justificación es obligatoria para el permiso extraordinario." };
    }
    const previos = await prisma.permisoRequest.findMany({
      where: { personaId: persona.id, tipo: "Permiso extraordinario", estado: { not: "DENEGADO" } },
      select: { dias: true },
    });
    const yaUsados = previos.reduce((sum, p) => sum + p.dias, 0);
    if (yaUsados + dias.length > 10) {
      return { error: `Supera el máximo de 10 días al año de permiso extraordinario (ya usados: ${yaUsados}).` };
    }
  }

  let justificanteFileId: number | undefined;
  const file = formData.get("justificante");
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = await saveUpload(buffer, file.name);
    const archivo = await prisma.archivoAdjunto.create({
      data: { nombre: file.name, mimeType: file.type || "application/octet-stream", size: file.size, storageKey },
    });
    justificanteFileId = archivo.id;
  }

  const blocks = contiguousBlocks(dias);
  await prisma.permisoRequest.createMany({
    data: blocks.map((b) => ({
      personaId: persona.id,
      tipo,
      desde: new Date(`${b[0]}T00:00:00.000Z`),
      hasta: new Date(`${b[b.length - 1]}T00:00:00.000Z`),
      dias: b.length,
      estado: "PENDIENTE_INSTANCIA1" as const,
      justificacion: tipo === "Permiso extraordinario" ? justificacion : null,
      justificanteFileId,
    })),
  });

  revalidatePath("/permisos");
  return ok;
}

async function requireScopedActor(permisoId: number) {
  const viewer = await getViewerContext();
  if (!viewer) return null;
  const permiso = await prisma.permisoRequest.findUnique({ where: { id: permisoId }, include: { persona: true } });
  if (!permiso) return null;

  const scope = permisoScopeFor(viewer.persona, viewer.activeRole);
  const inScope =
    scope.mode === "all" ||
    (scope.mode === "seccion" && permiso.persona.seccion === scope.seccion) ||
    (scope.mode === "own" && permiso.personaId === scope.personaId);
  if (!inScope) return null;

  return { viewer, permiso };
}

export async function aprobarPermisoAction(permisoId: number): Promise<void> {
  const found = await requireScopedActor(permisoId);
  if (!found) return;
  const { viewer, permiso } = found;

  if (permiso.estado === "PENDIENTE_INSTANCIA1" && canActInstancia1(viewer.activeRole)) {
    await prisma.permisoRequest.update({ where: { id: permisoId }, data: { estado: "PENDIENTE_UNIDAD" } });
  } else if (permiso.estado === "PENDIENTE_UNIDAD" && canActInstancia2(viewer.activeRole)) {
    await prisma.permisoRequest.update({ where: { id: permisoId }, data: { estado: "APROBADO" } });
  } else {
    return;
  }
  revalidatePath("/permisos");
}

export async function denegarPermisoAction(permisoId: number): Promise<void> {
  const found = await requireScopedActor(permisoId);
  if (!found) return;
  const { viewer, permiso } = found;

  const canAct =
    (permiso.estado === "PENDIENTE_INSTANCIA1" && canActInstancia1(viewer.activeRole)) ||
    (permiso.estado === "PENDIENTE_UNIDAD" && canActInstancia2(viewer.activeRole));
  if (!canAct) return;

  await prisma.permisoRequest.update({ where: { id: permisoId }, data: { estado: "DENEGADO" } });
  revalidatePath("/permisos");
}

export async function cancelarPermisoAction(permisoId: number): Promise<void> {
  const persona = await getCurrentPersona();
  if (!persona) return;

  const permiso = await prisma.permisoRequest.findUnique({ where: { id: permisoId } });
  const isPending = permiso?.estado === "PENDIENTE_INSTANCIA1" || permiso?.estado === "PENDIENTE_UNIDAD";
  if (!permiso || permiso.personaId !== persona.id || !isPending) return;

  await prisma.permisoRequest.delete({ where: { id: permisoId } });
  revalidatePath("/permisos");
}
