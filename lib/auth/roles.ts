// ── Tipos ─────────────────────────────────────────────────────────

export type AppRole = 'owner' | 'admin' | 'sales' | 'instructor' | 'student'

// Jerarquía de roles: owner hereda todos los permisos.
// Al agregar un rol nuevo, solo modificar este archivo.
const ROLE_HIERARCHY: Record<AppRole, AppRole[]> = {
  owner:      ['owner', 'admin', 'sales', 'instructor', 'student'],
  admin:      ['admin'],
  sales:      ['sales'],
  instructor: ['instructor'],
  student:    ['student'],
}

// ── Parseo ────────────────────────────────────────────────────────

/** Extrae y valida un AppRole desde user_metadata de Supabase. */
export function parseRole(
  metadata: Record<string, unknown> | null | undefined
): AppRole | null {
  const raw = metadata?.role
  if (typeof raw === 'string' && raw in ROLE_HIERARCHY) {
    return raw as AppRole
  }
  return null
}

// ── Primitivo de autorización ─────────────────────────────────────

/**
 * Verdad si `role` tiene (o hereda) `target`.
 * Toda la lógica de permisos pasa por aquí.
 */
export function hasRole(role: AppRole | null, target: AppRole): boolean {
  if (!role) return false
  return ROLE_HIERARCHY[role].includes(target)
}

// ── Predicados de identidad ───────────────────────────────────────

export const isOwner      = (r: AppRole | null): boolean => r === 'owner'
export const isAdmin      = (r: AppRole | null): boolean => hasRole(r, 'admin')
export const isSales      = (r: AppRole | null): boolean => hasRole(r, 'sales')
export const isInstructor = (r: AppRole | null): boolean => hasRole(r, 'instructor')
export const isStudent    = (r: AppRole | null): boolean => hasRole(r, 'student')

// ── Permisos de área ──────────────────────────────────────────────

/** Acceso al panel /admin (cualquier staff). */
export const hasAdminAccess = (r: AppRole | null): boolean =>
  isAdmin(r) || isSales(r) || isInstructor(r)

/** Área académica: agenda, estudiantes, instructores, inscripciones, retención. */
export const hasAcademicAccess = (r: AppRole | null): boolean =>
  isAdmin(r)

/** Dashboard de ventas / área ejecutiva.
 *  Desacoplado para migración futura a /business o /executive. */
export const canAccessSalesDashboard = (r: AppRole | null): boolean =>
  isOwner(r) || isSales(r)

/** Pipeline comercial de leads — mismos permisos que el dashboard de ventas. */
export const canAccessLeads = canAccessSalesDashboard
