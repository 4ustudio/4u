'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Student, StudentStatus, StudentType } from '@/types/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

// ─── Lectura ────────────────────────────────────────────────

export async function getStudents(): Promise<Student[]> {
  const { data, error } = await db()
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getStudent(id: string) {
  const [{ data: student, error }, usageResult] = await Promise.all([
    db().from('students').select('*').eq('id', id).single(),
    db().rpc('fn_monthly_usage', {
      p_student_id: id,
      p_year:  new Date().getFullYear(),
      p_month: new Date().getMonth() + 1,
    }),
  ])

  if (error) throw new Error((error as any).message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { student, usage: (usageResult as any).data?.[0] ?? null }
}

export async function getLeads() {
  const { data, error } = await db()
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Mutaciones ─────────────────────────────────────────────

interface StudentInput {
  name: string
  phone: string
  email?: string
  student_type: StudentType
  notes?: string
  lead_id?: string
}

export async function createStudentAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const input: StudentInput = {
    name:         (formData.get('name')         as string).trim(),
    phone:        (formData.get('phone')        as string).trim(),
    email:        (formData.get('email')        as string | null)?.trim() || undefined,
    student_type: (formData.get('student_type') as StudentType) ?? 'new',
    notes:        (formData.get('notes')        as string | null)?.trim() || undefined,
    lead_id:      (formData.get('lead_id')      as string | null) || undefined,
  }

  if (!input.name || !input.phone) {
    return { error: 'Nombre y teléfono son obligatorios.' }
  }

  const { error } = await db()
    .from('students')
    .insert({ ...input, status: 'active' })

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un estudiante con ese email.' }
    return { error: error.message }
  }

  revalidatePath('/admin/students')
  return { success: true }
}

export async function updateStudentAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id = formData.get('id') as string
  const updates = {
    name:         (formData.get('name')         as string).trim(),
    phone:        (formData.get('phone')        as string).trim(),
    email:        (formData.get('email')        as string | null)?.trim() || null,
    status:       (formData.get('status')       as StudentStatus),
    student_type: (formData.get('student_type') as StudentType),
    notes:        (formData.get('notes')        as string | null)?.trim() || null,
  }

  if (!updates.name || !updates.phone) {
    return { error: 'Nombre y teléfono son obligatorios.' }
  }

  const { error } = await db()
    .from('students')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${id}`)
  return { success: true }
}
