"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPersona } from "@/lib/auth";
import { canActuarMantenimiento } from "@/lib/rbac";
import type { ActionState } from "@/lib/actions/material";

const ok: ActionState = { error: null };

async function requireActuador() {
  const persona = await getCurrentPersona();
  if (!persona || !canActuarMantenimiento(persona.homeRole)) return null;
  return persona;
}

export async function validarCasoAction(casoId: number): Promise<void> {
  const persona = await requireActuador();
  if (!persona) return;

  const caso = await prisma.casoMantenimiento.findUnique({ where: { id: casoId } });
  if (!caso || caso.stage !== "REPORTADO") return;

  const orden = `OM-2026-0${20 + casoId}`;
  await prisma.$transaction([
    prisma.casoMantenimiento.update({ where: { id: casoId }, data: { stage: "EN_ESCALON", orden } }),
    prisma.material.update({ where: { id: caso.materialId }, data: { estado: "EN_ESCALON", enRevision: false } }),
    prisma.historialCaso.create({
      data: { casoId, actorId: persona.id, accion: `Validado — orden ${orden} abierta.` },
    }),
  ]);

  revalidatePath("/mantenimiento");
  revalidatePath("/material");
}

export async function descartarCasoAction(casoId: number): Promise<void> {
  const persona = await requireActuador();
  if (!persona) return;

  const caso = await prisma.casoMantenimiento.findUnique({ where: { id: casoId } });
  if (!caso || caso.stage !== "REPORTADO") return;

  await prisma.$transaction([
    prisma.material.update({ where: { id: caso.materialId }, data: { estado: "OPERATIVO", enRevision: false } }),
    prisma.casoMantenimiento.delete({ where: { id: casoId } }),
  ]);

  revalidatePath("/mantenimiento");
  revalidatePath("/material");
}

const transportarSchema = z.object({
  casoId: z.coerce.number().int().positive(),
  lugar: z.string().trim().min(1, "Indica el lugar de reparación."),
  transportista: z.string().trim().min(1, "Indica el responsable del transporte."),
});

export async function transportarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const persona = await requireActuador();
  if (!persona) return { error: "No autorizado." };

  const parsed = transportarSchema.safeParse({
    casoId: formData.get("casoId"),
    lugar: formData.get("lugar"),
    transportista: formData.get("transportista"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { casoId, lugar, transportista } = parsed.data;

  const caso = await prisma.casoMantenimiento.findUnique({ where: { id: casoId } });
  if (!caso || caso.stage !== "EN_ESCALON") return { error: "Este caso ya no está en escalón." };

  await prisma.$transaction([
    prisma.casoMantenimiento.update({ where: { id: casoId }, data: { stage: "EN_REPARACION", lugar, transportista } }),
    prisma.historialCaso.create({
      data: { casoId, actorId: persona.id, accion: `Transportado a ${lugar} (${transportista}).` },
    }),
  ]);

  revalidatePath("/mantenimiento");
  return ok;
}

const cerrarSchema = z.object({
  casoId: z.coerce.number().int().positive(),
  resultado: z.enum(["OPERATIVO", "BAJA"]),
  solucion: z.string().trim().optional(),
});

export async function cerrarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const persona = await requireActuador();
  if (!persona) return { error: "No autorizado." };

  const parsed = cerrarSchema.safeParse({
    casoId: formData.get("casoId"),
    resultado: formData.get("resultado"),
    solucion: formData.get("solucion") || undefined,
  });
  if (!parsed.success) return { error: "Datos inválidos." };
  const { casoId, resultado, solucion } = parsed.data;

  const caso = await prisma.casoMantenimiento.findUnique({ where: { id: casoId } });
  if (!caso || caso.stage !== "EN_REPARACION") return { error: "Este caso ya no está en reparación." };

  await prisma.$transaction([
    prisma.casoMantenimiento.update({
      where: { id: casoId },
      data: { stage: "CERRADO", resultado, solucion },
    }),
    prisma.material.update({ where: { id: caso.materialId }, data: { estado: resultado, enRevision: false } }),
    prisma.historialCaso.create({
      data: { casoId, actorId: persona.id, accion: `Cerrado — resultado: ${resultado === "OPERATIVO" ? "reparado" : "baja"}.` },
    }),
  ]);

  revalidatePath("/mantenimiento");
  revalidatePath("/material");
  return ok;
}
