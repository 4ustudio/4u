'use server'

import { createAuthServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { BookingFormState } from '@/types/booking'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function admin(): any { return createAdminClient() }

// ─── Helpers ────────────────────────────────────────────────────────

async function getAuthenticatedStudent() {
  // Usar cliente autenticado (anon key + sesión + RLS) para el lookup
  // Evita depender del service_role key para queries del portal estudiante
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id, name, email, phone, student_type, status, enrolled_at, user_id')
    .eq('user_id', user.id)
    .single()

  return student ?? null
}

// ─── Datos del dashboard ─────────────────────────────────────────────

export async function getMyDashboardData(userId?: string) {
  // Aceptar userId externo para evitar segunda llamada a getUser()
  // desde el Server Component (que ya validó la sesión)
  let uid = userId
  if (!uid) {
    const supabase = await createAuthServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    uid = user.id
  }

  // Usar cliente autenticado (anon key + sesión) para respetar RLS
  // Esto funciona gracias a la policy: SELECT WHERE auth.uid() = user_id
  const authClient = await createAuthServerClient()
  const { data: student } = await authClient
    .from('students')
    .select('*')
    .eq('user_id', uid)
    .single()

  if (!student) return null

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  const [usageResult, { data: sessions }, { data: schedules }] = await Promise.all([
    admin().rpc('fn_monthly_usage', {
      p_student_id: student.id,
      p_year:  now.getFullYear(),
      p_month: now.getMonth() + 1,
    }),
    admin()
      .from('class_sessions')
      .select('*, course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .eq('student_id', student.id)
      .order('scheduled_date', { ascending: true })
      .order('start_time',     { ascending: true })
      .limit(50),
    admin()
      .from('student_schedules')
      .select('*, course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .eq('student_id', student.id)
      .eq('status', 'active')
      .order('day_of_week')
      .order('start_time'),
  ])

  const allSessions = (sessions ?? []) as any[]
  const upcoming = allSessions
    .filter(s => s.scheduled_date >= today && ['pending', 'confirmed'].includes(s.status))
    .slice(0, 10)
  const past = allSessions
    .filter(s => s.scheduled_date < today || ['completed', 'cancelled', 'no_show', 'rescheduled'].includes(s.status))
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    .slice(0, 20)

  return {
    student,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usage: (usageResult as any).data?.[0] ?? null,
    upcoming,
    past,
    schedules: (schedules ?? []) as any[],
  }
}

// ─── Agendar clase ───────────────────────────────────────────────────

export async function studentBookAction(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const student = await getAuthenticatedStudent()
  if (!student) {
    return { status: 'error', message: 'Sesión expirada. Por favor inicia sesión nuevamente.' }
  }

  const selectedDateIso  = (formData.get('selected_date_iso')      as string)?.trim()
  const selectedTime24h  = (formData.get('selected_time_24h')      as string)?.trim()
  const courseName       = (formData.get('course')                 as string)?.trim()
  const instructorId     = (formData.get('selected_instructor_id') as string)?.trim() || null

  if (!selectedDateIso || !selectedTime24h) {
    return { status: 'error', message: 'Selecciona una fecha y un horario para continuar.' }
  }

  if (!courseName) {
    return { status: 'error', message: 'Selecciona el instrumento o curso.' }
  }

  // Catálogos: usar admin client (service_role) — bypasses RLS para tablas públicas
  const adminClient = admin()
  const authClient  = await createAuthServerClient()

  const { data: course } = await adminClient
    .from('courses')
    .select('id, name')
    .ilike('name', courseName)
    .eq('is_active', true)
    .single()

  if (!course) {
    return { status: 'error', message: `El curso "${courseName}" no está disponible actualmente.` }
  }

  const startTime = `${selectedTime24h}:00`

  // fn_available_slots es SECURITY DEFINER — funciona con admin client
  const { data: slots, error: slotsError } = await adminClient.rpc('fn_available_slots', {
    p_date: selectedDateIso,
    p_student_id: student.id,
  })

  if (slotsError) {
    return { status: 'error', message: 'No se pudo consultar disponibilidad. Intenta de nuevo.' }
  }

  const availableSlot = (slots ?? []).find(
    (s: any) => s.slot_time === startTime && s.is_available
  )

  if (!availableSlot) {
    return { status: 'error', message: 'El horario seleccionado no está disponible. Elige otro horario.' }
  }

  // fn_book_session es SECURITY DEFINER — usar admin client para garantizar ejecución
  const { data: bookResult, error: bookError } = await adminClient.rpc('fn_book_session', {
    p_student_id:    student.id,
    p_classroom_id:  availableSlot.classroom_id,
    p_course_id:     course.id,
    p_date:          selectedDateIso,
    p_start_time:    startTime,
    p_instructor_id: instructorId ?? undefined,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = bookResult as any
  if (bookError || !result?.success) {
    return {
      status: 'error',
      message: result?.error ?? (bookError as any)?.message ?? 'No se pudo agendar la clase.',
    }
  }

  revalidatePath('/mi-cuenta')
  return { status: 'success', submittedCourse: (course as any).name }
}

// ─── Auth ────────────────────────────────────────────────────────────

export async function loginAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const email    = (formData.get('email')    as string)?.trim()
  const password = (formData.get('password') as string)

  if (!email || !password) return { error: 'Completa todos los campos.' }

  const supabase = await createAuthServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('invalid login')) {
      return { error: 'Email o contraseña incorrectos.' }
    }
    return { error: error.message }
  }

  // Verificar si el usuario tiene un perfil de estudiante.
  // Si no, redirigir al panel admin (caso de usuarios administradores).
  const { data: { user: loggedUser } } = await supabase.auth.getUser()
  if (loggedUser) {
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', loggedUser.id)
      .maybeSingle()
    if (!studentRecord) {
      redirect('/admin')
    }
  }

  const next = (formData.get('next') as string | null)?.trim()
  const safePath = next && next.startsWith('/') && !next.startsWith('//') ? next : '/mi-cuenta'
  redirect(safePath)
}

export async function resetPasswordAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get('email') as string)?.trim()
  if (!email) return { error: 'Ingresa tu email.' }

  const supabase = await createAuthServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/mi-cuenta`,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function registerAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const first_name = (formData.get('first_name') as string)?.trim()
  const last_name  = (formData.get('last_name')  as string)?.trim()
  const email      = (formData.get('email')      as string)?.trim()
  const phone      = (formData.get('phone')      as string)?.trim()
  const password   = (formData.get('password')   as string)

  if (!first_name || !email || !phone || !password) {
    return { error: 'Completa todos los campos obligatorios.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const supabase = await createAuthServerClient()

  // 1. Crear usuario en auth.users (crea sesión automáticamente)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'student' } },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('already been registered')) {
      return { error: 'Ya existe una cuenta con ese email. Inicia sesión.' }
    }
    return { error: authError.message }
  }

  if (!authData.user?.id) {
    return { error: 'No se pudo crear la cuenta. Intenta de nuevo.' }
  }

  // 2. Crear registro en students vinculado al nuevo user
  // Usamos columnas garantizadas en el schema base (name, email, phone, user_id)
  const { error: studentError } = await admin()
    .from('students')
    .insert({
      name: `${first_name} ${last_name}`.trim() || first_name,
      email,
      phone,
      user_id: authData.user.id,
      status: 'active',
      student_type: 'new',
    })

  if (studentError) {
    // Limpiar usuario auth si falla la creación del estudiante
    await admin().auth.admin.deleteUser(authData.user.id)
    if (studentError.code === '23505') {
      return { error: 'Ya existe un estudiante con ese email.' }
    }
    return { error: studentError.message }
  }

  redirect('/mi-cuenta')
}

export async function logoutAction() {
  const supabase = await createAuthServerClient()
  await supabase.auth.signOut()
  redirect('/mi-cuenta/login')
}

// ─── Perfil ──────────────────────────────────────────────────────────

export async function updateProfileAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim()
  const avatarUrl = (formData.get('avatar_url') as string)?.trim() || undefined

  if (!firstName) return { error: 'El nombre es requerido.' }

  const adminClient = createAdminClient()

  // Actualizar nombre en tabla students
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: studentErr } = await (adminClient as any)
    .from('students')
    .update({
      first_name: firstName,
      last_name:  lastName || null,
      name:       [firstName, lastName].filter(Boolean).join(' '),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (studentErr) return { error: 'No se pudo actualizar el perfil.' }

  // Si viene avatar, guardarlo en user_metadata (no requiere columna nueva)
  if (avatarUrl) {
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, avatar_url: avatarUrl },
    })
  }

  revalidatePath('/mi-cuenta')
  return { success: true }
}

// ─── Upload avatar (server-side, bypassa RLS con admin client) ────────

export async function uploadAvatarAction(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'Archivo inválido.' }
  if (file.size > 2 * 1024 * 1024) return { error: 'La imagen no puede superar 2MB.' }

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  const adminClient = createAdminClient()
  const { error: uploadErr } = await (adminClient as any)
    .storage.from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadErr) return { error: uploadErr.message ?? 'No se pudo subir la imagen.' }

  const { data: { publicUrl } } = (adminClient as any)
    .storage.from('avatars')
    .getPublicUrl(path)

  // Persistir en user_metadata para que persista entre sesiones
  await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, avatar_url: publicUrl },
  })

  revalidatePath('/mi-cuenta')
  return { url: publicUrl }
}
