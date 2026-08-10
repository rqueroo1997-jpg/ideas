"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  solicitarPermisoAction,
  aprobarPermisoAction,
  denegarPermisoAction,
  cancelarPermisoAction,
} from "@/lib/actions/permisos";
import type { ActionState } from "@/lib/actions/material";
import { buildYearCalendar } from "@/lib/calendar";
import { TIPOS_CALENDARIO } from "@/lib/catalog";

export interface PermisoRow {
  id: number;
  persona: string;
  tipo: string;
  dias: number;
  rango: string;
  estadoLabel: string;
  tagClass: string;
  canAct: boolean;
  canCancelar: boolean;
  justificante: { id: number; nombre: string } | null;
}

export interface OwnPermiso {
  desde: string;
  hasta: string;
  /** Never DENEGADO — the query that populates this already excludes it. */
  estado: "PENDIENTE_INSTANCIA1" | "PENDIENTE_UNIDAD" | "APROBADO" | "DENEGADO";
}

const initial: ActionState = { error: null };

export function PermisosScreen({ rows, ownPermisos }: { rows: PermisoRow[]; ownPermisos: OwnPermiso[] }) {
  const router = useRouter();
  const [anio, setAnio] = useState(() => new Date().getFullYear());
  const [seleccion, setSeleccion] = useState<Record<string, true>>({});
  const [tipo, setTipo] = useState<string>(TIPOS_CALENDARIO[0]);
  const [state, formAction, pending] = useActionState(solicitarPermisoAction, initial);
  const [pendingRowId, setPendingRowId] = useState<number | null>(null);

  const months = useMemo(() => buildYearCalendar(anio), [anio]);
  const diasSeleccionados = useMemo(() => Object.keys(seleccion).sort(), [seleccion]);

  function existingFor(iso: string) {
    return ownPermisos.find((p) => p.desde <= iso && p.hasta >= iso) ?? null;
  }
  function toggleDia(iso: string) {
    setSeleccion((s) => {
      const next = { ...s };
      if (next[iso]) delete next[iso];
      else next[iso] = true;
      return next;
    });
  }

  async function onAprobar(id: number) {
    setPendingRowId(id);
    await aprobarPermisoAction(id);
    setPendingRowId(null);
    router.refresh();
  }
  async function onDenegar(id: number) {
    setPendingRowId(id);
    await denegarPermisoAction(id);
    setPendingRowId(null);
    router.refresh();
  }
  async function onCancelar(id: number) {
    if (!confirm("¿Cancelar esta solicitud?")) return;
    setPendingRowId(id);
    await cancelarPermisoAction(id);
    setPendingRowId(null);
    router.refresh();
  }

  return (
    <>
      <div>
        <h2 style={{ marginBottom: 2 }}>Panel de permisos</h2>
        <div className="text-muted" style={{ fontSize: 13 }}>
          Solicitud → 1ª instancia (suboficial / jefe de sección) → jefe de unidad
        </div>
      </div>

      <div className="card blueprint" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <button className="btn btn-secondary" onClick={() => setAnio((a) => a - 1)}>‹</button>
          <div className="card-title" style={{ minWidth: 70, textAlign: "center" }}>{anio}</div>
          <button className="btn btn-secondary" onClick={() => setAnio((a) => a + 1)}>›</button>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", fontSize: 11, marginLeft: "auto" }}>
            <Legend color="var(--color-accent)" label="Seleccionado" />
            <Legend color="oklch(60% 0.12 145)" label="Aprobado" />
            <Legend color="oklch(70% 0.12 80)" label="Pendiente" />
            <Legend color="var(--color-neutral-300)" label="Finde / festivo" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
          {months.map((month) => (
            <div key={month.label}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{month.label}</div>
              {month.weeks.map((week, wi) => (
                <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
                  {week.map((cell, di) => {
                    if (!cell) return <div key={di} />;
                    const existing = existingFor(cell.iso);
                    const selected = !!seleccion[cell.iso];
                    const selectable = !cell.isWeekend && !cell.festivo && !existing;
                    let statusClass = "";
                    if (existing) statusClass = existing.estado === "APROBADO" ? "cal-aprobado" : "cal-pendiente";
                    else if (cell.festivo) statusClass = "cal-festivo";
                    else if (cell.isWeekend) statusClass = "cal-weekend";
                    else if (selected) statusClass = "cal-selected";
                    return (
                      <div
                        key={di}
                        className={statusClass}
                        style={{
                          aspectRatio: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          cursor: selectable ? "pointer" : "default",
                          background: "var(--color-bg)",
                        }}
                        onClick={selectable ? () => toggleDia(cell.iso) : undefined}
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <form
        action={async (fd) => {
          fd.set("dias", diasSeleccionados.join(","));
          await formAction(fd);
          router.refresh();
          setSeleccion({});
        }}
        className="card blueprint"
        style={{ padding: "var(--space-4)", gap: "var(--space-2)" }}
      >
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="card-kicker">Solicitar vacaciones / permiso</div>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ maxWidth: 240, margin: 0 }}>
            <label>Solicitud</label>
            <select className="input" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_CALENDARIO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {tipo === "Permiso extraordinario" && (
            <div className="field" style={{ flex: 1, minWidth: 220, margin: 0 }}>
              <label>Justificación (obligatoria, máx. 10 días/año)</label>
              <input className="input" type="text" name="justificacion" placeholder="Motivo del permiso extraordinario" />
            </div>
          )}
          <div className="field" style={{ minWidth: 220, margin: 0 }}>
            <label>Documento justificativo (opcional)</label>
            <input className="input" type="file" name="justificante" accept=".pdf,.doc,.docx,.odt,.jpg,.jpeg,.png" />
          </div>
        </div>
        <div style={{ fontSize: 13 }}>
          <div><span className="text-muted">Días seleccionados:</span> {diasSeleccionados.length}</div>
          {diasSeleccionados.length > 0 && (
            <div className="text-muted" style={{ fontSize: 12 }}>{diasSeleccionados.join(", ")}</div>
          )}
        </div>
        {state.error && <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{state.error}</div>}
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button type="button" className="btn btn-secondary" onClick={() => setSeleccion({})}>
            Limpiar selección
          </button>
          <button type="submit" className="btn btn-primary" disabled={diasSeleccionados.length === 0 || pending}>
            Solicitar vacaciones/permisos
          </button>
        </div>
      </form>

      <div className="card blueprint op-table-wrap" style={{ padding: 0 }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <table className="table" style={{ minWidth: 820 }}>
          <thead>
            <tr><th>Persona</th><th>Tipo</th><th>Días</th><th>Fechas</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.persona}</td>
                <td>{p.tipo}</td>
                <td>{p.dias}</td>
                <td style={{ fontSize: 13 }}>
                  {p.rango}
                  {p.justificante && (
                    <div>
                      <a href={`/api/archivos/${p.justificante.id}`} style={{ fontSize: 11, color: "var(--color-accent-700)" }}>
                        Justificante: {p.justificante.nombre}
                      </a>
                    </div>
                  )}
                </td>
                <td><span className={`tag ${p.tagClass}`}>{p.estadoLabel}</span></td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    {p.canAct && (
                      <>
                        <button className="btn btn-secondary" disabled={pendingRowId === p.id} onClick={() => onAprobar(p.id)}>
                          Aprobar
                        </button>
                        <button className="btn btn-secondary" disabled={pendingRowId === p.id} onClick={() => onDenegar(p.id)}>
                          Denegar
                        </button>
                      </>
                    )}
                    {p.canCancelar && (
                      <button className="btn btn-ghost" disabled={pendingRowId === p.id} onClick={() => onCancelar(p.id)}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span>
      <span style={{ display: "inline-block", width: 10, height: 10, background: color, marginRight: 4 }} />
      {label}
    </span>
  );
}
