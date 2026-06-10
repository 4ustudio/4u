'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EnrollmentEvent, EnrollmentEventType, EnrollmentFunnelMetrics } from '@/types/enrollment'
import { safeRecordStudentActivity } from './retention'
import { activity } from '@/lib/activity'

// Para lecturas usa el cliente autenticado (JWT del admin + política RLS authenticated)
// Para escrituras usa el cliente admin (service_role)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

const STATUS_NAMES: Record<string, string> = {
  pending:      'Nuevo',
  contacted:    'Contactado',
  clase_prueba: 'Clase de Prueba',
  scheduled:    'Clase de Prueba',  // legacy
  perdido:      'Perdido',
  cancelled:    'Perdido',          // legacy
  converted:    'Matriculado',
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
  try {
    const supabase = await createAuthServerClient()
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      const { data: d2, error: e2 } = await db()
        .from('enrollments')
        .select('*')
        .eq('id', id)
        .single()
      if (e2) return null
      return d2
    }
    return data
  } catch {
    return null
  }
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

export async function updateEnrollmentFieldsAction(
  enrollmentId: string,
  fields: {
    source?: string | null
    assigned_to?: string | null
    last_contact_at?: string | null
    next_followup_at?: string | null
    lost_reason?: string | null
  }
): Promise<{ error?: string }> {
  const { error } = await db()
    .from('enrollments')
    .update(fields)
    .eq('id', enrollmentId)

  if (error) return { error: error.message }
  revalidatePath('/admin/enrollments')
  revalidatePath('/admin/leads')
  return {}
}

export async function getEnrollmentFunnelMetrics(): Promise<EnrollmentFunnelMetrics> {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data, error } = await db()
      .from('enrollments')
      .select('id, status, course_interest, source, created_at, converted_at')

    if (error || !data) {
      return {
        totalMonth: 0, pending: 0, contacted: 0, clasePrueba: 0,
        converted: 0, perdido: 0, conversionRate: 0,
        topCourses: [], topSources: [], avgDaysToConvert: null,
      }
    }

    const monthData = data.filter(
      (r: any) => new Date(r.created_at) >= startOfMonth
    )

    const counts = { pending: 0, contacted: 0, clasePrueba: 0, converted: 0, perdido: 0 }
    const courseMap: Record<string, number> = {}
    const sourceMap: Record<string, number> = {}
    const conversionDays: number[] = []

    for (const r of data as any[]) {
      const s = r.status
      if (s === 'pending')                         counts.pending++
      else if (s === 'contacted')                  counts.contacted++
      else if (s === 'clase_prueba' || s === 'scheduled') counts.clasePrueba++
      else if (s === 'converted')                  counts.converted++
      else if (s === 'perdido' || s === 'cancelled') counts.perdido++

      if (r.course_interest) courseMap[r.course_interest] = (courseMap[r.course_interest] ?? 0) + 1
      if (r.source)          sourceMap[r.source]           = (sourceMap[r.source]           ?? 0) + 1

      if (s === 'converted' && r.converted_at && r.created_at) {
        const days = Math.round(
          (new Date(r.converted_at).getTime() - new Date(r.created_at).getTime()) / 86400000
        )
        if (days >= 0) conversionDays.push(days)
      }
    }

    const decided = counts.converted + counts.perdido
    const conversionRate = decided > 0
      ? Math.round((counts.converted / decided) * 100)
      : 0

    const avgDaysToConvert = conversionDays.length > 0
      ? Math.round(conversionDays.reduce((a, b) => a + b, 0) / conversionDays.length)
      : null

    const topCourses = Object.entries(courseMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([course, count]) => ({ course, count }))

    const topSources = Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }))

    return {
      totalMonth: monthData.length,
      pending:    counts.pending,
      contacted:  counts.contacted,
      clasePrueba: counts.clasePrueba,
      converted:  counts.converted,
      perdido:    counts.perdido,
      conversionRate,
      topCourses,
      topSources,
      avgDaysToConvert,
    }
  } catch {
    return {
      totalMonth: 0, pending: 0, contacted: 0, clasePrueba: 0,
      converted: 0, perdido: 0, conversionRate: 0,
      topCourses: [], topSources: [], avgDaysToConvert: null,
    }
  }
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
  const now = new Date().toISOString()

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
      student_status: 'matriculado',
      student_since: now,
      last_activity_at: now,
      retention_score: 100,
      lead_id: enrollmentId,
    })
    .select('id')
    .single()

  if (studentErr) {
    if (studentErr.code === '23505') return { error: 'Ya existe un estudiante con ese email.' }
    return { error: studentErr.message }
  }

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

  await safeRecordStudentActivity(student.id, 'enrolled', 'Inscripcion convertida a estudiante.', {
    enrollment_id: enrollmentId,
  })

  await activity.enrollmentCompleted({
    enrollment_id: enrollmentId,
    student_name:  enrollment.student_name,
    source:        'admin',
  })
  await activity.leadConverted({
    lead_id:    enrollmentId,
    lead_name:  enrollment.student_name,
    student_id: student.id,
    source:     'admin',
  })

  revalidatePath('/admin/enrollments')
  revalidatePath('/admin/leads')
  revalidatePath('/admin/students')
  return { studentId: student.id }
}
