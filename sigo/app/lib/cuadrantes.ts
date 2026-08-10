/**
 * Duty-roster rotation engine, ported from the prototype's servicioCards
 * builder (design-handoff/Plataforma de Operatividad.dc.html ~L1151-1211,
 * L1718-1779). A normal day's assignment is never stored — it's computed
 * deterministically from seniority order (pool sorted by antiguedad),
 * a fixed epoch, and the day's offset. Only two kinds of exception persist
 * (CuadranteExcepcion): a manual override, and a falta (no-show, which
 * promotes that day's imaginaria).
 */
import { DIA_ABR } from "@/lib/catalog";

export const ROTATION_EPOCH = new Date("2026-01-01T00:00:00Z");
const DAY_MS = 86_400_000;

export interface MonthDay {
  iso: string;
  label: string;
  offset: number;
  dateObj: Date;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function buildMonthDays(year: number, month: number): MonthDay[] {
  const total = new Date(year, month + 1, 0).getDate();
  const days: MonthDay[] = [];
  for (let d = 1; d <= total; d++) {
    const dt = new Date(year, month, d);
    const iso = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    days.push({
      iso,
      label: `${DIA_ABR[dt.getDay()]} ${d}`,
      offset: Math.round((dt.getTime() - ROTATION_EPOCH.getTime()) / DAY_MS),
      dateObj: dt,
    });
  }
  return days;
}

/** Maps a date to a Mon-Wed / Wed-Fri / Fri-Mon block index, for suboficial_cuartel. */
export function blockIndexOf(dateObj: Date): number {
  const wd = dateObj.getDay();
  let ordinal: number;
  let weekMondayOffset: number;
  if (wd === 1 || wd === 2) {
    ordinal = 0;
    weekMondayOffset = -(wd - 1);
  } else if (wd === 3 || wd === 4) {
    ordinal = 1;
    weekMondayOffset = -(wd - 1);
  } else if (wd === 5) {
    ordinal = 2;
    weekMondayOffset = -4;
  } else if (wd === 6) {
    ordinal = 2;
    weekMondayOffset = -5;
  } else {
    ordinal = 2;
    weekMondayOffset = -6;
  }
  const weekMonday = new Date(dateObj.getTime() + weekMondayOffset * DAY_MS);
  const weekNum = Math.floor((weekMonday.getTime() - ROTATION_EPOCH.getTime()) / (7 * DAY_MS));
  return weekNum * 3 + ordinal;
}

export interface PermisoForExencion {
  personaId: number;
  tipo: string;
  estado: string;
  dias: number;
  desde: string; // iso
  hasta: string; // iso
}

/**
 * Whether this persona is exempt from rotation for the given date range —
 * an approved Permiso oficial of 5+ days that overlaps both the range AND
 * the 15 Jun - 15 Sep summer window. The prototype's own function checks
 * only the range overlap, not the summer window, which would exempt people
 * for any 5+ day Permiso oficial at any time of year — contradicting the
 * README's explicit "only exime cuando se disfrutan ... en verano" rule.
 * Added the summer check to match the stated policy.
 */
export function exentoPorPermisoVerano(
  personaId: number,
  permisos: PermisoForExencion[],
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const year = rangeStart.slice(0, 4);
  const summerStart = `${year}-06-15`;
  const summerEnd = `${year}-09-15`;
  return permisos.some(
    (p) =>
      p.personaId === personaId &&
      p.tipo === "Permiso oficial" &&
      p.estado === "APROBADO" &&
      p.dias >= 5 &&
      p.desde <= rangeEnd &&
      p.hasta >= rangeStart &&
      p.desde <= summerEnd &&
      p.hasta >= summerStart,
  );
}

export interface ServicioDef {
  id: string;
  titulares: number;
  suplentes: number;
  rango: string;
  requiereSealoj: boolean;
  bloque: boolean;
}
export interface PersonaForRotation {
  id: number;
  nombre: string;
  rango: string;
  antiguedad: number;
  estado: string;
  viveSealoj: boolean;
}
export interface ExcepcionForRotation {
  fecha: string; // iso
  slotIndex: number;
  overridePersonaId: number | null;
  falta: boolean;
}

export interface GridCell {
  mark: "" | "S" | "F" | "I" | "S*";
  /** Set only for titular cells (S/F) — what a click should toggle/override. */
  fecha: string | null;
  slotIndex: number | null;
}
export interface GridRow {
  personaId: number;
  nombre: string;
  cells: GridCell[];
}

export function buildServicioGrid(
  svc: ServicioDef,
  personal: PersonaForRotation[],
  permisos: PermisoForExencion[],
  exceptions: ExcepcionForRotation[],
  diasDelMes: MonthDay[],
  rangeStart: string,
  rangeEnd: string,
): { pool: PersonaForRotation[]; poolTooSmall: boolean; grid: GridRow[] } {
  const pool = personal
    .filter(
      (p) =>
        p.rango === svc.rango &&
        p.estado === "ACTIVO" &&
        (!svc.requiereSealoj || p.viveSealoj) &&
        !exentoPorPermisoVerano(p.id, permisos, rangeStart, rangeEnd),
    )
    .sort((a, b) => a.antiguedad - b.antiguedad);
  const n = pool.length;

  const exceptionByKey = new Map<string, ExcepcionForRotation>();
  for (const e of exceptions) exceptionByKey.set(`${e.fecha}_${e.slotIndex}`, e);

  const dayData = diasDelMes.map((day) => {
    const off = svc.bloque ? blockIndexOf(day.dateObj) : day.offset;
    const titularSlots = Array.from({ length: svc.titulares }, (_, s) => {
      const exc = exceptionByKey.get(`${day.iso}_${s}`);
      const overrideIdx = exc?.overridePersonaId != null ? pool.findIndex((p) => p.id === exc.overridePersonaId) : -1;
      const idx = overrideIdx !== -1 ? overrideIdx : n ? (((off * svc.titulares + s) % n) + n) % n : -1;
      return { idx, slot: s, falta: !!exc?.falta };
    });
    const imaginariaSlots = Array.from({ length: svc.suplentes }, (_, s) =>
      n ? (((off * svc.titulares + svc.titulares + s) % n) + n) % n : -1,
    );
    return { titularSlots, imaginariaSlots };
  });

  const grid: GridRow[] = pool.map((person, p) => {
    const cells: GridCell[] = dayData.map((dd, di) => {
      const asTitular = dd.titularSlots.find((t) => t.idx === p);
      if (asTitular && !asTitular.falta) {
        return { mark: "S", fecha: diasDelMes[di].iso, slotIndex: asTitular.slot };
      }
      if (asTitular && asTitular.falta) {
        return { mark: "F", fecha: diasDelMes[di].iso, slotIndex: asTitular.slot };
      }
      const imagSlotIndex = dd.imaginariaSlots.indexOf(p);
      if (imagSlotIndex !== -1) {
        const promoted = dd.titularSlots.some((t, ti) => t.falta && ti % svc.suplentes === imagSlotIndex);
        return { mark: promoted ? "S*" : "I", fecha: null, slotIndex: null };
      }
      return { mark: "", fecha: null, slotIndex: null };
    });
    return { personaId: person.id, nombre: person.nombre, cells };
  });

  return { pool, poolTooSmall: n < svc.titulares + svc.suplentes, grid };
}
