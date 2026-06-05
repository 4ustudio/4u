---
name: project-roles
description: Sistema de roles implementado — arquitectura, archivos, convenciones
metadata:
  type: project
---

# Sistema de roles — 4U Studio Academy

Roles: `owner | admin | sales | instructor | student`

**Por qué:** separar operación académica de gestión ejecutiva/ventas, con arquitectura desacoplada para migrar `/admin/ventas` a `/business` en el futuro.

**Fuente única de verdad:** `lib/auth/roles.ts`
- `ROLE_HIERARCHY` define herencia (owner hereda todo)
- `parseRole()` lee desde `user.user_metadata.role` (Supabase Auth)
- `hasRole()` es el único primitivo que consulta la jerarquía
- Ningún archivo externo hace `role === 'owner'` directamente

**Permisos de área:**
- `hasAdminAccess` → panel /admin (owner, admin, sales, instructor)
- `hasAcademicAccess` → agenda, estudiantes, instructores, inscripciones, retención (owner, admin)
- `canAccessSalesDashboard` → /admin/ventas dashboard ejecutivo (owner, sales)

**Archivos que consumen roles.ts:**
- `middleware.ts` — portero de /admin
- `app/admin/layout.tsx` — pasa rol al sidebar
- `app/admin/_components/AdminSidebar.tsx` — nav dinámica por área
- `app/admin/ventas/page.tsx` — segunda capa de protección server-side

**Usuarios:**
- `admin@4ustudioacademy.com` → role: admin (SQL pendiente en Supabase)
- `director@4ustudioacademy.com` → role: owner (crear en Supabase Auth con metadata)

**How to apply:** Al agregar un rol nuevo, solo modificar `ROLE_HIERARCHY` en `lib/auth/roles.ts`.
