'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

export async function getInstructors() {
  const { data, error } = await db()
    .from('instructors')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createInstructorAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim()
  const email     = (formData.get('email')      as string)?.trim()
  const phone     = (formData.get('phone')      as string)?.trim() || null
  const password  = (formData.get('password')   as string)

  if (!firstName || !email || !password) {
    return { error: 'Nombre, email y contraseña son obligatorios.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const adminClient = db()

  // Verificar email no duplicado en instructors
  const { data: existing } = await adminClient
    .from('instructors')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) return { error: 'Ya existe un instructor con ese email.' }

  // Crear usuario auth con role instructor
  const { data: authData, error: authError } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'instructor', name: fullName, full_name: fullName },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('already been registered')) {
      return { error: 'Ya existe una cuenta de acceso con ese email.' }
    }
    return { error: authError.message }
  }

  // Insertar en tabla instructors
  const { error: dbError } = await adminClient
    .from('instructors')
    .insert({ name: fullName, email, phone, status: 'active' })

  if (dbError) {
    // Revertir usuario auth si falla el insert
    await createAdminClient().auth.admin.deleteUser(authData.user.id)
    return { error: dbError.message }
  }

  revalidatePath('/admin/instructors')
  revalidatePath('/agendar')
  return { success: true }
}

export async function getInstructorById(id: string) {
  const adminClient = db()
  const { data, error } = await adminClient
    .from('instructors')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)

  const { data: availability } = await adminClient
    .from('instructor_availability')
    .select('day_of_week, start_time, end_time')
    .eq('instructor_id', id)
    .order('day_of_week')
    .order('start_time')

  return { ...data, availability: availability ?? [] }
}

export async function saveAdminInstructorAvailabilityAction(
  instructorId: string,
  slots: Array<{ day_of_week: number; start_time: string; end_time: string }>
): Promise<{ success?: boolean; error?: string }> {
  const adminClient = db()
  await adminClient.from('instructor_availability').delete().eq('instructor_id', instructorId)
  if (slots.length > 0) {
    const { error } = await adminClient.from('instructor_availability').insert(
      slots.map(s => ({ ...s, instructor_id: instructorId }))
    )
    if (error) return { error: error.message }
  }
  revalidatePath('/admin/instructors')
  revalidatePath('/agendar')
  return { success: true }
}

export async function updateInstructorAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id        = (formData.get('id')         as string)?.trim()
  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim()
  const email     = (formData.get('email')      as string)?.trim()
  const phone     = (formData.get('phone')      as string)?.trim() || null
  const status    = (formData.get('status')     as string)?.trim()
  const notes     = (formData.get('notes')      as string)?.trim() || null
  const password  = (formData.get('password')   as string)?.trim() || null

  if (!id || !firstName) return { error: 'El nombre es obligatorio.' }

  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const adminClient = db()

  // Obtener email actual antes de actualizar
  const { data: current } = await adminClient.from('instructors').select('email').eq('id', id).single()
  const currentEmail = current?.email

  const updatePayload: Record<string, unknown> = { name: fullName, phone, status, notes }
  if (email && email !== currentEmail) updatePayload.email = email

  const { error: dbError } = await adminClient
    .from('instructors')
    .update(updatePayload)
    .eq('id', id)

  if (dbError) return { error: dbError.message }

  // Actualizar usuario auth si cambió el email o la contraseña
  if ((email && email !== currentEmail) || (password && password.length >= 6)) {
    const { data: users } = await createAdminClient().auth.admin.listUsers()
    const authUser = users?.users?.find((u: any) => u.email === currentEmail)
    if (authUser) {
      const authUpdate: Record<string, unknown> = {}
      if (email && email !== currentEmail) authUpdate.email = email
      if (password && password.length >= 6) authUpdate.password = password
      await createAdminClient().auth.admin.updateUserById(authUser.id, authUpdate)
    }
  }

  revalidatePath('/admin/instructors')
  revalidatePath('/agendar')
  return { success: true }
}

export async function deleteInstructorAction(
  instructorId: string,
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const adminClient = db()

  // Buscar y borrar usuario auth por email
  const { data: users } = await createAdminClient().auth.admin.listUsers()
  const authUser = users?.users?.find((u: any) => u.email === email)
  if (authUser) {
    await createAdminClient().auth.admin.deleteUser(authUser.id)
  }

  const { error } = await adminClient
    .from('instructors')
    .delete()
    .eq('id', instructorId)

  if (error) return { error: error.message }

  revalidatePath('/admin/instructors')
  revalidatePath('/agendar')
  return { success: true }
}
