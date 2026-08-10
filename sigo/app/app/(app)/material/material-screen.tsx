"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  agregarMaterialAction,
  editarMaterialAction,
  eliminarMaterialPropioAction,
  reportarAveriaAction,
  validarMaterialPendienteAction,
  type ActionState,
} from "@/lib/actions/material";
import { ScopeToolbar } from "../scope-toolbar";
import type { ResolvedScope } from "@/lib/rbac";

export interface MaterialRow {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  numeroSerie: string | null;
  tipoNumeroLabel: string;
  seccionLabel: string;
  estado: string;
  estadoLabel: string;
  tagClass: string;
  pendienteValidacion: boolean;
  responsableNombre: string;
  prestadoLabel: string | null;
  canReportar: boolean;
  canValidarMaterial: boolean;
  canEditarPropio: boolean;
}

interface Stats {
  total: number;
  operativo: number;
  condicional: number;
  inoperativoBaja: number;
}

const initial: ActionState = { error: null };

export function MaterialScreen({
  rows,
  stats,
  operativoPct,
  alerts,
  scope,
  canAgregar,
  breadcrumb,
}: {
  rows: MaterialRow[];
  stats: Stats;
  operativoPct: number;
  alerts: { tagClass: string; tagLabel: string; text: string }[];
  scope: ResolvedScope;
  canAgregar: boolean;
  breadcrumb: string;
}) {
  const router = useRouter();
  const [agregarOpen, setAgregarOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [reportarTarget, setReportarTarget] = useState<MaterialRow | null>(null);
  const [pendingRowId, setPendingRowId] = useState<number | null>(null);

  async function onValidar(id: number) {
    setPendingRowId(id);
    await validarMaterialPendienteAction(id);
    setPendingRowId(null);
    router.refresh();
  }
  async function onEliminar(id: number) {
    if (!confirm("¿Eliminar este material?")) return;
    setPendingRowId(id);
    await eliminarMaterialPropioAction(id);
    setPendingRowId(null);
    router.refresh();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>Dashboard de material</h2>
          <div className="text-muted" style={{ fontSize: 13 }}>{breadcrumb}</div>
        </div>
        {canAgregar && (
          <button className="btn btn-primary" onClick={() => setAgregarOpen(true)}>
            + Añadir material
          </button>
        )}
      </div>

      <ScopeToolbar scope={scope} />

      <div className="op-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--space-3)" }}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Operativo" value={stats.operativo} />
        <StatCard label="Operativo condicional" value={stats.condicional} />
        <StatCard label="Inoperativo / baja" value={stats.inoperativoBaja} />
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
          <div className="card-kicker">% operatividad</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
            <div><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--color-accent)", marginRight: 6 }} />Operativo — {operativoPct}%</div>
            <div><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--color-neutral-300)", marginRight: 6 }} />No operativo — {100 - operativoPct}%</div>
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
        <table className="table" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>Código</th><th>Material</th><th>Tipo / Nº serie</th><th>Sección</th><th>Estado</th><th>Responsable</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td style={{ opacity: 0.7 }}>{m.codigo}</td>
                <td>{m.nombre}</td>
                <td style={{ fontSize: 12, opacity: 0.75 }}>{m.tipoNumeroLabel}</td>
                <td>
                  {m.seccionLabel}
                  {m.prestadoLabel && <div style={{ fontSize: 11, opacity: 0.65 }}>{m.prestadoLabel}</div>}
                </td>
                <td>
                  <span className={`tag ${m.tagClass}`}>{m.estadoLabel}</span>
                  {m.pendienteValidacion && <span className="badge-pending">pendiente de validar (añadido por soldado)</span>}
                </td>
                <td>{m.responsableNombre}</td>
                <td>
                  {m.canReportar && (
                    <button className="btn btn-secondary" onClick={() => setReportarTarget(m)}>
                      Reportar avería
                    </button>
                  )}
                  {m.canValidarMaterial && (
                    <button className="btn btn-secondary" disabled={pendingRowId === m.id} onClick={() => onValidar(m.id)}>
                      Validar material
                    </button>
                  )}
                  {m.canEditarPropio && (
                    <>
                      <button className="btn btn-ghost" onClick={() => setEditing(m)}>
                        Editar
                      </button>
                      <button className="btn btn-ghost" disabled={pendingRowId === m.id} onClick={() => onEliminar(m.id)}>
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(agregarOpen || editing) && (
        <AgregarMaterialDialog
          scope={scope}
          editing={editing}
          onClose={() => {
            setAgregarOpen(false);
            setEditing(null);
          }}
        />
      )}
      {reportarTarget && <ReportarAveriaDialog target={reportarTarget} onClose={() => setReportarTarget(null)} />}
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

function AgregarMaterialDialog({
  scope,
  editing,
  onClose,
}: {
  scope: ResolvedScope;
  editing: MaterialRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const action = editing ? editarMaterialAction : agregarMaterialAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const [tipo, setTipo] = useState(editing?.tipo ?? "Oficial");

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{editing ? "Editar material" : "Añadir material"}</div>
        {!editing && (
          <div className="dialog-body">
            Se registrará en: {scope.section ?? "S1"}
            {scope.sub ? ` / ${scope.sub}` : ""} — cambia la sección/sub-sección en el filtro del dashboard si no es
            la tuya.
          </div>
        )}
        <form
          action={async (fd) => {
            await formAction(fd);
            router.refresh();
            onClose();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          {!editing && <input type="hidden" name="seccion" value={scope.section ?? "S1"} />}
          {!editing && scope.sub && <input type="hidden" name="sub" value={scope.sub} />}
          <div className="field">
            <label>Nombre</label>
            <input className="input" type="text" name="nombre" defaultValue={editing?.nombre} required />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select className="input" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="Oficial">Oficial</option>
              <option value="Fungible">Fungible</option>
            </select>
          </div>
          {tipo === "Oficial" && (
            <div className="field">
              <label>Nº de serie</label>
              <input className="input" type="text" name="numeroSerie" defaultValue={editing?.numeroSerie ?? ""} />
            </div>
          )}
          <div className="field">
            <label>Estado</label>
            <select className="input" name="estado" defaultValue={editing?.estado ?? "OPERATIVO"}>
              <option value="OPERATIVO">Operativo</option>
              <option value="CONDICIONAL">Condicional</option>
              <option value="INOPERATIVO">Inoperativo</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
          {state.error && <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{state.error}</div>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {editing ? "Guardar" : "Añadir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReportarAveriaDialog({ target, onClose }: { target: MaterialRow; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(reportarAveriaAction, initial);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Reportar avería</div>
        <div className="dialog-body">{target.codigo} — {target.nombre}</div>
        <form
          action={async (fd) => {
            await formAction(fd);
            router.refresh();
            onClose();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
        >
          <input type="hidden" name="materialId" value={target.id} />
          <div className="field">
            <label>Estado</label>
            <select className="input" name="estado" defaultValue="CONDICIONAL">
              <option value="CONDICIONAL">Condicional</option>
              <option value="INOPERATIVO">Inoperativo</option>
            </select>
          </div>
          {state.error && <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{state.error}</div>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              Reportar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
