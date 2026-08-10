import { redirect } from "next/navigation";
import { getViewerContext } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/catalog";
import { AppShell } from "./app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewerContext();
  if (!viewer) redirect("/login");

  const { persona, activeRole, allowedRoles } = viewer;

  return (
    <AppShell
      personaNombre={persona.nombre}
      activeRole={activeRole}
      roleOptions={allowedRoles.map((r) => ({ value: r, label: ROLE_HOME[r].label }))}
      notificacionesCount={0}
    >
      {children}
    </AppShell>
  );
}
