"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPersona } from "@/lib/auth";
import { canGestionarPersonal, canIncorporarPersonal } from "@/lib/rbac";
import { SUBSECCIONES } from "@/lib/catalog";
import type { ActionState } from "@/lib/actions/material";

const ok: ActionState = { error: null };

const incorporarSchema = z.object({
  personaId: z.coerce.number().int().positive(),
  sub: z.enum(SUBSECCIONES),
});

export async function incorporarPersonaAction(formData: FormData): Promise<void> {
  const persona = await getCurrentPersona();
  if (!persona || !canIncorporarPersonal(persona.homeRole) || persona.seccion !== "Transmisiones") return;

  const parsed = incorporarSchema.safeParse({
    personaId: formData.get("personaId"),
    sub: formData.get("sub"),
  });
  if (!parsed.success) return;

  await prisma.persona.updateMany({
    where: { id: parsed.data.personaId, seccion: "Transmisiones", sub: null },
    data: { sub: parsed.data.sub },
  });
  revalidatePath("/personal");
}

const renovarSchema = z.object({
  personaId: z.coerce.number().int().positive(),
  usuario: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .regex(/^[a-z0-9._-]+$/i, "Usuario: solo letras, números, puntos y guiones."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export async function renovarCredencialesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getCurrentPersona();
  if (!actor || !canGestionarPersonal(actor.homeRole)) return { error: "No autorizado." };

  const parsed = renovarSchema.safeParse({
    personaId: formData.get("personaId"),
    usuario: formData.get("usuario"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { personaId, usuario, password } = parsed.data;
  const usuarioNormalizado = usuario.toLowerCase();

  const existing = await prisma.persona.findUnique({ where: { usuario: usuarioNormalizado } });
  if (existing && existing.id !== personaId) return { error: "Ese nombre de usuario ya está en uso." };

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.persona.update({
    where: { id: personaId },
    data: { usuario: usuarioNormalizado, passwordHash, cuentaCreada: true },
  });

  revalidatePath("/personal");
  return ok;
}

export async function toggleCuentaAction(personaId: number): Promise<void> {
  const actor = await getCurrentPersona();
  if (!actor || !canGestionarPersonal(actor.homeRole)) return;

  const target = await prisma.persona.findUnique({ where: { id: personaId } });
  if (!target) return;

  await prisma.persona.update({ where: { id: personaId }, data: { activo: !target.activo } });
  revalidatePath("/personal");
}
