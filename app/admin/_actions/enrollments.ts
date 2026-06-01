'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EnrollmentEvent, EnrollmentEventType } from '@/types/enrollment'

// Para lecturas usa el cliente autenticado (JWT del admin + política RLS authenticated)
// Para escrituras usa el cliente admin (service_role)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

const STATUS_NAMES: Record<string, string> = {
  pending:   'Pendiente',
  contacted: 'Contactado',
  scheduled: 'Agendado',
  cancelled: 'Cancelado',
  converted: 'Convertido',
}

// ── Lectura ──────────────────────────────────────────────────

export async function getEnrollments(): Promise<{ data: any[]; error: string | null }> {
  try {
    // Usar cliente autenticado para lectura — más robusto en producción
    const supabase = await createAuthServerClient()
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      // Fallback a admin client si el cliente auth falla
      const { data: d2, error: e2 } = await db()
        .from('enrollments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (e2) return { data: [], error: e2.message }
      return { data: d2 ?? [], error: null }
    }
    return { data: data ?? [], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export async function getEnrollment(id: string) {
  const { data, error } = await db()
    .from('enrollments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getEnrollmentEvents(enrollmentId: string): Promise<EnrollmentEvent[]> {
  try {
    const supabase = await createAuthServerClient()
    const { data, error } = await supabase
      .from('enrollment_events')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: true })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

// ── Escritura ────────────────────────────────────────────────

export async function addEnrollmentEvent(
  enrollmentId: string,
  type: EnrollmentEventType,
  description: string
): Promise<void> {
  await db()
    .from('enrollment_events')
    .insert({ enrollment_id: enrollmentId, type, description })
}

export async function updateEnrollmentStatusAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id     = formData.get('id') as string
  const status = formData.get('status') as string

  if (!id || !status) return { error: 'Faltan datos.' }

  const { error } = await db()
    .from('enrollments')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  await db().from('enrollment_events').insert({
    enrollment_id: id,
    type:         'status_changed',
    description:  `Estado cambiado a ${STATUS_NAMES[status] ?? status}`,
  })

  revalidatePath('/admin/enrollments')
  return { success: true }
}

export async function saveInternalNotes(
  enrollmentId: string,
  notes: string
): Promise<{ error?: string }> {
  const { error } = await db()
    .from('enrollments')
    .update({ internal_notes: notes || null })
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  await db().from('enrollment_events').insert({
    enrollment_id: enrollmentId,
    type:         'note_added',
    description:  'Nota interna actualizada',
  })

  return {}
}

export async function convertEnrollmentToStudent(
  enrollmentId: string
): Promise<{ error?: string; studentId?: string }> {
  const enrollment = await getEnrollment(enrollmentId)
  if (!enrollment) return { error: 'Inscripción no encontrada.' }
  if (enrollment.converted_at) return { error: 'Esta inscripción ya fue convertida.' }

  const parts      = enrollment.student_name.trim().split(/\s+/)
  const first_name = parts[0] ?? ''
  const last_name  = parts.slice(1).join(' ') || ''

  const { data: student, error: studentErr } = await db()
    .from('students')
    .insert({
      name:         enrollment.student_name,
      first_name,
      last_name,
      phone:        enrollment.phone,
      email:        enrollment.email,
      notes:        enrollment.notes ?? null,
      student_type: 'new',
      status:       'active',
      enrolled_at:  new Date().toISOString().split('T')[0],
    })
    .select('id')
    .single()

  if (studentErr) {
    if (studentErr.code === '23505') return { error: 'Ya existe un estudiante con ese email.' }
    return { error: studentErr.message }
  }

  const now = new Date().toISOString()

  const { error: updateErr } = await db()
    .from('enrollments')
    .update({
      status:               'converted',
      converted_at:         now,
      converted_student_id: student.id,
    })
    .eq('id', enrollmentId)

  if (updateErr) return { error: updateErr.message }

  await db().from('enrollment_events').insert({
    enrollment_id: enrollmentId,
    type:         'converted',
    description:  'Convertido a estudiante activo',
  })

  revalidatePath('/admin/enrollments')
  revalidatePath('/admin/students')
  return { studentId: student.id }
}
