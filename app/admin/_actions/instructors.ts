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
