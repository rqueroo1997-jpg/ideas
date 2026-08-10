import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/auth";
import { canSubirDocumento } from "@/lib/rbac";
import { TIPOS_PAPELEO } from "@/lib/catalog";
import { PapeleoScreen, type DocumentoRow } from "./papeleo-screen";

export default async function PapeleoPage() {
  const viewer = await getViewerContext();
  if (!viewer) redirect("/login");
  const { persona, activeRole } = viewer;

  const documentos = await prisma.documentoPapeleo.findMany({
    include: { file: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: DocumentoRow[] = documentos.map((d) => ({
    id: d.id,
    titulo: d.titulo,
    categoria: d.categoria,
    seccionOrigen: d.seccionOrigen,
    normativaLabel: d.normativa || "Sin referencia normativa",
    fechaLabel: d.fecha.toLocaleDateString("es-ES"),
    archivoUrl: d.file ? `/api/archivos/${d.file.id}` : null,
    archivoNombre: d.file?.nombre ?? null,
  }));

  return <PapeleoScreen documentos={rows} canSubir={canSubirDocumento(persona, activeRole)} tiposPapeleo={TIPOS_PAPELEO} />;
}
