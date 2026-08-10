-- Replace AsignacionCuadrante (one row per day, never actually populated —
-- the rotation is computed, not stored) with CuadranteExcepcion, which only
-- persists manual overrides and faltas. See the model comment in
-- schema.prisma for the reasoning.
DROP TABLE "AsignacionCuadrante";
DROP TYPE "SlotCuadrante";

CREATE TABLE "CuadranteExcepcion" (
    "id" SERIAL NOT NULL,
    "servicioId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "overridePersonaId" INTEGER,
    "falta" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuadranteExcepcion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CuadranteExcepcion_servicioId_fecha_slotIndex_key" ON "CuadranteExcepcion"("servicioId", "fecha", "slotIndex");

ALTER TABLE "CuadranteExcepcion" ADD CONSTRAINT "CuadranteExcepcion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CuadranteExcepcion" ADD CONSTRAINT "CuadranteExcepcion_overridePersonaId_fkey" FOREIGN KEY ("overridePersonaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;
