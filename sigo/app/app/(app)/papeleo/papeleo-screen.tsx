"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  subirDocumentoAction,
  buscarDocumentosAction,
  revisarPapeleoAction,
  type ActionState,
} from "@/lib/actions/papeleo";

export interface DocumentoRow {
  id: number;
  titulo: string;
  categoria: string;
  seccionOrigen: string;
  normativaLabel: string;
  fechaLabel: string;
  archivoUrl: string | null;
  archivoNombre: string | null;
}

const initial: ActionState = { error: null };

export function PapeleoScreen({
  documentos,
  canSubir,
  tiposPapeleo,
}: {
  documentos: DocumentoRow[];
  canSubir: boolean;
  tiposPapeleo: readonly string[];
}) {
  const [uploadOpen, setUploadOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<{ respuesta: string; matchedIds: number[] } | null>(null);

  const [papeleoTipo, setPapeleoTipo] = useState(tiposPapeleo[0] ?? "");
  const [papeleoTexto, setPapeleoTexto] = useState("");
  const [papeleoLoading, setPapeleoLoading] = useState(false);
  const [papeleoError, setPapeleoError] = useState<string | null>(null);
  const [papeleoResultado, setPapeleoResultado] = useState<{ cumple: boolean; mensaje: string } | null>(null);

  async function buscarConIA() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    const res = await buscarDocumentosAction(searchQuery);
    setSearchLoading(false);
    if ("error" in res) setSearchError(res.error);
    else setSearchResult(res);
  }

  function limpiarBusqueda() {
    setSearchQuery("");
    setSearchResult(null);
    setSearchError(null);
  }

  async function revisarConIA() {
    if (!papeleoTexto.trim()) return;
    setPapeleoLoading(true);
    setPapeleoError(null);
    setPapeleoResultado(null);
    const res = await revisarPapeleoAction(papeleoTipo, papeleoTexto);
    setPapeleoLoading(false);
    if ("error" in res) setPapeleoError(res.error);
    else setPapeleoResultado(res);
  }

  const documentosVisibles =
    searchResult && searchResult.matchedIds.length > 0
      ? documentos.filter((d) => searchResult.matchedIds.includes(d.id))
      : documentos;

  return (
    <>
      <div>
        <h2 style={{ marginBottom: 2 }}>Papeleo / oficina</h2>
        <div className="text-muted" style={{ fontSize: 13 }}>
          Revisión asistida por IA antes de que la solicitud llegue a oficina — no sustituye la validación oficial.
        </div>
      </div>

      <div className="card blueprint" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <div className="card-kicker">Documentos de interés (baja médica, vacantes, procedimientos...)</div>
          {canSubir && (
            <button className="btn btn-secondary" onClick={() => setUploadOpen(true)}>
              + Subir documento
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 220 }}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Describe qué documento buscas (ej. cómo pedir la baja médica)..."
          />
          <button className="btn btn-primary" onClick={buscarConIA} disabled={searchLoading || !searchQuery.trim()}>
            Buscar con IA
          </button>
          {searchResult !== null && (
            <button className="btn btn-ghost" onClick={limpiarBusqueda}>
              Ver todos
            </button>
          )}
        </div>
        {searchLoading && <div className="text-muted" style={{ fontSize: 13 }}>Buscando...</div>}
        {searchError && <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{searchError}</div>}
        {searchResult && (
          <div className="card" style={{ background: "var(--color-surface)", padding: "var(--space-3)", gap: "var(--space-2)" }}>
            <span className={`tag ${searchResult.matchedIds.length > 0 ? "tag-accent" : "tag-neutral"}`} style={{ alignSelf: "flex-start" }}>
              {searchResult.matchedIds.length > 0 ? "Respuesta" : "Sin resultados"}
            </span>
            <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{searchResult.respuesta}</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {documentosVisibles.length === 0 && (
            <div className="text-muted" style={{ fontSize: 13 }}>Todavía no hay documentos subidos.</div>
          )}
          {documentosVisibles.map((d) => (
            <div key={d.id} style={{ borderBottom: "1px solid var(--color-divider)", padding: "var(--space-2) 0", fontSize: 14, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <span style={{ fontWeight: 600 }}>{d.titulo}</span>
                <span className="tag tag-accent">{d.seccionOrigen}</span>
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>{d.categoria} · subido {d.fechaLabel}</div>
              <div style={{ fontSize: 12, fontStyle: "italic" }}>{d.normativaLabel}</div>
              {d.archivoUrl && (
                <a href={d.archivoUrl} download={d.archivoNombre ?? undefined} style={{ fontSize: 12, color: "var(--color-accent-700)", width: "fit-content" }}>
                  Descargar {d.archivoNombre}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card blueprint" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="field" style={{ maxWidth: 320 }}>
          <label>Tipo de permiso</label>
          <select className="input" value={papeleoTipo} onChange={(e) => setPapeleoTipo(e.target.value)}>
            {tiposPapeleo.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Texto de la solicitud</label>
          <textarea
            className="input"
            style={{ minHeight: 140 }}
            value={papeleoTexto}
            onChange={(e) => setPapeleoTexto(e.target.value)}
            placeholder="Pega o escribe aquí el texto de la solicitud tal como la ha redactado el solicitante..."
          />
        </div>
        <div>
          <button className="btn btn-primary" onClick={revisarConIA} disabled={papeleoLoading || !papeleoTexto.trim()}>
            Revisar con IA
          </button>
        </div>
        {papeleoLoading && <div className="text-muted" style={{ fontSize: 13 }}>Revisando contra la normativa de la unidad...</div>}
        {papeleoError && <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{papeleoError}</div>}
        {papeleoResultado && (
          <div className="card" style={{ background: "var(--color-surface)", padding: "var(--space-3)", gap: "var(--space-2)" }}>
            <span className={`tag ${papeleoResultado.cumple ? "tag-green" : "tag-amber"}`} style={{ alignSelf: "flex-start" }}>
              {papeleoResultado.cumple ? "Cumple" : "Revisar"}
            </span>
            <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{papeleoResultado.mensaje}</div>
          </div>
        )}
      </div>

      {uploadOpen && <SubirDocumentoDialog onClose={() => setUploadOpen(false)} />}
    </>
  );
}

function SubirDocumentoDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(subirDocumentoAction, initial);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Subir documento</div>
        <form
          action={async (fd) => {
            await formAction(fd);
            router.refresh();
            onClose();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
        >
          <div className="field">
            <label>Título</label>
            <input className="input" type="text" name="titulo" required />
          </div>
          <div className="field">
            <label>Categoría</label>
            <input className="input" type="text" name="categoria" placeholder="Ej. Procedimiento, Normativa, RRHH..." />
          </div>
          <div className="field">
            <label>Referencia normativa</label>
            <input className="input" type="text" name="normativa" placeholder="Ej. Orden DEF/XXX/2026, art. X" />
          </div>
          <div className="field">
            <label>Archivo (PDF o Word)</label>
            <input className="input" type="file" name="archivo" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          </div>
          {state.error && <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{state.error}</div>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              Subir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
