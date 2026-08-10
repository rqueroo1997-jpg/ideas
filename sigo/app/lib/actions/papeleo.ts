"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPersona } from "@/lib/auth";
import { canSubirDocumento } from "@/lib/rbac";
import { saveUpload } from "@/lib/storage";
import { buscarDocumentos, revisarSolicitudPermiso } from "@/lib/ai";

export interface ActionState {
  error: string | null;
}
const ok: ActionState = { error: null };

/** Best-effort text extraction for search/QA — falls back to no text (the file still stores/downloads fine). */
async function extractText(file: File, buffer: Buffer): Promise<string | null> {
  const name = file.name.toLowerCase();
  try {
    if (file.type === "application/pdf" || name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text.trim() || null;
      } finally {
        await parser.destroy();
      }
    }
    if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim() || null;
    }
  } catch {
    return null;
  }
  return null;
}

const subirSchema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio."),
  categoria: z.string().trim().optional(),
  normativa: z.string().trim().optional(),
});

export async function subirDocumentoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const persona = await getCurrentPersona();
  if (!persona || !canSubirDocumento(persona, persona.homeRole)) return { error: "No autorizado." };

  const parsed = subirSchema.safeParse({
    titulo: formData.get("titulo"),
    categoria: formData.get("categoria") || undefined,
    normativa: formData.get("normativa") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { titulo, categoria, normativa } = parsed.data;

  let fileId: number | undefined;
  let extractedText: string | null = null;
  const file = formData.get("archivo");
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = await saveUpload(buffer, file.name);
    const archivo = await prisma.archivoAdjunto.create({
      data: { nombre: file.name, mimeType: file.type || "application/octet-stream", size: file.size, storageKey },
    });
    fileId = archivo.id;
    extractedText = await extractText(file, buffer);
  }

  await prisma.documentoPapeleo.create({
    data: {
      titulo,
      categoria: categoria || "General",
      normativa: normativa || null,
      seccionOrigen: persona.seccion,
      fileId,
      extractedText,
      subidoPorId: persona.id,
    },
  });

  revalidatePath("/papeleo");
  return ok;
}

export async function buscarDocumentosAction(
  query: string,
): Promise<{ respuesta: string; matchedIds: number[] } | { error: string }> {
  const persona = await getCurrentPersona();
  if (!persona) return { error: "No autorizado." };
  if (!query.trim()) return { error: "Escribe qué documento buscas." };

  const documentos = await prisma.documentoPapeleo.findMany({
    select: { id: true, titulo: true, categoria: true, normativa: true, extractedText: true },
  });

  try {
    return await buscarDocumentos(query, documentos);
  } catch {
    return { error: "No se pudo completar la búsqueda. Inténtalo de nuevo." };
  }
}

export async function revisarPapeleoAction(
  tipo: string,
  texto: string,
): Promise<{ cumple: boolean; mensaje: string } | { error: string }> {
  const persona = await getCurrentPersona();
  if (!persona) return { error: "No autorizado." };
  if (!texto.trim()) return { error: "Escribe el texto de la solicitud." };

  try {
    return await revisarSolicitudPermiso(tipo, texto);
  } catch {
    return { error: "No se pudo completar la revisión. Inténtalo de nuevo." };
  }
}
