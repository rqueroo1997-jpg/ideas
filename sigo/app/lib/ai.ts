/**
 * Claude-backed AI features for Papeleo (sigo/PLAN.md §6), replacing the
 * prototype's two mocked `window.claude.complete` calls: the permiso-text
 * reviewer (design-handoff .dc.html `revisarPapeleo`, ~L1544-1556 /
 * `PAPELEO_SYSTEM_PROMPT`, ~L1076-1079) and the document search
 * (`buscarDocumentoIA`, ~L1501-1515). The search is upgraded from the
 * prototype's "return matching ids only" to a grounded Q&A answer citing
 * source documents, per the README's open item and PLAN.md §6.2 — the
 * simpler keyword-prefilter-then-full-text approach PLAN.md recommends over
 * embeddings, since a single battalion's document count fits in one prompt.
 */
import Anthropic from "@anthropic-ai/sdk";
import { TIPOS_PAPELEO } from "@/lib/catalog";

const MODEL = "claude-sonnet-5";
const MAX_DOC_CHARS = 4000;

function client() {
  return new Anthropic();
}

function firstText(content: Anthropic.ContentBlock[]): string {
  const block = content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return block ? block.text.trim() : "";
}

const PAPELEO_SYSTEM_PROMPT =
  "Eres un asistente de oficina de una unidad militar. Revisas solicitudes de permiso antes de que lleguen al personal administrativo, para que no pierdan tiempo con solicitudes incompletas o mal encajadas en el tipo elegido.\n\n" +
  `Tipos de permiso que maneja esta unidad: ${TIPOS_PAPELEO.join(", ")}. El extraordinario tiene un máximo de 10 días al año, concedido por los jefes según ejercicios o cursos.\n\n` +
  "Te paso el tipo de permiso elegido y el texto de la solicitud tal cual la ha escrito el solicitante. Evalúa: (1) si el texto encaja con el tipo de permiso elegido o parece ser otro tipo; (2) si faltan datos imprescindibles (fechas concretas, motivo, duración); (3) si hay alguna incoherencia evidente (p. ej. un extraordinario que menciona más de 10 días). No inventes artículos de ley ni cifras que no te he dado — si no tienes el dato normativo exacto para algo, dilo explícitamente en vez de inventarlo.\n\n" +
  'Responde SIEMPRE empezando por una primera línea exacta: "CUMPLE" o "REVISAR" (usa REVISAR si falta algo o hay dudas, nunca inventes que no cumple sin motivo). Después, 2-4 líneas explicando el motivo de forma breve y directa, y si aplica, qué falta o qué debería corregir el solicitante.';

export async function revisarSolicitudPermiso(
  tipo: string,
  texto: string,
): Promise<{ cumple: boolean; mensaje: string }> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: PAPELEO_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: `Tipo de permiso elegido: ${tipo}\n\nTexto de la solicitud:\n${texto}` },
    ],
  });
  const mensaje = firstText(response.content);
  return { cumple: mensaje.toUpperCase().startsWith("CUMPLE"), mensaje };
}

export interface DocumentoCandidato {
  id: number;
  titulo: string;
  categoria: string;
  normativa: string | null;
  extractedText: string | null;
}

export interface BusquedaDocumentos {
  respuesta: string;
  matchedIds: number[];
}

export async function buscarDocumentos(
  query: string,
  documentos: DocumentoCandidato[],
): Promise<BusquedaDocumentos> {
  if (documentos.length === 0) {
    return { respuesta: "No hay documentos subidos todavía.", matchedIds: [] };
  }

  const listado = documentos
    .map((d) => {
      const extracto = d.extractedText ? d.extractedText.slice(0, MAX_DOC_CHARS) : "(sin texto extraído para este documento)";
      const normativa = d.normativa ? `, normativa: ${d.normativa}` : "";
      return `--- Documento #${d.id}: "${d.titulo}" (${d.categoria}${normativa}) ---\n${extracto}`;
    })
    .join("\n\n");

  const system =
    "Eres el asistente de búsqueda del repositorio de documentos ('Papeleo / oficina') de una unidad militar. " +
    "Te paso el contenido extraído de los documentos disponibles. Un usuario describe en lenguaje natural qué información busca.\n\n" +
    "Responde a su pregunta basándote SOLO en el texto de estos documentos — no inventes normativa, cifras ni procedimientos que no estén en el texto. " +
    "Si ningún documento responde a la pregunta, dilo explícitamente en vez de inventar una respuesta. Cita el título del documento del que sale cada dato.\n\n" +
    'Termina tu respuesta SIEMPRE con una última línea exacta con este formato: "IDS: 3,7" listando los ids de los documentos que usaste como fuente (o "IDS: NINGUNO" si ninguno era relevante).\n\n' +
    `Documentos disponibles:\n\n${listado}`;

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: query }],
  });

  const text = firstText(response.content);
  const idsMatch = text.match(/IDS:\s*(.+?)\s*$/i);
  const idsRaw = idsMatch ? idsMatch[1].trim() : "";
  const matchedIds =
    !idsRaw || idsRaw.toUpperCase() === "NINGUNO"
      ? []
      : idsRaw
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n));
  const respuesta = idsMatch ? text.slice(0, idsMatch.index).trim() : text;

  return { respuesta, matchedIds };
}
