-- Add the initial-report description field, and convert `transportista`
-- from a Persona FK to free text (matching the prototype's actual form
-- field, which is a plain text input, not a person picker).
ALTER TABLE "CasoMantenimiento" ADD COLUMN "descripcion" TEXT;
ALTER TABLE "CasoMantenimiento" ADD COLUMN "transportista" TEXT;

UPDATE "CasoMantenimiento" c
SET "transportista" = p.nombre
FROM "Persona" p
WHERE c."transportistaId" = p.id;

ALTER TABLE "CasoMantenimiento" DROP CONSTRAINT "CasoMantenimiento_transportistaId_fkey";
ALTER TABLE "CasoMantenimiento" DROP COLUMN "transportistaId";
