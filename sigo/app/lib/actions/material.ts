"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPersona } from "@/lib/auth";
import { canAgregarMaterial, canReportarAveria, canValidarMaterialPendiente } from "@/lib/rbac";
import { SECCIONES, SUBSECCIONES } from "@/lib/catalog";

export interface ActionState {
  error: string | null;
}
const ok: ActionState = { error: null };

const ESTADOS = ["OPERATIVO", "CONDICIONAL", "INOPERATIVO", "EN_ESCALON", "BAJA"] as const;

const agregarSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  tipo: z.enum(["Oficial", "Fungible"]),
  numeroSerie: z.string().trim().optional(),
  estado: z.enum(ESTADOS),
  seccion: z.enum(SECCIONES),
  sub: z.string().optional(),
});

export async function agregarMaterialAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const persona = await getCurrentPersona();
  if (!persona || !canAgregarMaterial(persona.homeRole)) return { error: "No autorizado." };

  const parsed = agregarSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    numeroSerie: formData.get("numeroSerie") || undefined,
    estado: formData.get("estado"),
    seccion: formData.get("seccion"),
    sub: formData.get("sub") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;
  const sub = d.sub && SUBSECCIONES.includes(d.sub as never) ? d.sub : null;

  const count = await prisma.material.count();
  await prisma.material.create({
    data: {
      codigo: `NEW-${count + 23}`,
      nombre: d.nombre,
      tipo: d.tipo,
      numeroSerie: d.tipo === "Oficial" ? d.numeroSerie || "—" : null,
      seccion: d.seccion,
      sub,
      estado: d.estado,
      responsableId: persona.id,
      addedById: persona.id,
      pendienteValidacion: persona.homeRole === "soldado",
    },
  });

  revalidatePath("/material");
  return ok;
}

const editarSchema = agregarSchema.omit({ seccion: true, sub: true }).extend({
  id: z.coerce.number().int().positive(),
});

export async function editarMaterialAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const persona = await getCurrentPersona();
  if (!persona) return { error: "No autorizado." };

  const parsed = editarSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    numeroSerie: formData.get("numeroSerie") || undefined,
    estado: formData.get("estado"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;

  const material = await prisma.material.findUnique({ where: { id: d.id } });
  if (!material || material.addedById !== persona.id) return { error: "Solo puedes editar material que tú añadiste." };

  await prisma.material.update({
    where: { id: d.id },
    data: {
      nombre: d.nombre,
      tipo: d.tipo,
      numeroSerie: d.tipo === "Oficial" ? d.numeroSerie || "—" : null,
      estado: d.estado,
    },
  });

  revalidatePath("/material");
  return ok;
}

export async function eliminarMaterialPropioAction(materialId: number): Promise<void> {
  const persona = await getCurrentPersona();
  if (!persona) return;

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material || material.addedById !== persona.id || !material.pendienteValidacion) return;

  await prisma.material.delete({ where: { id: materialId } });
  revalidatePath("/material");
}

export async function validarMaterialPendienteAction(materialId: number): Promise<void> {
  const persona = await getCurrentPersona();
  if (!persona || !canValidarMaterialPendiente(persona.homeRole)) return;

  await prisma.material.update({
    where: { id: materialId },
    data: { pendienteValidacion: false },
  });
  revalidatePath("/material");
}

const reportarSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  estado: z.enum(["CONDICIONAL", "INOPERATIVO"]),
});

export async function reportarAveriaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const persona = await getCurrentPersona();
  if (!persona || !canReportarAveria(persona.homeRole)) return { error: "No autorizado." };

  const parsed = reportarSchema.safeParse({
    materialId: formData.get("materialId"),
    estado: formData.get("estado"),
  });
  if (!parsed.success) return { error: "Datos inválidos." };
  const { materialId, estado } = parsed.data;

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material || material.estado === "BAJA") return { error: "No se puede reportar este material." };

  await prisma.$transaction([
    prisma.material.update({ where: { id: materialId }, data: { estado, enRevision: true } }),
    prisma.casoMantenimiento.create({
      data: { materialId, stage: "REPORTADO", reportadoPorId: persona.id },
    }),
  ]);

  revalidatePath("/material");
  revalidatePath("/mantenimiento");
  return ok;
}
