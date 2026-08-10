import { redirect } from "next/navigation";
import { getViewerContext } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/catalog";
import { countNotificaciones } from "@/lib/notifications";
import { AppShell } from "./app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewerContext();
  if (!viewer) redirect("/login");

  const { persona, activeRole, allowedRoles } = viewer;
  const notificacionesCount = await countNotificaciones(persona.id);

  return (
    <AppShell
      personaNombre={persona.nombre}
      activeRole={activeRole}
      roleOptions={allowedRoles.map((r) => ({ value: r, label: ROLE_HOME[r].label }))}
      notificacionesCount={notificacionesCount}
    >
      {children}
    </AppShell>
  );
}
