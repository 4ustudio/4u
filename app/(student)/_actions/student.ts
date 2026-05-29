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
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await admin()
    .from('students')
    .select('id, name, first_name, last_name, email, phone, student_type, status, enrolled_at')
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

  const { data: student } = await admin()
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

  const selectedDateIso = (formData.get('selected_date_iso') as string)?.trim()
  const selectedTime24h = (formData.get('selected_time_24h') as string)?.trim()
  const courseName      = (formData.get('course') as string)?.trim()

  if (!selectedDateIso || !selectedTime24h) {
    return { status: 'error', message: 'Selecciona una fecha y un horario para continuar.' }
  }

  if (!courseName) {
    return { status: 'error', message: 'Selecciona el instrumento o curso.' }
  }

  // Buscar course_id por nombre
  const { data: course } = await admin()
    .from('courses')
    .select('id, name')
    .ilike('name', courseName)
    .single()

  if (!course) {
    return { status: 'error', message: `El curso "${courseName}" no está disponible actualmente.` }
  }

  // Buscar salon disponible en esa fecha/hora
  const startTime = `${selectedTime24h}:00`

  const { data: slots, error: slotsError } = await admin().rpc('fn_available_slots', {
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

  // Reservar la clase
  const { data: bookResult, error: bookError } = await admin().rpc('fn_book_session', {
    p_student_id:   student.id,
    p_classroom_id: availableSlot.classroom_id,
    p_course_id:    course.id,
    p_date:         selectedDateIso,
    p_start_time:   startTime,
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

  redirect('/mi-cuenta')
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
