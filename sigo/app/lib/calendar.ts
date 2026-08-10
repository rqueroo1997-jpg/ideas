/**
 * Year calendar grid for the Permisos screen, ported from the prototype's
 * buildYearCalendar (design-handoff/Plataforma de Operatividad.dc.html
 * ~L1043-1066). Selection state and existing-request overlay are computed
 * client-side (see permisos-screen.tsx) — this just builds the day grid.
 */
import { MES_NOMBRES, isFestivo } from "@/lib/catalog";

export interface CalendarDay {
  iso: string;
  day: number;
  isWeekend: boolean;
  festivo: boolean;
}
export interface CalendarMonth {
  label: string;
  weeks: (CalendarDay | null)[][];
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}
function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

export function buildYearCalendar(year: number): CalendarMonth[] {
  const months: CalendarMonth[] = [];
  for (let m = 0; m < 12; m++) {
    const first = new Date(year, m, 1);
    const totalDays = new Date(year, m + 1, 0).getDate();
    const leadBlanks = (first.getDay() + 6) % 7;
    const cells: (CalendarDay | null)[] = [];
    for (let i = 0; i < leadBlanks; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(year, m, d);
      const iso = isoDate(year, m, d);
      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
      cells.push({ iso, day: d, isWeekend, festivo: isFestivo(iso) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (CalendarDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    months.push({ label: MES_NOMBRES[m], weeks });
  }
  return months;
}
