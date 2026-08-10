import { redirect } from "next/navigation";
import { getViewerContext } from "@/lib/auth";
import { ROLE_HOME, seccionLabel } from "@/lib/catalog";
import { AppShell } from "./app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewerContext();
  if (!viewer) redirect("/login");

  const { persona, activeRole, allowedRoles, homeScope } = viewer;
  const breadcrumb = `Batallón CG IX${
    homeScope.section ? ` › ${seccionLabel(homeScope.section, homeScope.sub)}` : " › Todas las secciones"
  }`;

  return (
    <AppShell
      personaNombre={persona.nombre}
      activeRole={activeRole}
      roleOptions={allowedRoles.map((r) => ({ value: r, label: ROLE_HOME[r].label }))}
      breadcrumb={breadcrumb}
      notificacionesCount={0}
    >
      {children}
    </AppShell>
  );
}
