import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPersona } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const persona = await getCurrentPersona();
  if (persona) redirect("/material");

  const personasSinCuenta = await prisma.persona.findMany({
    where: { cuentaCreada: false },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-6)" }}>
      <LoginForm personasSinCuenta={personasSinCuenta} />
    </div>
  );
}
