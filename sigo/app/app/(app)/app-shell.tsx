"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { logoutAction, switchRoleAction } from "@/lib/actions/auth";
import { NAV_SCREENS } from "@/lib/catalog";
import type { Role } from "@/app/generated/prisma/enums";

interface RoleOption {
  value: Role;
  label: string;
}

export function AppShell({
  children,
  personaNombre,
  activeRole,
  roleOptions,
  breadcrumb,
  notificacionesCount,
}: {
  children: ReactNode;
  personaNombre: string;
  activeRole: Role;
  roleOptions: RoleOption[];
  breadcrumb: string;
  notificacionesCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelectRole(role: Role) {
    if (role === activeRole || isPending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("role", role);
      await switchRoleAction(fd);
      router.refresh();
    });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <div className="nav op-nav" style={{ borderBottom: "1px solid var(--color-divider)", flexWrap: "wrap" }}>
        <div className="nav-brand">SIGO · Batallón CG IX</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span className="text-muted" style={{ fontSize: 13 }}>{personaNombre}</span>
          {notificacionesCount > 0 && <span className="tag tag-accent">{notificacionesCount} novedades</span>}
          <form action={logoutAction}>
            <button className="btn btn-ghost" type="submit">Cerrar sesión</button>
          </form>
        </div>
        {roleOptions.length > 1 && (
          <div className="op-nav-row2">
            <div className="seg" style={{ overflow: "visible", flexWrap: "wrap", height: "auto", width: "100%" }}>
              {roleOptions.map((r) => (
                <label key={r.value} className="seg-opt" style={{ whiteSpace: "nowrap" }}>
                  <input type="radio" name="role" checked={r.value === activeRole} onChange={() => onSelectRole(r.value)} />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="op-tabs" style={{ borderBottom: "1px solid var(--color-divider)", padding: "var(--space-2) var(--space-3)", gap: "var(--space-1)", overflowX: "auto" }}>
        {NAV_SCREENS.map((n) => (
          <Link key={n.id} href={n.href} className="btn" style={pathname.startsWith(n.href) ? { background: "var(--color-accent)", color: "var(--color-bg)" } : undefined}>
            {n.label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div className="op-sidebar" style={{ width: 230, flex: "none", borderRight: "1px solid var(--color-divider)", padding: "var(--space-4) var(--space-3)", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_SCREENS.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.id}
                href={n.href}
                className="op-sidebar-btn"
                style={{
                  display: "block",
                  textDecoration: "none",
                  padding: "8px 10px",
                  fontSize: 14,
                  color: active ? "var(--color-accent)" : "var(--color-text)",
                  fontWeight: active ? 600 : 400,
                  background: active ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : "transparent",
                }}
              >
                {n.label}
              </Link>
            );
          })}
        </div>

        <div className="op-content" style={{ flex: 1, minWidth: 0, padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="text-muted" style={{ fontSize: 13 }}>{breadcrumb}</div>
          {children}
        </div>
      </div>
    </div>
  );
}
