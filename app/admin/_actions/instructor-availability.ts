'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

export interface InstructorAvailability {
  id: string
  instructor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  status: 'available' | 'blocked'
  valid_from: string
  valid_until: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AvailabilityLog {
  id: string
  instructor_id: string
  availability_id: string | null
  action: string
  day_of_week: number | null
  start_time: string | null
  end_time: string | null
  status: string | null
  valid_from: string | null
  valid_until: string | null
  notes: string | null
  changed_at: string
  changed_by: string | null
}

export async function getInstructorAvailability(instructorId: string): Promise<InstructorAvailability[]> {
  const { data, error } = await db()
    .from('instructor_availability')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('day_of_week')
    .order('start_time')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAvailabilityLog(instructorId: string): Promise<AvailabilityLog[]> {
  const { data, error } = await db()
    .from('instructor_availability_log')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('changed_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createAvailabilityAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const instructor_id = formData.get('instructor_id') as string
  const day_of_week   = Number(formData.get('day_of_week'))
  const start_time    = formData.get('start_time') as string
  const end_time      = formData.get('end_time') as string
  const valid_from    = formData.get('valid_from') as string
  const valid_until   = (formData.get('valid_until') as string | null)?.trim() || null
  const status        = (formData.get('status') as string) || 'available'
  const notes         = (formData.get('notes') as string | null)?.trim() || null

  if (!instructor_id || !start_time || !end_time || !valid_from) {
    return { error: 'Completa todos los campos obligatorios.' }
  }

  const { data: row, error } = await db()
    .from('instructor_availability')
    .insert({ instructor_id, day_of_week, start_time, end_time, status, valid_from, valid_until, notes })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await db().from('instructor_availability_log').insert({
    instructor_id,
    availability_id: row?.id,
    action: 'created',
    day_of_week,
    start_time,
    end_time,
    status,
    valid_from,
    valid_until,
    notes,
    changed_by: 'admin',
  })

  revalidatePath(`/admin/instructors/${instructor_id}/disponibilidad`)
  return { success: true }
}

export async function updateAvailabilityAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id            = formData.get('id') as string
  const instructor_id = formData.get('instructor_id') as string
  const day_of_week   = Number(formData.get('day_of_week'))
  const start_time    = formData.get('start_time') as string
  const end_time      = formData.get('end_time') as string
  const valid_from    = formData.get('valid_from') as string
  const valid_until   = (formData.get('valid_until') as string | null)?.trim() || null
  const status        = (formData.get('status') as string) || 'available'
  const notes         = (formData.get('notes') as string | null)?.trim() || null

  if (!id || !instructor_id || !start_time || !end_time || !valid_from) {
    return { error: 'Completa todos los campos obligatorios.' }
  }

  const { error } = await db()
    .from('instructor_availability')
    .update({ day_of_week, start_time, end_time, status, valid_from, valid_until, notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  await db().from('instructor_availability_log').insert({
    instructor_id,
    availability_id: id,
    action: 'updated',
    day_of_week,
    start_time,
    end_time,
    status,
    valid_from,
    valid_until,
    notes,
    changed_by: 'admin',
  })

  revalidatePath(`/admin/instructors/${instructor_id}/disponibilidad`)
  return { success: true }
}

export async function deleteAvailabilityAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id            = formData.get('id') as string
  const instructor_id = formData.get('instructor_id') as string

  if (!id || !instructor_id) return { error: 'ID requerido.' }

  const { data: row } = await db()
    .from('instructor_availability')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await db()
    .from('instructor_availability')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  if (row) {
    await db().from('instructor_availability_log').insert({
      instructor_id,
      availability_id: id,
      action: 'deleted',
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      valid_from: row.valid_from,
      valid_until: row.valid_until,
      notes: row.notes,
      changed_by: 'admin',
    })
  }

  revalidatePath(`/admin/instructors/${instructor_id}/disponibilidad`)
  return { success: true }
}


