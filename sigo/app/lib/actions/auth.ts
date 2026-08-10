"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { allowedRoles, getCurrentPersona } from "@/lib/auth";
import { SECCIONES, SUBSECCIONES } from "@/lib/catalog";
import type { Role } from "@/app/generated/prisma/enums";

export interface AuthFormState {
  error: string | null;
}

const loginSchema = z.object({
  usuario: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    usuario: formData.get("usuario"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Usuario y contraseña son obligatorios." };
  }
  const { usuario, password } = parsed.data;

  const persona = await prisma.persona.findUnique({
    where: { usuario: usuario.toLowerCase() },
  });

  if (!persona || !persona.activo || !persona.cuentaCreada || !persona.passwordHash) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const valid = await bcrypt.compare(password, persona.passwordHash);
  if (!valid) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const session = await getSession();
  session.personaId = persona.id;
  session.activeRole = persona.homeRole;
  await session.save();

  redirect("/material");
}

const primerAccesoSchema = z
  .object({
    personaId: z.coerce.number().int().positive(),
    seccion: z.enum(SECCIONES),
    sub: z.string().optional(),
    usuario: z
      .string()
      .trim()
      .min(3, "El usuario debe tener al menos 3 caracteres.")
      .regex(/^[a-z0-9._-]+$/i, "Usuario: solo letras, números, puntos y guiones."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  })
  .refine(
    (data) => data.seccion !== "Transmisiones" || SUBSECCIONES.includes(data.sub as never),
    { message: "Selecciona tu sub-sección dentro de Transmisiones.", path: ["sub"] },
  );

export async function primerAccesoAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = primerAccesoSchema.safeParse({
    personaId: formData.get("personaId"),
    seccion: formData.get("seccion"),
    sub: formData.get("sub") || undefined,
    usuario: formData.get("usuario"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Rellena todos los campos, incluida tu sección." };
  }
  const { personaId, seccion, sub, usuario, password } = parsed.data;

  const persona = await prisma.persona.findUnique({ where: { id: personaId } });
  if (!persona || persona.cuentaCreada) {
    return { error: "Esa persona ya tiene una cuenta creada, o no existe." };
  }

  const usuarioNormalizado = usuario.toLowerCase();
  const existing = await prisma.persona.findUnique({ where: { usuario: usuarioNormalizado } });
  if (existing) {
    return { error: "Ese nombre de usuario ya está en uso." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const updated = await prisma.persona.update({
    where: { id: personaId },
    data: {
      usuario: usuarioNormalizado,
      passwordHash,
      cuentaCreada: true,
      seccion,
      sub: seccion === "Transmisiones" ? sub : null,
    },
  });

  const session = await getSession();
  session.personaId = updated.id;
  session.activeRole = updated.homeRole;
  await session.save();

  redirect("/material");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

const switchRoleSchema = z.object({ role: z.string() });

export async function switchRoleAction(formData: FormData): Promise<void> {
  const parsed = switchRoleSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) return;

  const persona = await getCurrentPersona();
  if (!persona) redirect("/login");

  const requested = parsed.data.role as Role;
  if (!allowedRoles(persona).includes(requested)) return;

  const session = await getSession();
  session.activeRole = requested;
  await session.save();
}
