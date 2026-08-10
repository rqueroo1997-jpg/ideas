/**
 * Domain catalog ported verbatim from the design handoff's prototype
 * (design-handoff/Plataforma de Operatividad.dc.html, ~L1017-1211).
 * Keep values in sync with prisma/schema.prisma enums — see the mapping
 * tables below for how each Prisma enum's ASCII code maps back to the
 * prototype's exact Spanish copy.
 */
import type {
  EstadoMaterial,
  EstadoMantenimiento,
  EstadoPermiso,
  EstadoPersonal,
  Role,
} from "@/app/generated/prisma/enums";

export const SECCIONES = [
  "S1",
  "S2",
  "S3",
  "S4",
  "Plana Mayor",
  "Banda musical",
  "Transmisiones",
  "Defensa contra carros",
  "Inteligencia",
] as const;
export type Seccion = (typeof SECCIONES)[number];

export const SUBSECCIONES = ["Redes", "Radio", "Plana", "Satélite"] as const;
export type Subseccion = (typeof SUBSECCIONES)[number];

export const ROLE_HOME: Record<
  Role,
  { label: string; section: Seccion | null; sub: Subseccion | null }
> = {
  jefe_unidad: { label: "Jefe de unidad", section: null, sub: null },
  jefe_seccion: { label: "Jefe de sección", section: "Transmisiones", sub: null },
  suboficial: { label: "Suboficial", section: "Transmisiones", sub: null },
  cabo: { label: "Cabo", section: "Transmisiones", sub: "Redes" },
  cabo_acceso: { label: "Cabo (con acceso)", section: "Transmisiones", sub: "Redes" },
  soldado: { label: "Soldado", section: "Transmisiones", sub: "Redes" },
  admin: { label: "Administrador", section: null, sub: null },
};

/** Role-views a jefe_unidad/admin can grant — excludes the two roles that already bypass every restriction. */
export const GRANTABLE_ROLES = ["jefe_seccion", "suboficial", "cabo_acceso", "cabo", "soldado"] as const;

/** Roles above this one bypass section/subsection scoping entirely. */
export const UNSCOPED_ROLES: Role[] = ["jefe_unidad", "admin"];

export const NAV_SCREENS = [
  { id: "dashboard", label: "Material", href: "/material" },
  { id: "mantenimiento", label: "Mantenimiento", href: "/mantenimiento" },
  { id: "personal", label: "Personal", href: "/personal" },
  { id: "permisos", label: "Permisos", href: "/permisos" },
  { id: "cuadrantes", label: "Cuadrantes", href: "/cuadrantes" },
  { id: "papeleo", label: "Papeleo / oficina", href: "/papeleo" },
] as const;

export const TIPOS_PAPELEO = [
  "Permiso oficial",
  "Asuntos propios",
  "Permiso por operación de familiar",
  "Permiso extraordinario",
  "Permiso de paternidad",
  "Permiso de lactancia",
] as const;

export const TIPOS_CALENDARIO = [
  "Vacaciones",
  "Asuntos propios",
  "Permiso oficial",
  "Permiso extraordinario",
  "Otros permisos",
] as const;

/** MM-DD, national holidays (Spain) used by the Permisos calendar. */
export const FESTIVOS = [
  "01-01",
  "01-06",
  "05-01",
  "08-15",
  "10-12",
  "11-01",
  "12-06",
  "12-08",
  "12-25",
];
export function isFestivo(isoDate: string): boolean {
  return FESTIVOS.includes(isoDate.slice(5));
}

export const MES_NOMBRES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export const DIA_ABR = ["D", "L", "M", "X", "J", "V", "S"];

export const SERVICIOS = [
  { id: "cabo_cuartel", label: "Cabo cuartel", rango: "Cabo", titulares: 1, suplentes: 1, requiereSealoj: false, bloque: false },
  { id: "cuartelero_batallon", label: "Cuartelero de batallón", rango: "Soldado", titulares: 1, suplentes: 1, requiereSealoj: false, bloque: false },
  { id: "cuartelero_vestuario", label: "Cuartelero de vestuario", rango: "Soldado", titulares: 1, suplentes: 1, requiereSealoj: false, bloque: false },
  { id: "limpieza_sealoj", label: "Limpieza SEALOJ", rango: "Soldado", titulares: 2, suplentes: 2, requiereSealoj: true, bloque: false },
  { id: "limpieza_base", label: "Limpieza de base", rango: "Soldado", titulares: 2, suplentes: 2, requiereSealoj: false, bloque: false },
  { id: "limpieza_lavadero", label: "Limpieza de lavadero", rango: "Soldado", titulares: 6, suplentes: 2, requiereSealoj: false, bloque: false },
  { id: "suboficial_cuartel", label: "Suboficial de cuartel", rango: "Sargento", titulares: 1, suplentes: 1, requiereSealoj: false, bloque: true },
] as const;

// — Prisma enum ↔ display label mappings —

export const ESTADO_PERSONAL_LABEL: Record<EstadoPersonal, string> = {
  ACTIVO: "Activo",
  CURSO_VACACIONES: "Curso / vacaciones",
  REBAJADO: "Rebajado",
  BAJA_MEDICA: "Baja médica",
};
export const ESTADO_PERSONAL_TAG: Record<EstadoPersonal, string> = {
  ACTIVO: "tag-green",
  CURSO_VACACIONES: "tag-neutral",
  REBAJADO: "tag-amber",
  BAJA_MEDICA: "tag-red",
};

export const ESTADO_MATERIAL_LABEL: Record<EstadoMaterial, string> = {
  OPERATIVO: "Operativo",
  CONDICIONAL: "Condicional",
  INOPERATIVO: "Inoperativo",
  EN_ESCALON: "En escalón",
  BAJA: "Baja",
};
export const ESTADO_MATERIAL_TAG: Record<EstadoMaterial, string> = {
  OPERATIVO: "tag-green",
  CONDICIONAL: "tag-amber",
  INOPERATIVO: "tag-red",
  EN_ESCALON: "tag-accent",
  BAJA: "tag-neutral",
};

export const ESTADO_MANTENIMIENTO_LABEL: Record<EstadoMantenimiento, string> = {
  REPORTADO: "Reportado",
  EN_ESCALON: "En escalón",
  EN_REPARACION: "En reparación",
  CERRADO: "Cerrado",
};

export const ESTADO_PERMISO_LABEL: Record<EstadoPermiso, string> = {
  PENDIENTE_INSTANCIA1: "Pendiente 1ª instancia",
  PENDIENTE_UNIDAD: "Pendiente jefe de unidad",
  APROBADO: "Aprobado",
  DENEGADO: "Denegado",
};
export const ESTADO_PERMISO_TAG: Record<EstadoPermiso, string> = {
  PENDIENTE_INSTANCIA1: "tag-amber",
  PENDIENTE_UNIDAD: "tag-amber",
  APROBADO: "tag-green",
  DENEGADO: "tag-red",
};

export function seccionLabel(seccion: string, sub?: string | null): string {
  return sub ? `${seccion} / ${sub}` : seccion;
}

/** "Batallón CG IX › Sección[ › Sub]" — ported from renderVals()'s breadcrumbParts (~L1603-1606). */
export function breadcrumbText(section: string | null, sub: string | null): string {
  const parts = ["Batallón CG IX", section ?? "Todas las secciones"];
  if (sub) parts.push(sub);
  return parts.join(" › ");
}

export function slugUsuario(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}
