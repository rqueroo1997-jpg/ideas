import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/auth";
import { permisoScopeFor } from "@/lib/rbac";
import { readUpload } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewerContext();
  if (!viewer) return new Response("No autorizado.", { status: 401 });
  const { persona, activeRole } = viewer;

  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId)) return new Response("No encontrado.", { status: 404 });

  const archivo = await prisma.archivoAdjunto.findUnique({ where: { id: fileId } });
  if (!archivo) return new Response("No encontrado.", { status: 404 });

  const documento = await prisma.documentoPapeleo.findFirst({ where: { fileId } });
  if (!documento) {
    const permiso = await prisma.permisoRequest.findFirst({
      where: { justificanteFileId: fileId },
      include: { persona: true },
    });
    if (!permiso) return new Response("No encontrado.", { status: 404 });

    const scope = permisoScopeFor(persona, activeRole);
    const authorized =
      scope.mode === "all" ||
      (scope.mode === "seccion" && permiso.persona.seccion === scope.seccion) ||
      (scope.mode === "own" && permiso.personaId === scope.personaId);
    if (!authorized) return new Response("No autorizado.", { status: 403 });
  }
  // Papeleo documents have no further scoping — every logged-in persona can view the repository (README §6).

  const buffer = await readUpload(archivo.storageKey);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": archivo.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(archivo.nombre)}"`,
      "Content-Length": String(archivo.size),
    },
  });
}
