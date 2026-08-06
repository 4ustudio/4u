// ── Tipos ─────────────────────────────────────────────────────────

export type AppRole = 'owner' | 'super_admin' | 'admin' | 'sales' | 'instructor' | 'student'

// Jerarquía de roles: owner y super_admin son equivalentes para compatibilidad.
// Al agregar un rol nuevo, solo modificar este archivo.
const ROLE_HIERARCHY: Record<AppRole, AppRole[]> = {
  owner:       ['owner', 'super_admin', 'admin', 'sales', 'instructor', 'student'],
  super_admin: ['owner', 'super_admin', 'admin', 'sales', 'instructor', 'student'],
  admin:       ['admin'],
  sales:       ['sales'],
  instructor:  ['instructor'],
  student:     ['student'],
}

// ── Parseo ────────────────────────────────────────────────────────

/** Extrae y valida un AppRole desde metadata de Supabase. */
export function parseRole(
  metadata: Record<string, unknown> | null | undefined
): AppRole | null {
  const raw = metadata?.role
  if (typeof raw === 'string' && raw in ROLE_HIERARCHY) {
    return raw as AppRole
  }
  return null
}

/**
 * Resuelve el rol de un usuario de Supabase Auth.
 *
 * MIGRACIÓN EN CURSO: el rol vivía en `user_metadata` (editable por el propio
 * usuario vía el SDK cliente con la anon key — hueco de escalación de privilegios).
 * Ahora se lee de `app_metadata` (solo editable con service_role), con fallback
 * temporal a `user_metadata` para no romper el acceso de usuarios que aún no
 * pasaron por el backfill. Una vez confirmado el backfill en producción, el
 * fallback se elimina (parseRole(user?.app_metadata ?? null) directo) — ahí
 * queda cerrado el hueco también para cuentas nuevas.
 */
export function resolveRole(
  user: { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null } | null | undefined
): AppRole | null {
  if (!user) return null
  return parseRole({ ...user.user_metadata, ...user.app_metadata })
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

export const isSuperAdmin = (r: AppRole | null): boolean => r === 'owner' || r === 'super_admin'
export const isOwner      = (r: AppRole | null): boolean => isSuperAdmin(r)
export const isAdmin      = (r: AppRole | null): boolean => hasRole(r, 'admin')
export const isSales      = (r: AppRole | null): boolean => hasRole(r, 'sales')
export const isInstructor = (r: AppRole | null): boolean => hasRole(r, 'instructor')
export const isStudent    = (r: AppRole | null): boolean => hasRole(r, 'student')

export function getRoleLabel(role: AppRole | null): string {
  if (isSuperAdmin(role)) return 'Director'
  if (role === 'admin') return 'Administrador'
  if (role === 'sales') return 'Ventas'
  if (role === 'instructor') return 'Instructor'
  return 'Estudiante'
}

// ── Permisos de área ──────────────────────────────────────────────

/** Acceso al panel /admin (cualquier staff). */
export const hasAdminAccess = (r: AppRole | null): boolean =>
  isSuperAdmin(r) || isAdmin(r) || isSales(r) || isInstructor(r)

/** Área académica: agenda, estudiantes, instructores, inscripciones, retención. */
export const hasAcademicAccess = (r: AppRole | null): boolean =>
  isSuperAdmin(r) || r === 'admin'

/** Dashboard de ventas / área ejecutiva.
 *  Desacoplado para migración futura a /business o /executive. */
export const canAccessSalesDashboard = (r: AppRole | null): boolean =>
  isSuperAdmin(r) || isSales(r) || isAdmin(r)

/** Pipeline comercial de leads — mismos permisos que el dashboard de ventas. */
export const canAccessLeads = canAccessSalesDashboard
