/**
 * Ports the prototype's SEED_* constants (design-handoff/Plataforma de
 * Operatividad.dc.html, ~L1086-1211) into the real database, so the app has
 * realistic placeholder data through Phase 5 — see sigo/PLAN.md §8 open
 * item #5. Real personnel data replaces this later; nobody is seeded with a
 * login (cuentaCreada stays false) since account creation is a real "primer
 * acceso" action, not seed data.
 *
 * Several *_MATERIAL / *_CASOS / *_PERMISOS seed rows in the prototype
 * reference people by a rank + name string whose rank prefix doesn't match
 * that person's roster entry (e.g. material says "Cabo Elena Ruiz" but the
 * roster has her as "Cap. Elena Ruiz") — a data-quality quirk in the demo
 * data, not a real distinct person. We match on the last two name tokens
 * (first name + surname) rather than the full string so these still link
 * to the right Persona.
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { SERVICIOS } from "../lib/catalog.js";
import type { Role } from "../app/generated/prisma/enums.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function nameKey(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts.slice(-2).join(" ").toLowerCase();
}

function parseDate(value: string | null): Date | null {
  if (!value || value === "-") return null;
  return new Date(`${value}T00:00:00.000Z`);
}

const HOME_ROLE_BY_RANGO: Record<string, string> = {
  Oficial: "jefe_seccion",
  Sargento: "suboficial",
  Cabo: "cabo",
  Soldado: "soldado",
};
const HOME_ROLE_OVERRIDE: Record<number, string> = { 1: "jefe_unidad", 4: "cabo", 29: "cabo_acceso" };

const ESTADO_PERSONAL_MAP: Record<string, "ACTIVO" | "CURSO_VACACIONES" | "REBAJADO" | "BAJA_MEDICA"> = {
  Activo: "ACTIVO",
  "Curso / vacaciones": "CURSO_VACACIONES",
  Rebajado: "REBAJADO",
  "Baja médica": "BAJA_MEDICA",
};

const ESTADO_MATERIAL_MAP: Record<string, "OPERATIVO" | "CONDICIONAL" | "INOPERATIVO" | "EN_ESCALON" | "BAJA"> = {
  Operativo: "OPERATIVO",
  Condicional: "CONDICIONAL",
  Inoperativo: "INOPERATIVO",
  "En escalón": "EN_ESCALON",
  Baja: "BAJA",
};

const MANTENIMIENTO_STAGE_MAP: Record<string, "REPORTADO" | "EN_ESCALON" | "EN_REPARACION" | "CERRADO"> = {
  reportado: "REPORTADO",
  en_escalon: "EN_ESCALON",
  en_reparacion: "EN_REPARACION",
  cerrado: "CERRADO",
};

const PERMISO_ESTADO_MAP: Record<string, "PENDIENTE_INSTANCIA1" | "PENDIENTE_UNIDAD" | "APROBADO" | "DENEGADO"> = {
  pendiente_instancia1: "PENDIENTE_INSTANCIA1",
  pendiente_unidad: "PENDIENTE_UNIDAD",
  aprobado: "APROBADO",
  denegado: "DENEGADO",
};

const SEED_PERSONAL = [
  { id: 1, nombre: "Cap. Elena Ruiz", rango: "Oficial", antiguedad: 1, viveSealoj: false, seccion: "S1", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 2, nombre: "Tte. Marcos Ibáñez", rango: "Oficial", antiguedad: 2, viveSealoj: false, seccion: "S2", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 3, nombre: "Sgto1º Diego Salas", rango: "Sargento", antiguedad: 3, viveSealoj: false, seccion: "Transmisiones", sub: "Satélite", estado: "Activo", desde: "-", hasta: "-" },
  { id: 4, nombre: "Cabo Iván Torres", rango: "Cabo", antiguedad: 4, viveSealoj: false, seccion: "Transmisiones", sub: "Radio", estado: "Activo", desde: "-", hasta: "-" },
  { id: 5, nombre: "Sold. Marta León", rango: "Soldado", antiguedad: 12, viveSealoj: true, seccion: "Transmisiones", sub: "Redes", estado: "Activo", desde: "-", hasta: "-" },
  { id: 6, nombre: "Cabo Julia Prieto", rango: "Cabo", antiguedad: 5, viveSealoj: false, seccion: "Transmisiones", sub: "Redes", estado: "Curso / vacaciones", desde: "2026-07-20", hasta: "2026-08-20" },
  { id: 7, nombre: "Sold. Pablo Cruz", rango: "Soldado", antiguedad: 13, viveSealoj: false, seccion: "Transmisiones", sub: "Radio", estado: "Baja médica", desde: "2026-07-15", hasta: "2026-08-30" },
  { id: 8, nombre: "Sgto Rosa Vidal", rango: "Sargento", antiguedad: 6, viveSealoj: false, seccion: "Transmisiones", sub: "Plana", estado: "Activo", desde: "-", hasta: "-" },
  { id: 9, nombre: "Cap. Álvaro Nieto", rango: "Oficial", antiguedad: 7, viveSealoj: false, seccion: "Transmisiones", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 27, nombre: "Sold. Bruno Castell", rango: "Soldado", antiguedad: 28, viveSealoj: false, seccion: "Transmisiones", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 28, nombre: "Sold. Alba Fuster", rango: "Soldado", antiguedad: 29, viveSealoj: false, seccion: "Transmisiones", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 29, nombre: "Cabo Raúl Vega", rango: "Cabo", antiguedad: 30, viveSealoj: false, seccion: "Transmisiones", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 10, nombre: "Sold. Hugo Márquez", rango: "Soldado", antiguedad: 14, viveSealoj: false, seccion: "S3", sub: null, estado: "Rebajado", desde: "2026-07-01", hasta: "2026-09-01" },
  { id: 11, nombre: "Cabo Noelia Cabrera", rango: "Cabo", antiguedad: 8, viveSealoj: false, seccion: "S4", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 12, nombre: "Sold. Rubén Ortega", rango: "Soldado", antiguedad: 15, viveSealoj: false, seccion: "Defensa contra carros", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 13, nombre: "Cabo Sara Molina", rango: "Cabo", antiguedad: 9, viveSealoj: false, seccion: "Inteligencia", sub: null, estado: "Curso / vacaciones", desde: "2026-08-05", hasta: "2026-08-12" },
  { id: 14, nombre: "Sold. Daniel Vega", rango: "Soldado", antiguedad: 16, viveSealoj: true, seccion: "Banda musical", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 15, nombre: "Cabo Laura Campos", rango: "Cabo", antiguedad: 10, viveSealoj: false, seccion: "Plana Mayor", sub: null, estado: "Baja médica", desde: "2026-06-01", hasta: "2026-08-15" },
  { id: 16, nombre: "Sold. Iker Sanz", rango: "Soldado", antiguedad: 17, viveSealoj: true, seccion: "Transmisiones", sub: "Redes", estado: "Activo", desde: "-", hasta: "-" },
  { id: 17, nombre: "Sold. Diana Reyes", rango: "Soldado", antiguedad: 18, viveSealoj: true, seccion: "S1", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 18, nombre: "Sold. Óscar Blanco", rango: "Soldado", antiguedad: 19, viveSealoj: false, seccion: "S2", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 19, nombre: "Sold. Nuria Campos", rango: "Soldado", antiguedad: 20, viveSealoj: true, seccion: "S3", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 20, nombre: "Sold. Adrián Silva", rango: "Soldado", antiguedad: 21, viveSealoj: false, seccion: "S4", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 21, nombre: "Sold. Carla Ibarra", rango: "Soldado", antiguedad: 22, viveSealoj: true, seccion: "Inteligencia", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 22, nombre: "Sold. Fernando Rus", rango: "Soldado", antiguedad: 23, viveSealoj: false, seccion: "Defensa contra carros", sub: null, estado: "Curso / vacaciones", desde: "2026-08-08", hasta: "2026-08-18" },
  { id: 23, nombre: "Cabo Marcos Peña", rango: "Cabo", antiguedad: 24, viveSealoj: false, seccion: "Plana Mayor", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 24, nombre: "Sold. Lucía Ferrer", rango: "Soldado", antiguedad: 25, viveSealoj: false, seccion: "Banda musical", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 25, nombre: "Sold. Pablo Ibáñez", rango: "Soldado", antiguedad: 26, viveSealoj: true, seccion: "S2", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 26, nombre: "Cabo Teresa Roig", rango: "Cabo", antiguedad: 27, viveSealoj: false, seccion: "S3", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 30, nombre: "Sgto1º Vicente Amaro", rango: "Sargento", antiguedad: 31, viveSealoj: false, seccion: "S1", sub: null, estado: "Activo", desde: "-", hasta: "-" },
  { id: 31, nombre: "Sgto Elisa Bravo", rango: "Sargento", antiguedad: 32, viveSealoj: false, seccion: "S4", sub: null, estado: "Activo", desde: "-", hasta: "-" },
];

const SEED_MATERIAL = [
  { codigo: "FUS-0231", nombre: "Fusil HK G36", tipo: "Oficial", numeroSerie: "EA-778213", seccion: "S1", sub: null, estado: "Operativo", responsable: "Cabo Elena Ruiz", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "RAD-0110", nombre: "Radio PRC-152", tipo: "Oficial", numeroSerie: "EA-330981", seccion: "Transmisiones", sub: "Radio", estado: "Operativo", responsable: "Cabo Iván Torres", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "RAD-0111", nombre: "Radio PRC-152", tipo: "Oficial", numeroSerie: "EA-330982", seccion: "Transmisiones", sub: "Radio", estado: "Inoperativo", responsable: "Sold. Pablo Cruz", prestado: false, prestadoA: null, ubicacion: null, enRevision: true },
  { codigo: "SAT-0042", nombre: "Terminal satélite VSAT", tipo: "Oficial", numeroSerie: "EA-991042", seccion: "Transmisiones", sub: "Satélite", estado: "Condicional", responsable: "Sbtte. Diego Salas", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "RED-0087", nombre: "Switch de campaña", tipo: "Oficial", numeroSerie: "EA-550187", seccion: "Transmisiones", sub: "Redes", estado: "Operativo", responsable: "Sold. Marta León", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "RED-0088", nombre: "Router táctico", tipo: "Oficial", numeroSerie: "EA-550188", seccion: "Transmisiones", sub: "Redes", estado: "Operativo", responsable: "Cabo Julia Prieto", prestado: true, prestadoA: "Batallón XI", ubicacion: "Base Cerro Muriano", enRevision: false },
  { codigo: "PLA-0015", nombre: "Impresora de furrilería", tipo: "Oficial", numeroSerie: "EA-120015", seccion: "Transmisiones", sub: "Plana", estado: "Baja", responsable: "Sbtte. Rosa Vidal", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "VEH-0233", nombre: "Vehículo BMR", tipo: "Oficial", numeroSerie: "EA-002233", seccion: "Defensa contra carros", sub: null, estado: "Operativo", responsable: "Sold. Rubén Ortega", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "LAN-0005", nombre: "Lanzagranadas", tipo: "Oficial", numeroSerie: "EA-780005", seccion: "Defensa contra carros", sub: null, estado: "En escalón", responsable: "Sbtte. Diego Salas", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "OPT-0099", nombre: "Visor térmico", tipo: "Oficial", numeroSerie: "EA-660099", seccion: "Inteligencia", sub: null, estado: "Operativo", responsable: "Cabo Sara Molina", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "DRN-0012", nombre: "Dron de reconocimiento", tipo: "Oficial", numeroSerie: "EA-660012", seccion: "Inteligencia", sub: null, estado: "En escalón", responsable: "Cabo Sara Molina", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "INS-0301", nombre: "Fusil de asalto", tipo: "Oficial", numeroSerie: "EA-778301", seccion: "S2", sub: null, estado: "Operativo", responsable: "Tte. Marcos Ibáñez", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "VEH-0044", nombre: "Camión logístico", tipo: "Oficial", numeroSerie: "EA-002044", seccion: "S4", sub: null, estado: "Operativo", responsable: "Cabo Noelia Cabrera", prestado: true, prestadoA: "S3", ubicacion: "Parque móvil central", enRevision: false },
  { codigo: "INST-0002", nombre: "Trompeta de banda", tipo: "Oficial", numeroSerie: "EA-990002", seccion: "Banda musical", sub: null, estado: "Operativo", responsable: "Sold. Daniel Vega", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "ORD-0450", nombre: "Ordenador de plana mayor", tipo: "Oficial", numeroSerie: "EA-440450", seccion: "Plana Mayor", sub: null, estado: "Condicional", responsable: "Cabo Laura Campos", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "CHAL-0771", nombre: "Chaleco antibalas", tipo: "Oficial", numeroSerie: "EA-770771", seccion: "S3", sub: null, estado: "Operativo", responsable: "Sold. Hugo Márquez", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "RAD-0112", nombre: "Radio PRC-152", tipo: "Oficial", numeroSerie: "EA-330983", seccion: "Transmisiones", sub: "Radio", estado: "Baja", responsable: "Cap. Álvaro Nieto", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "GEN-0060", nombre: "Generador eléctrico", tipo: "Oficial", numeroSerie: "EA-060060", seccion: "S1", sub: null, estado: "Inoperativo", responsable: "Cabo Elena Ruiz", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "FUN-0501", nombre: "Crimpadora RJ45", tipo: "Fungible", numeroSerie: null, seccion: "Transmisiones", sub: "Redes", estado: "Operativo", responsable: "Sold. Marta León", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "FUN-0502", nombre: "Cable de red (bobina)", tipo: "Fungible", numeroSerie: null, seccion: "Transmisiones", sub: "Redes", estado: "Operativo", responsable: "Sold. Iker Sanz", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "FUN-0503", nombre: "Cinta de carrocero", tipo: "Fungible", numeroSerie: null, seccion: "Transmisiones", sub: "Redes", estado: "Operativo", responsable: "Sold. Marta León", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
  { codigo: "FUN-0504", nombre: "Cabezales RJ45 (bolsa)", tipo: "Fungible", numeroSerie: null, seccion: "Transmisiones", sub: "Redes", estado: "Condicional", responsable: "Sold. Iker Sanz", prestado: false, prestadoA: null, ubicacion: null, enRevision: false },
];

const SEED_CASOS = [
  { materialCodigo: "RAD-0111", stage: "reportado", reportadoPor: "Sold. Pablo Cruz", fecha: "2026-08-01", orden: null, lugar: null, transportista: null },
  { materialCodigo: "DRN-0012", stage: "en_escalon", reportadoPor: "Cabo Sara Molina", fecha: "2026-07-25", orden: "OM-2026-014", lugar: null, transportista: null },
  { materialCodigo: "LAN-0005", stage: "en_reparacion", reportadoPor: "Sbtte. Diego Salas", fecha: "2026-07-18", orden: "OM-2026-011", lugar: "Taller Regional Norte", transportista: "Sbtte. Rosa Vidal" },
];

const SEED_PERMISOS = [
  { persona: "Sold. Marta León", tipo: "Asuntos propios", dias: 2, desde: "2026-08-10", hasta: "2026-08-11", estado: "pendiente_instancia1" },
  { persona: "Cabo Iván Torres", tipo: "Permiso oficial", dias: 5, desde: "2026-08-15", hasta: "2026-08-19", estado: "pendiente_unidad" },
  { persona: "Sold. Hugo Márquez", tipo: "Permiso extraordinario", dias: 3, desde: "2026-08-20", hasta: "2026-08-22", estado: "aprobado" },
  { persona: "Cabo Julia Prieto", tipo: "Asuntos propios", dias: 1, desde: "2026-08-05", hasta: "2026-08-05", estado: "denegado" },
  { persona: "Sold. Rubén Ortega", tipo: "Permiso oficial", dias: 10, desde: "2026-09-01", hasta: "2026-09-10", estado: "pendiente_instancia1" },
  { persona: "Sbtte. Rosa Vidal", tipo: "Asuntos propios", dias: 2, desde: "2026-08-25", hasta: "2026-08-26", estado: "aprobado" },
  { persona: "Sold. Iker Sanz", tipo: "Permiso extraordinario", dias: 4, desde: "2026-08-30", hasta: "2026-09-02", estado: "pendiente_unidad" },
  { persona: "Sold. Marta León", tipo: "Permiso oficial", dias: 5, desde: "2026-08-11", hasta: "2026-08-15", estado: "aprobado" },
];

const SEED_DOCUMENTOS = [
  { titulo: "Procedimiento de baja médica", categoria: "Sanidad", seccionOrigen: "S1", normativa: "Orden DEF/2015, art. 12", fecha: "2026-03-10", tiposRelacionados: ["Otros permisos"] },
  { titulo: "Solicitud de vacante / cambio de destino", categoria: "Personal", seccionOrigen: "S1", normativa: "Instrucción 6/2020 del EMAD", fecha: "2026-02-18", tiposRelacionados: ["Otros permisos"] },
  { titulo: "Normas de seguridad en polígono de tiro", categoria: "Operaciones", seccionOrigen: "S3", normativa: "Norma General 4/2019", fecha: "2026-01-22", tiposRelacionados: [] },
  { titulo: "Procedimiento de baja de material", categoria: "Logística", seccionOrigen: "S4", normativa: "Orden DEF/2012, art. 8", fecha: "2026-05-02", tiposRelacionados: [] },
  { titulo: "Protocolo de seguridad de la información", categoria: "Inteligencia", seccionOrigen: "S2", normativa: "Directiva 3/2018 CNI-CCN", fecha: "2026-04-11", tiposRelacionados: [] },
];

async function main() {
  console.log("Seeding Servicio catalog...");
  for (const s of SERVICIOS) {
    await prisma.servicio.upsert({ where: { id: s.id }, update: s, create: s });
  }

  console.log("Seeding Persona roster...");
  const idByKey = new Map<string, number>();
  for (const p of SEED_PERSONAL) {
    const homeRole = (HOME_ROLE_OVERRIDE[p.id] ?? HOME_ROLE_BY_RANGO[p.rango] ?? "soldado") as Role;
    const created = await prisma.persona.create({
      data: {
        nombre: p.nombre,
        rango: p.rango,
        antiguedad: p.antiguedad,
        viveSealoj: p.viveSealoj,
        seccion: p.seccion,
        sub: p.sub,
        estado: ESTADO_PERSONAL_MAP[p.estado],
        desde: parseDate(p.desde),
        hasta: parseDate(p.hasta),
        homeRole,
        cuentaCreada: false,
      },
    });
    idByKey.set(nameKey(p.nombre), created.id);
  }

  function resolvePersonaId(displayName: string): number | undefined {
    const id = idByKey.get(nameKey(displayName));
    if (!id) console.warn(`  ! No roster match for "${displayName}", leaving unlinked.`);
    return id;
  }

  console.log("Seeding Material...");
  const materialIdByCodigo = new Map<string, number>();
  for (const m of SEED_MATERIAL) {
    const created = await prisma.material.create({
      data: {
        codigo: m.codigo,
        nombre: m.nombre,
        tipo: m.tipo,
        numeroSerie: m.numeroSerie,
        seccion: m.seccion,
        sub: m.sub,
        estado: ESTADO_MATERIAL_MAP[m.estado],
        responsableId: resolvePersonaId(m.responsable),
        prestado: m.prestado,
        prestadoA: m.prestadoA,
        ubicacion: m.ubicacion,
        enRevision: m.enRevision,
      },
    });
    materialIdByCodigo.set(m.codigo, created.id);
  }

  console.log("Seeding CasoMantenimiento...");
  for (const c of SEED_CASOS) {
    const materialId = materialIdByCodigo.get(c.materialCodigo);
    const reportadoPorId = resolvePersonaId(c.reportadoPor);
    if (!materialId || !reportadoPorId) continue;
    await prisma.casoMantenimiento.create({
      data: {
        materialId,
        stage: MANTENIMIENTO_STAGE_MAP[c.stage],
        reportadoPorId,
        fecha: parseDate(c.fecha)!,
        orden: c.orden,
        lugar: c.lugar,
        transportista: c.transportista,
      },
    });
  }

  console.log("Seeding PermisoRequest...");
  for (const p of SEED_PERMISOS) {
    const personaId = resolvePersonaId(p.persona);
    if (!personaId) continue;
    await prisma.permisoRequest.create({
      data: {
        personaId,
        tipo: p.tipo,
        desde: parseDate(p.desde)!,
        hasta: parseDate(p.hasta)!,
        dias: p.dias,
        estado: PERMISO_ESTADO_MAP[p.estado],
        cancelable: p.estado === "pendiente_instancia1" || p.estado === "pendiente_unidad",
      },
    });
  }

  console.log("Seeding DocumentoPapeleo...");
  for (const d of SEED_DOCUMENTOS) {
    await prisma.documentoPapeleo.create({
      data: {
        titulo: d.titulo,
        categoria: d.categoria,
        seccionOrigen: d.seccionOrigen,
        normativa: d.normativa,
        fecha: parseDate(d.fecha)!,
        tiposRelacionados: d.tiposRelacionados,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
