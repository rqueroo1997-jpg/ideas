"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SECCIONES, SUBSECCIONES } from "@/lib/catalog";
import type { ResolvedScope } from "@/lib/rbac";

export function ScopeToolbar({ scope }: { scope: ResolvedScope }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: "seccion" | "sub", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "Todas" || !value) params.delete(key);
    else params.set(key, value);
    if (key === "seccion") params.delete("sub");
    router.push(params.size ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="op-toolbar" style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end" }}>
      <div className="field" style={{ maxWidth: 220, margin: 0 }}>
        <label>Sección</label>
        <select
          className="input"
          value={scope.section ?? "Todas"}
          disabled={scope.sectionLocked}
          onChange={(e) => updateParam("seccion", e.target.value)}
        >
          <option value="Todas">Todas</option>
          {SECCIONES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {scope.showSubFilter && (
        <div className="field" style={{ maxWidth: 200, margin: 0 }}>
          <label>Sub-sección</label>
          <select
            className="input"
            value={scope.sub ?? "Todas"}
            disabled={scope.subLocked}
            onChange={(e) => updateParam("sub", e.target.value)}
          >
            <option value="Todas">Todas</option>
            {SUBSECCIONES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
