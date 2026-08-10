"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  validarCasoAction,
  descartarCasoAction,
  transportarAction,
  cerrarAction,
} from "@/lib/actions/mantenimiento";
import type { ActionState } from "@/lib/actions/material";

export interface CasoRow {
  id: number;
  codigo: string;
  nombre: string;
  seccionLabel: string;
  reportadoPor: string;
  fecha: string;
  stageLabel: string;
  stageTagClass: string;
  detail: string | null;
  canValidar: boolean;
  canTransportar: boolean;
  canCerrar: boolean;
  materialLabel: string;
}

export interface CerradoRow {
  id: number;
  codigo: string;
  nombre: string;
  resultado: string;
  resultadoTagClass: string;
}

const initial: ActionState = { error: null };

export function MantenimientoScreen({ casoRows, cerradoRows }: { casoRows: CasoRow[]; cerradoRows: CerradoRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [transportarTarget, setTransportarTarget] = useState<CasoRow | null>(null);
  const [cerrarTarget, setCerrarTarget] = useState<CasoRow | null>(null);

  async function onValidar(id: number) {
    setPendingId(id);
    await validarCasoAction(id);
    setPendingId(null);
    router.refresh();
  }
  async function onDescartar(id: number) {
    if (!confirm("¿Descartar como falsa alarma? El material vuelve a Operativo.")) return;
    setPendingId(id);
    await descartarCasoAction(id);
    setPendingId(null);
    router.refresh();
  }

  return (
    <>
      <div>
        <h2 style={{ marginBottom: 2 }}>Flujo de validación y mantenimiento</h2>
        <div className="text-muted" style={{ fontSize: 13 }}>
          Reportado → validado / en escalón → en reparación → cerrado
        </div>
      </div>

      {casoRows.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {casoRows.map((c) => (
            <div key={c.id} className="card blueprint" style={{ padding: "var(--space-4)" }}>
              <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <div>
                  <div className="card-title">{c.codigo} — {c.nombre}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {c.seccionLabel} · reportado por {c.reportadoPor} el {c.fecha}
                  </div>
                </div>
                <span className={`tag ${c.stageTagClass}`}>{c.stageLabel}</span>
              </div>
              {c.detail && <div style={{ fontSize: 13, opacity: 0.8 }}>{c.detail}</div>}
              <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)", flexWrap: "wrap" }}>
                {c.canValidar && (
                  <>
                    <button className="btn btn-primary" disabled={pendingId === c.id} onClick={() => onValidar(c.id)}>
                      Validar avería
                    </button>
                    <button className="btn btn-secondary" disabled={pendingId === c.id} onClick={() => onDescartar(c.id)}>
                      Descartar (falsa alarma)
                    </button>
                  </>
                )}
                {c.canTransportar && (
                  <button className="btn btn-primary" onClick={() => setTransportarTarget(c)}>
                    Registrar transporte a reparación
                  </button>
                )}
                {c.canCerrar && (
                  <button className="btn btn-primary" onClick={() => setCerrarTarget(c)}>
                    Subir documento de reparación
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card blueprint" style={{ padding: "var(--space-6)", textAlign: "center", opacity: 0.6 }}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          No hay averías abiertas.
        </div>
      )}

      {cerradoRows.length > 0 && (
        <div>
          <h4>Cerrados recientemente</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {cerradoRows.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-divider)" }}>
                <span>{c.codigo} — {c.nombre}</span>
                <span className={`tag ${c.resultadoTagClass}`}>{c.resultado}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {transportarTarget && <TransportarDialog target={transportarTarget} onClose={() => setTransportarTarget(null)} />}
      {cerrarTarget && <CerrarDialog target={cerrarTarget} onClose={() => setCerrarTarget(null)} />}
    </>
  );
}

function TransportarDialog({ target, onClose }: { target: CasoRow; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(transportarAction, initial);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Registrar transporte</div>
        <div className="dialog-body">{target.materialLabel}</div>
        <form
          action={async (fd) => {
            await formAction(fd);
            router.refresh();
            onClose();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
        >
          <input type="hidden" name="casoId" value={target.id} />
          <div className="field">
            <label>Lugar de reparación</label>
            <input className="input" type="text" name="lugar" required />
          </div>
          <div className="field">
            <label>Responsable del transporte</label>
            <input className="input" type="text" name="transportista" required />
          </div>
          {state.error && <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{state.error}</div>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CerrarDialog({ target, onClose }: { target: CasoRow; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(cerrarAction, initial);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Documento de reparación</div>
        <div className="dialog-body">{target.materialLabel}</div>
        <form
          action={async (fd) => {
            await formAction(fd);
            router.refresh();
            onClose();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
        >
          <input type="hidden" name="casoId" value={target.id} />
          <div className="field">
            <label>Resultado</label>
            <select className="input" name="resultado" defaultValue="OPERATIVO">
              <option value="OPERATIVO">Reparado — vuelve a operativo</option>
              <option value="BAJA">No tiene arreglo — pasa a baja</option>
            </select>
          </div>
          <div className="field">
            <label>Solución / notas de la reparación</label>
            <textarea className="input" name="solucion" rows={3} />
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
