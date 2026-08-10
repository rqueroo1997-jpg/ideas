/**
 * Imports a real personnel roster from CSV, replacing the placeholder
 * SEED_PERSONAL data from prisma/seed.ts once real roster data is available
 * (sigo/PLAN.md §8 open item #4). Upserts by `nombre` (exact match) so it's
 * safe to re-run as the roster changes — existing accounts (usuario,
 * password, cuentaCreada, activo, AccessGrant) are never touched, only the
 * roster fields below.
 *
 * Usage: npm run db:import-roster -- path/to/roster.csv
 *
 * Expected CSV columns (header row required, any order, Spanish names):
 *   nombre        (required) — must exactly match on re-import to update the same person
 *   rango         (required) — free text, e.g. "Cap.", "Sgto1º", "Cabo", "Soldado"
 *   antiguedad    (required) — integer, lower = more senior
 *   seccion       (required) — one of: S1, S2, S3, S4, Plana Mayor, Banda musical,
 *                               Transmisiones, Defensa contra carros, Inteligencia
 *   sub           (optional) — one of: Redes, Radio, Plana, Satélite (Transmisiones only)
 *   homeRole      (required) — one of: jefe_unidad, jefe_seccion, suboficial, cabo_acceso,
 *                               cabo, soldado, admin
 *   estado        (optional, default Activo) — Activo | Curso / vacaciones | Rebajado | Baja médica
 *   viveSealoj    (optional, default no) — si | no
 *   desde         (optional) — YYYY-MM-DD, only meaningful when estado isn't Activo
 *   hasta         (optional) — YYYY-MM-DD, only meaningful when estado isn't Activo
 *
 * See prisma/roster-example.csv for a template.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { SECCIONES, SUBSECCIONES } from "../lib/catalog.js";
import type { Role } from "../app/generated/prisma/enums.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ROLES: Role[] = ["jefe_unidad", "jefe_seccion", "suboficial", "cabo_acceso", "cabo", "soldado", "admin"];

const ESTADO_MAP: Record<string, "ACTIVO" | "CURSO_VACACIONES" | "REBAJADO" | "BAJA_MEDICA"> = {
  Activo: "ACTIVO",
  "Curso / vacaciones": "CURSO_VACACIONES",
  Rebajado: "REBAJADO",
  "Baja médica": "BAJA_MEDICA",
};

/** Minimal RFC4180 parser: quoted fields, embedded commas/newlines, "" escaping. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parseDate(value: string | undefined): Date | null {
  if (!value || !value.trim()) return null;
  return new Date(`${value.trim()}T00:00:00.000Z`);
}

function parseBool(value: string | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "si" || (value ?? "").trim().toLowerCase() === "sí";
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npm run db:import-roster -- path/to/roster.csv");
    process.exitCode = 1;
    return;
  }

  const rows = parseCsv(readFileSync(path, "utf-8"));
  const [header, ...dataRows] = rows;
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const idx = {
    nombre: col("nombre"),
    rango: col("rango"),
    antiguedad: col("antiguedad"),
    seccion: col("seccion"),
    sub: col("sub"),
    homeRole: col("homerole"),
    estado: col("estado"),
    viveSealoj: col("vivesealoj"),
    desde: col("desde"),
    hasta: col("hasta"),
  };
  for (const [key, i] of Object.entries(idx)) {
    if (i === -1 && ["nombre", "rango", "antiguedad", "seccion", "homeRole"].includes(key)) {
      console.error(`Missing required column "${key}" in CSV header.`);
      process.exitCode = 1;
      return;
    }
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    const rowNum = r + 2; // account for header row, 1-indexed
    const nombre = row[idx.nombre]?.trim();
    const rango = row[idx.rango]?.trim();
    const antiguedadRaw = row[idx.antiguedad]?.trim();
    const seccion = row[idx.seccion]?.trim();
    const sub = idx.sub >= 0 ? row[idx.sub]?.trim() || null : null;
    const homeRoleRaw = row[idx.homeRole]?.trim();
    const estadoRaw = idx.estado >= 0 ? row[idx.estado]?.trim() || "Activo" : "Activo";
    const antiguedad = Number(antiguedadRaw);

    if (!nombre || !rango || !seccion || !homeRoleRaw || !Number.isFinite(antiguedad)) {
      errors.push(`Row ${rowNum}: missing/invalid required field(s).`);
      continue;
    }
    if (!SECCIONES.includes(seccion as (typeof SECCIONES)[number])) {
      errors.push(`Row ${rowNum} ("${nombre}"): unknown seccion "${seccion}".`);
      continue;
    }
    if (sub && !SUBSECCIONES.includes(sub as (typeof SUBSECCIONES)[number])) {
      errors.push(`Row ${rowNum} ("${nombre}"): unknown sub "${sub}".`);
      continue;
    }
    if (!ROLES.includes(homeRoleRaw as Role)) {
      errors.push(`Row ${rowNum} ("${nombre}"): unknown homeRole "${homeRoleRaw}".`);
      continue;
    }
    if (!ESTADO_MAP[estadoRaw]) {
      errors.push(`Row ${rowNum} ("${nombre}"): unknown estado "${estadoRaw}".`);
      continue;
    }

    const data = {
      rango,
      antiguedad,
      seccion,
      sub,
      homeRole: homeRoleRaw as Role,
      estado: ESTADO_MAP[estadoRaw],
      viveSealoj: parseBool(idx.viveSealoj >= 0 ? row[idx.viveSealoj] : undefined),
      desde: parseDate(idx.desde >= 0 ? row[idx.desde] : undefined),
      hasta: parseDate(idx.hasta >= 0 ? row[idx.hasta] : undefined),
    };

    const existing = await prisma.persona.findFirst({ where: { nombre } });
    if (existing) {
      await prisma.persona.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.persona.create({ data: { nombre, ...data } });
      created++;
    }
  }

  console.log(`Imported: ${created} created, ${updated} updated.`);
  if (errors.length > 0) {
    console.log(`\n${errors.length} row(s) skipped:`);
    for (const e of errors) console.log(`  - ${e}`);
  }
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
