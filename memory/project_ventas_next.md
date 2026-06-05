---
name: project-ventas-next
description: Próximo paso del módulo de ventas — embudo comercial (tabla leads pendiente)
metadata:
  type: project
---

# Módulo de ventas — próximo paso

El Dashboard Ejecutivo (`/admin/ventas`) está implementado y en producción con datos reales.

**Siguiente fase aprobada:** embudo comercial completo.

Etapas del embudo:
1. Leads
2. Contactados
3. Clase de prueba
4. Matriculados (ya existe en `students` con `student_status = 'matriculado'`)
5. Activos (ya existe en `v_retention_dashboard.active_students`)

**Bloqueante:** no existe tabla `leads` en Supabase.
El endpoint `POST /api/leads` ya recibe los datos del formulario web pero solo los loguea en consola — no los persiste.

**Why:** el formulario de contacto ya está capturando nombre, email, teléfono, curso y fuente.
Al crear la tabla `leads` con esos campos más `status` (nuevo/contactado/prueba/matriculado) y `created_at`, el embudo se puede construir inmediatamente con datos reales.

**How to apply:** cuando el usuario pida construir el embudo comercial, primero generar la migración SQL para `leads`, luego persistir en `/api/leads/route.ts`, luego agregar la sección al dashboard.
