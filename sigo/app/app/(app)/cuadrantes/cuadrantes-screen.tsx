"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOverrideAction, toggleFaltaAction } from "@/lib/actions/cuadrantes";

export interface GridCellData {
  mark: "" | "S" | "F" | "I" | "S*";
  fecha: string | null;
  slotIndex: number | null;
}
export interface GridRowData {
  personaId: number;
  nombre: string;
  isMe: boolean;
  cells: GridCellData[];
}
export interface EditRow {
  label: string;
  cells: { fecha: string; slotIndex: number; value: number | null }[];
}
export interface ServicioCard {
  id: string;
  label: string;
  subtitle: string;
  poolTooSmall: boolean;
  canEdit: boolean;
  grid: GridRowData[];
  poolOptions: { value: number; label: string }[];
  editRows: EditRow[];
}
export interface Excluido {
  nombre: string;
  estadoLabel: string;
  tagClass: string;
}

const MARK_STYLE: Record<GridCellData["mark"], React.CSSProperties> = {
  S: { background: "var(--color-accent)", color: "var(--color-bg)", fontWeight: 700 },
  "S*": { background: "var(--color-accent)", color: "var(--color-bg)", fontWeight: 700 },
  F: { background: "oklch(55% 0.16 25)", color: "#fff", fontWeight: 700, textDecoration: "line-through" },
  I: { background: "var(--color-accent-100)", color: "var(--color-accent-800)", fontWeight: 600 },
  "": {},
};

export function CuadrantesScreen({
  anio,
  mes,
  mesLabel,
  cuadranteDias,
  servicioCards,
  excluidos,
}: {
  anio: number;
  mes: number;
  mesLabel: string;
  cuadranteDias: { label: string }[];
  servicioCards: ServicioCard[];
  excluidos: Excluido[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState<Record<string, boolean>>({});

  function navMonth(delta: number) {
    let nextMes = mes + delta;
    let nextAnio = anio;
    if (nextMes < 0) {
      nextMes = 11;
      nextAnio -= 1;
    } else if (nextMes > 11) {
      nextMes = 0;
      nextAnio += 1;
    }
    router.push(`/cuadrantes?anio=${nextAnio}&mes=${nextMes}`);
  }

  function onCellClick(servicioId: string, cell: GridCellData) {
    if (cell.fecha == null || cell.slotIndex == null) return;
    startTransition(async () => {
      await toggleFaltaAction(servicioId, cell.fecha!, cell.slotIndex!);
      router.refresh();
    });
  }

  function onOverrideChange(servicioId: string, fecha: string, slotIndex: number, value: string) {
    startTransition(async () => {
      await setOverrideAction(servicioId, fecha, slotIndex, value === "" ? null : Number(value));
      router.refresh();
    });
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>Cuadrantes inteligentes</h2>
          <div className="text-muted" style={{ fontSize: 13 }}>Rotación por antigüedad</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <button className="btn btn-secondary" onClick={() => navMonth(-1)}>‹ Mes anterior</button>
        <div className="card-title" style={{ minWidth: 180, textAlign: "center", textTransform: "capitalize" }}>{mesLabel}</div>
        <button className="btn btn-secondary" onClick={() => navMonth(1)}>Mes siguiente ›</button>
      </div>

      <div className="card blueprint" style={{ padding: "var(--space-4)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="card-kicker">Reglas activas</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>Rotación por antigüedad: entra un titular (o varios, según el servicio) por día, de más antiguo a más moderno.</li>
          <li>El imaginaria de cada servicio es quien entraría al día siguiente. Si el titular falla, entra el imaginaria en su lugar.</li>
          <li>Solo eximen del servicio: baja, vacaciones de más de 5 días hábiles continuos, rebaje médico o cursos.</li>
          <li>
            El permiso oficial (10 días entre el 15 de junio y el 15 de septiembre, en bloques de 5+5, 10 seguidos o
            como prefiera el personal) solo exime de servicio cuando se disfrutan 5 o más días hábiles seguidos.
          </li>
        </ul>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {servicioCards.map((svc) => (
          <div key={svc.id} className="card blueprint op-table-wrap" style={{ padding: "var(--space-3)" }}>
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <div className="card-title">{svc.label}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>{svc.subtitle}</div>
            {svc.poolTooSmall && (
              <div style={{ fontSize: 12, color: "var(--color-accent-800)" }}>
                Personal disponible insuficiente para cubrir titulares e imaginarias este servicio.
              </div>
            )}
            <table className="table" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  {cuadranteDias.map((d, i) => <th key={i} style={{ textAlign: "center" }}>{d.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {svc.grid.map((row) => (
                  <tr key={row.personaId}>
                    <td style={{ whiteSpace: "nowrap", fontSize: 13, fontWeight: row.isMe ? 700 : 400, color: row.isMe ? "var(--color-accent-800)" : undefined }}>
                      {row.nombre}
                    </td>
                    {row.cells.map((cell, ci) => {
                      const clickable = svc.canEdit && cell.fecha != null;
                      return (
                        <td key={ci} style={{ textAlign: "center", padding: 2 }} onClick={clickable ? () => onCellClick(svc.id, cell) : undefined}>
                          <div
                            style={{
                              ...MARK_STYLE[cell.mark],
                              width: 26,
                              height: 26,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto",
                              fontSize: 12,
                              borderRadius: 2,
                              cursor: clickable ? "pointer" : "default",
                            }}
                          >
                            {cell.mark}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>
              S = servicio (titular) · I = imaginaria · F = falta (no entró) · S* = imaginaria entró por falta del titular
              {svc.canEdit && " · clic en una S para marcar falta"}
            </div>

            {svc.canEdit && (
              <button
                className="btn btn-ghost"
                style={{ marginTop: "var(--space-2)", alignSelf: "flex-start" }}
                onClick={() => setEditOpen((s) => ({ ...s, [svc.id]: !s[svc.id] }))}
              >
                {editOpen[svc.id] ? "Ocultar edición manual" : "Editar manualmente"}
              </button>
            )}

            {svc.canEdit && editOpen[svc.id] && (
              <div style={{ marginTop: "var(--space-3)" }}>
                <div className="card-kicker">Modificar asignación (cualquier motivo)</div>
                <div className="op-table-wrap">
                  <table className="table" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th>Puesto</th>
                        {cuadranteDias.map((d, i) => <th key={i}>{d.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {svc.editRows.map((er, eri) => (
                        <tr key={eri}>
                          <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{er.label}</td>
                          {er.cells.map((cell, ci) => (
                            <td key={ci}>
                              <select
                                className="input"
                                style={{ fontSize: 11, minHeight: 28 }}
                                defaultValue={cell.value ?? ""}
                                onChange={(e) => onOverrideChange(svc.id, cell.fecha, cell.slotIndex, e.target.value)}
                              >
                                <option value="">(rotación automática)</option>
                                {svc.poolOptions.map((op) => (
                                  <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                              </select>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {excluidos.length > 0 && (
        <div className="card blueprint" style={{ padding: "var(--space-4)" }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <div className="card-kicker">Excluidos automáticamente esta semana</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {excluidos.map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{e.nombre}</span>
                <span className={`tag ${e.tagClass}`}>{e.estadoLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
