-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'jefe_unidad', 'jefe_seccion', 'suboficial', 'cabo_acceso', 'cabo', 'soldado');

-- CreateEnum
CREATE TYPE "EstadoPersonal" AS ENUM ('ACTIVO', 'CURSO_VACACIONES', 'REBAJADO', 'BAJA_MEDICA');

-- CreateEnum
CREATE TYPE "EstadoMaterial" AS ENUM ('OPERATIVO', 'CONDICIONAL', 'INOPERATIVO', 'EN_ESCALON', 'BAJA');

-- CreateEnum
CREATE TYPE "EstadoMantenimiento" AS ENUM ('REPORTADO', 'EN_ESCALON', 'EN_REPARACION', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoPermiso" AS ENUM ('PENDIENTE_INSTANCIA1', 'PENDIENTE_UNIDAD', 'APROBADO', 'DENEGADO');

-- CreateEnum
CREATE TYPE "SlotCuadrante" AS ENUM ('TITULAR', 'SUPLENTE');

-- CreateTable
CREATE TABLE "Persona" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "rango" TEXT NOT NULL,
    "antiguedad" INTEGER NOT NULL,
    "viveSealoj" BOOLEAN NOT NULL DEFAULT false,
    "seccion" TEXT NOT NULL,
    "sub" TEXT,
    "estado" "EstadoPersonal" NOT NULL DEFAULT 'ACTIVO',
    "desde" TIMESTAMP(3),
    "hasta" TIMESTAMP(3),
    "homeRole" "Role" NOT NULL,
    "usuario" TEXT,
    "passwordHash" TEXT,
    "cuentaCreada" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessGrant" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "grantedRole" "Role" NOT NULL,
    "grantedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchivoAdjunto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivoAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numeroSerie" TEXT,
    "seccion" TEXT NOT NULL,
    "sub" TEXT,
    "estado" "EstadoMaterial" NOT NULL DEFAULT 'OPERATIVO',
    "responsableId" INTEGER,
    "prestado" BOOLEAN NOT NULL DEFAULT false,
    "prestadoA" TEXT,
    "ubicacion" TEXT,
    "enRevision" BOOLEAN NOT NULL DEFAULT false,
    "pendienteValidacion" BOOLEAN NOT NULL DEFAULT false,
    "addedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasoMantenimiento" (
    "id" SERIAL NOT NULL,
    "materialId" INTEGER NOT NULL,
    "stage" "EstadoMantenimiento" NOT NULL DEFAULT 'REPORTADO',
    "reportadoPorId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orden" TEXT,
    "lugar" TEXT,
    "transportistaId" INTEGER,
    "solucion" TEXT,
    "resultado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CasoMantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialCaso" (
    "id" SERIAL NOT NULL,
    "casoId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,

    CONSTRAINT "HistorialCaso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermisoRequest" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "desde" DATE NOT NULL,
    "hasta" DATE NOT NULL,
    "dias" INTEGER NOT NULL,
    "estado" "EstadoPermiso" NOT NULL DEFAULT 'PENDIENTE_INSTANCIA1',
    "justificacion" TEXT,
    "justificanteFileId" INTEGER,
    "cancelable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermisoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rango" TEXT NOT NULL,
    "titulares" INTEGER NOT NULL,
    "suplentes" INTEGER NOT NULL,
    "requiereSealoj" BOOLEAN NOT NULL DEFAULT false,
    "bloque" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionCuadrante" (
    "id" SERIAL NOT NULL,
    "servicioId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "slot" "SlotCuadrante" NOT NULL,
    "slotIndex" INTEGER NOT NULL DEFAULT 0,
    "personaId" INTEGER,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "marca" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsignacionCuadrante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoPapeleo" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "seccionOrigen" TEXT NOT NULL,
    "normativa" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tiposRelacionados" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fileId" INTEGER,
    "extractedText" TEXT,
    "subidoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoPapeleo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Persona_usuario_key" ON "Persona"("usuario");

-- CreateIndex
CREATE INDEX "Persona_seccion_sub_idx" ON "Persona"("seccion", "sub");

-- CreateIndex
CREATE UNIQUE INDEX "AccessGrant_personaId_key" ON "AccessGrant"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_codigo_key" ON "Material"("codigo");

-- CreateIndex
CREATE INDEX "Material_seccion_sub_idx" ON "Material"("seccion", "sub");

-- CreateIndex
CREATE INDEX "PermisoRequest_personaId_idx" ON "PermisoRequest"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionCuadrante_servicioId_fecha_slot_slotIndex_key" ON "AsignacionCuadrante"("servicioId", "fecha", "slot", "slotIndex");

-- AddForeignKey
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoMantenimiento" ADD CONSTRAINT "CasoMantenimiento_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoMantenimiento" ADD CONSTRAINT "CasoMantenimiento_reportadoPorId_fkey" FOREIGN KEY ("reportadoPorId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoMantenimiento" ADD CONSTRAINT "CasoMantenimiento_transportistaId_fkey" FOREIGN KEY ("transportistaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCaso" ADD CONSTRAINT "HistorialCaso_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "CasoMantenimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCaso" ADD CONSTRAINT "HistorialCaso_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoRequest" ADD CONSTRAINT "PermisoRequest_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoRequest" ADD CONSTRAINT "PermisoRequest_justificanteFileId_fkey" FOREIGN KEY ("justificanteFileId") REFERENCES "ArchivoAdjunto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionCuadrante" ADD CONSTRAINT "AsignacionCuadrante_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionCuadrante" ADD CONSTRAINT "AsignacionCuadrante_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoPapeleo" ADD CONSTRAINT "DocumentoPapeleo_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "ArchivoAdjunto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoPapeleo" ADD CONSTRAINT "DocumentoPapeleo_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;
