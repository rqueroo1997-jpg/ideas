"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPersona } from "@/lib/auth";
import { canEditCuadrante } from "@/lib/rbac";

async function requireEditor() {
  const persona = await getCurrentPersona();
  if (!persona || !canEditCuadrante(persona.homeRole)) return null;
  return persona;
}

async function cleanupIfEmpty(servicioId: string, fecha: string, slotIndex: number) {
  const row = await prisma.cuadranteExcepcion.findUnique({
    where: { servicioId_fecha_slotIndex: { servicioId, fecha: new Date(`${fecha}T00:00:00.000Z`), slotIndex } },
  });
  if (row && !row.falta && row.overridePersonaId == null) {
    await prisma.cuadranteExcepcion.delete({ where: { id: row.id } });
  }
}

export async function setOverrideAction(
  servicioId: string,
  fecha: string,
  slotIndex: number,
  personaId: number | null,
): Promise<void> {
  if (!(await requireEditor())) return;

  const fechaDate = new Date(`${fecha}T00:00:00.000Z`);
  await prisma.cuadranteExcepcion.upsert({
    where: { servicioId_fecha_slotIndex: { servicioId, fecha: fechaDate, slotIndex } },
    create: { servicioId, fecha: fechaDate, slotIndex, overridePersonaId: personaId },
    update: { overridePersonaId: personaId },
  });
  if (personaId == null) await cleanupIfEmpty(servicioId, fecha, slotIndex);

  revalidatePath("/cuadrantes");
}

export async function toggleFaltaAction(servicioId: string, fecha: string, slotIndex: number): Promise<void> {
  if (!(await requireEditor())) return;

  const fechaDate = new Date(`${fecha}T00:00:00.000Z`);
  const existing = await prisma.cuadranteExcepcion.findUnique({
    where: { servicioId_fecha_slotIndex: { servicioId, fecha: fechaDate, slotIndex } },
  });
  const nextFalta = !existing?.falta;
  await prisma.cuadranteExcepcion.upsert({
    where: { servicioId_fecha_slotIndex: { servicioId, fecha: fechaDate, slotIndex } },
    create: { servicioId, fecha: fechaDate, slotIndex, falta: nextFalta },
    update: { falta: nextFalta },
  });
  if (!nextFalta) await cleanupIfEmpty(servicioId, fecha, slotIndex);

  revalidatePath("/cuadrantes");
}
