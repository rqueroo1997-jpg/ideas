"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { incorporarPersonaAction, renovarCredencialesAction, toggleCuentaAction } from "@/lib/actions/personal";
import type { ActionState } from "@/lib/actions/material";
import { ScopeToolbar } from "../scope-toolbar";
import type { ResolvedScope } from "@/lib/rbac";

export interface PersonalRow {
  id: number;
  nombre: string;
  antiguedadLabel: string;
  seccionLabel: string;
  estadoLabel: string;
  tagClass: string;
  desde: string;
  hasta: string;
  usuario: string | null;
  cuentaCreada: boolean;
  activo: boolean;
  canGestionar: boolean;
}

interface Stats {
  total: number;
  activo: number;
  curso: number;
  rebajado: number;
}

const initial: ActionState = { error: null };

export function PersonalScreen({
  rows,
  stats,
  operativoPct,
  alerts,
  scope,
  breadcrumb,
  isJefeSeccion,
  jefeSeccionSub,
  pendientes,
}: {
  rows: PersonalRow[];
  stats: Stats;
  operativoPct: number;
  alerts: { tagClass: string; tagLabel: string; text: string }[];
  scope: ResolvedScope;
  breadcrumb: string;
  isJefeSeccion: boolean;
  jefeSeccionSub: string;
  pendientes: { id: number; nombre: string }[];
}) {
  const router = useRouter();
  const [renovando, setRenovando] = useState<PersonalRow | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function onIncorporar(personaId: number) {
    setPendingId(personaId);
    const fd = new FormData();
    fd.set("personaId", String(personaId));
    fd.set("sub", jefeSeccionSub);
    await incorporarPersonaAction(fd);
    setPendingId(null);
    router.refresh();
  }

  async function onToggleCuenta(personaId: number) {
    setPendingId(personaId);
    await toggleCuentaAction(personaId);
    setPendingId(null);
    router.refresh();
  }

  return (
    <>
      <div>
        <h2 style={{ marginBottom: 2 }}>Control de personal</h2>
        <div className="text-muted" style={{ fontSize: 13 }}>{breadcrumb}</div>
      </div>

      <ScopeToolbar scope={scope} />

      {isJefeSeccion && pendientes.length > 0 && (
        <div className="card blueprint" style={{ padding: "var(--space-4)" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <div className="card-kicker">Personal de Transmisiones pendiente de asignar a una sección</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>
            Se incorporará a: {jefeSeccionSub} (cambia la sub-sección en el filtro de arriba si no es la que quieres).
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pendientes.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                <span>{p.nombre}</span>
                <button className="btn btn-secondary" disabled={pendingId === p.id} onClick={() => onIncorporar(p.id)}>
                  Incorporar a mi sección
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="op-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--space-3)" }}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Activo" value={stats.activo} />
        <StatCard label="Curso / vacaciones" value={stats.curso} />
        <StatCard label="Rebajado" value={stats.rebajado} />
      </div>

      <div className="card blueprint" style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-6)", padding: "var(--space-4)", flexWrap: "wrap" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: "50%",
            flex: "none",
            background: `conic-gradient(var(--color-accent) 0 ${operativoPct}%, var(--color-neutral-300) ${operativoPct}% 100%)`,
          }}
        />
        <div>
          <div className="card-kicker">% disponibilidad</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
            <div><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--color-accent)", marginRight: 6 }} />Activo — {operativoPct}%</div>
            <div><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--color-neutral-300)", marginRight: 6 }} />No disponible — {100 - operativoPct}%</div>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {alerts.map((a, i) => (
            <div key={i} className="card blueprint" style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)" }}>
              <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
              <span className={`tag ${a.tagClass}`}>{a.tagLabel}</span>
              <span style={{ fontSize: 14 }}>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card blueprint op-table-wrap" style={{ padding: 0 }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <table className="table" style={{ minWidth: 700 }}>
          <thead>
            <tr><th>Persona</th><th>Antigüedad</th><th>Sección</th><th>Estado</th><th>Desde</th><th>Hasta</th><th>Acceso</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td style={{ fontSize: 12, opacity: 0.75 }}>{p.antiguedadLabel}</td>
                <td>{p.seccionLabel}</td>
                <td><span className={`tag ${p.tagClass}`}>{p.estadoLabel}</span></td>
                <td>{p.desde}</td>
                <td>{p.hasta}</td>
                <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.canGestionar && (
                    <button className="btn btn-ghost" onClick={() => setRenovando(p)}>
                      Renovar usuario / contraseña
                    </button>
                  )}
                  {p.canGestionar && (
                    <button className="btn btn-ghost" disabled={pendingId === p.id} onClick={() => onToggleCuenta(p.id)}>
                      {p.activo ? "Dar de baja" : "Reactivar cuenta"}
                    </button>
                  )}
                  {!p.activo && <span className="tag tag-neutral">Desactivada</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renovando && <RenovarDialog persona={renovando} onClose={() => setRenovando(null)} />}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card blueprint">
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div className="card-kicker">{label}</div>
      <div className="card-title" style={{ fontSize: 28 }}>{value}</div>
    </div>
  );
}

function RenovarDialog({ persona, onClose }: { persona: PersonalRow; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(renovarCredencialesAction, initial);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Renovar usuario / contraseña</div>
        <div className="dialog-body">{persona.nombre}</div>
        <form
          action={async (fd) => {
            await formAction(fd);
            router.refresh();
            onClose();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
        >
          <input type="hidden" name="personaId" value={persona.id} />
          <div className="field">
            <label>Nuevo usuario</label>
            <input className="input" type="text" name="usuario" defaultValue={persona.usuario ?? ""} required />
          </div>
          <div className="field">
            <label>Nueva contraseña</label>
            <input className="input" type="password" name="password" required minLength={6} />
          </div>
          {state.error && <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{state.error}</div>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
