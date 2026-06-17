'use server'

import { createAuthServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { BookingFormState } from '@/types/booking'
import { safeRecordStudentActivity } from '@/app/admin/_actions/retention'
import { activity } from '@/lib/activity'

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

// ─── Sesiones de un mes (solo lectura, para el calendario) ───────────

export async function getMonthSessions(year: number, month: number) {
  // Lectura del mes solicitado para navegación del calendario.
  // No modifica lógica de negocio; equivalente a la query de clases-mes.
  const student = await getAuthenticatedStudent()
  if (!student) return []

  const mm = String(month).padStart(2, '0')
  const monthStart = `${year}-${mm}-01`
  // Primer día del mes siguiente (evita fechas inválidas tipo "06-31")
  const nextYear  = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data: sessions } = await admin()
    .from('class_sessions')
    .select('*, course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
    .eq('student_id', student.id)
    .gte('scheduled_date', monthStart)
    .lt('scheduled_date', nextStart)
    .order('scheduled_date', { ascending: true })
    .order('start_time',     { ascending: true })

  return (sessions ?? []) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function getInstructorDashboardData(userId: string, email?: string | null) {
  const adminClient = admin()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const monthStart = `${now.getFullYear()}-${mm}-01`
  const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
  const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2
  const nextStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const lookupEmail = email?.trim()
  const metadataId = userId

  let instructor = null as any // eslint-disable-line @typescript-eslint/no-explicit-any
  if (lookupEmail) {
    const { data } = await adminClient
      .from('instructors')
      .select('*')
      .eq('email', lookupEmail)
      .maybeSingle()
    instructor = data ?? null
  }

  if (!instructor) {
    const { data } = await adminClient
      .from('instructors')
      .select('*')
      .eq('id', metadataId)
      .maybeSingle()
    instructor = data ?? null
  }

  if (!instructor) return null

  const [{ data: sessions }, { data: availability }, { count: blockCount }, { data: lastLog }] = await Promise.all([
    adminClient
      .from('class_sessions')
      .select('*, student:students(name, phone), course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .eq('instructor_id', instructor.id)
      .gte('scheduled_date', monthStart)
      .lt('scheduled_date', nextStart)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true }),
    adminClient
      .from('instructor_availability')
      .select('*')
      .eq('instructor_id', instructor.id)
      .order('day_of_week')
      .order('start_time'),
    adminClient
      .from('instructor_availability_blocks')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', instructor.id),
    adminClient
      .from('instructor_availability_log')
      .select('created_at')
      .eq('instructor_id', instructor.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const monthSessions = (sessions ?? []) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  const upcoming = monthSessions
    .filter(s => s.scheduled_date >= today && ['pending', 'confirmed'].includes(s.status))
    .slice(0, 8)
  const cancelled = monthSessions
    .filter(s => s.status === 'cancelled' || s.status === 'no_show')
    .slice(0, 8)
  const uniqueStudents = new Set(monthSessions.map(s => s.student_id).filter(Boolean))

  const lastMod = lastLog ? (lastLog as any).created_at : null

  return {
    instructor,
    sessions: monthSessions,
    availability: availability ?? [],
    upcoming,
    cancelled,
    blocksCount: blockCount ?? 0,
    lastModification: lastMod,
    availabilitySummary: {
      totalSlots: (availability ?? []).length,
      activeDays: new Set((availability ?? []).map((a: any) => a.day_of_week)).size,
      blockedDates: blockCount ?? 0,
      lastModified: lastMod,
    },
    stats: {
      weekScheduled: upcoming.length,
      completed: monthSessions.filter(s => s.status === 'completed').length,
      cancelled: cancelled.length,
      activeStudents: uniqueStudents.size,
      todayUpcoming: upcoming.filter(s => s.scheduled_date === today).length,
    },
  }
}

// ─── Agendar clase ───────────────────────────────────────────────────

export async function studentBookAction(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const supabase = await createAuthServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return { status: 'error', message: 'Debes iniciar sesión para agendar una clase.' }
  }
  // Usar admin client para el lookup de student: evita RLS en contexto server action
  const { data: student } = await admin()
    .from('students')
    .select('id, name, email, phone, student_type, status, enrolled_at, user_id')
    .eq('user_id', authUser.id)
    .single()
  if (!student) {
    return { status: 'error', message: 'No tienes una cuenta de estudiante activa. Contacta a 4U Studio.' }
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
    return {
      status: 'error',
      message: 'Este horario acaba de ser reservado. Por favor selecciona otro horario disponible.',
      isRaceCondition: true,
    }
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

  await safeRecordStudentActivity(student.id, 'class_booked', 'Clase agendada desde el portal del estudiante.', {
    course_id: (course as any).id,
    scheduled_date: selectedDateIso,
    start_time: startTime,
  })

  await activity.sessionCreated({
    session_id:     String((result as any).session_id ?? ''),
    instructor_name: instructorId ? `Instructor ${instructorId}` : 'Sin asignar',
    student_name:   (student as any).name ?? 'Estudiante',
    scheduled_at:   `${selectedDateIso} ${startTime}`,
    source:         'portal',
  })

  revalidatePath('/mi-cuenta')
  revalidatePath('/agendar')
  return { status: 'success', submittedCourse: (course as any).name }
}

// ─── Disponibilidad de slots (para booking en tiempo real) ───────────

export async function getAvailableSlotsAction(date: string): Promise<Array<{
  slot_time: string
  classroom_id: string
  classroom_name: string
  is_available: boolean
}>> {
  const student = await getAuthenticatedStudent()
  const { data } = await admin().rpc('fn_available_slots', {
    p_date: date,
    p_student_id: student?.id ?? null,
  })
  return (data ?? []) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function getInstructorForSlotAction(date: string, time: string): Promise<{ id: string; name: string } | null> {
  const dow = new Date(date + 'T12:00:00').getDay()
  const isodow = dow === 0 ? 7 : dow
  const [h] = time.split(':').map(Number)
  const endTime = `${String(h + 1).padStart(2, '0')}:00:00`
  const startTime = `${time}:00`

  const { data } = await admin()
    .from('instructors')
    .select('id, name, instructor_availability!inner(day_of_week, start_time, end_time)')
    .eq('status', 'active')
    .eq('instructor_availability.day_of_week', isodow)
    .lte('instructor_availability.start_time', startTime)
    .gte('instructor_availability.end_time', endTime)

  if (!data || data.length === 0) return null
  const pick = data[Math.floor(Math.random() * data.length)]
  return { id: pick.id, name: pick.name }
}

export async function getActiveCoursesAction(): Promise<{ id: string; name: string }[]> {
  const { data } = await admin()
    .from('courses')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  return (data ?? []) as { id: string; name: string }[]
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

  // Verificar el rol para enviar cada perfil a su espacio.
  const { data: { user: loggedUser } } = await supabase.auth.getUser()
  if (loggedUser) {
    const role = loggedUser.user_metadata?.role
    if (role === 'owner' || role === 'super_admin' || role === 'admin' || role === 'sales') redirect('/admin')
    if (role === 'instructor') redirect('/mi-cuenta')

    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', loggedUser.id)
      .maybeSingle()
    if (!studentRecord) {
      redirect('/planes')
    }
    await safeRecordStudentActivity(studentRecord.id, 'login', 'Inicio de sesion en portal estudiante.')
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
      first_name,
      last_name,
      email,
      phone,
      user_id: authData.user.id,
      status: 'active',
      student_type: 'new',
      student_status: 'lead',
      student_since: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      retention_score: 100,
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

  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  await activity.studentProfileUpdated({
    student_id:   user.id,
    student_name: fullName,
    source:       'portal',
  })

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

// ─── Instructor: sesiones por mes (para calendario navegable) ────────

export async function getInstructorMonthSessions(year: number, month: number) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return []

  const mm = String(month).padStart(2, '0')
  const monthStart = `${year}-${mm}-01`
  const nextYear  = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const adminClient = admin()
  const { data: instructor } = await adminClient
    .from('instructors')
    .select('id')
    .eq('email', user.email.trim())
    .maybeSingle()

  if (!instructor) return []

  const { data: sessions } = await adminClient
    .from('class_sessions')
    .select('*, student:students(name,phone), course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
    .eq('instructor_id', instructor.id)
    .gte('scheduled_date', monthStart)
    .lt('scheduled_date', nextStart)
    .order('scheduled_date', { ascending: true })
    .order('start_time',     { ascending: true })

  return (sessions ?? []) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ─── Helpers de sesión para instructor ──────────────────────────────

async function getInstructorFromSession() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const adminClient = admin()
  const { data: instructor } = await adminClient
    .from('instructors')
    .select('id, name')
    .eq('email', user.email.trim())
    .maybeSingle()
  if (!instructor) return null
  return {
    instructor,
    userEmail: user.email,
    userName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? instructor.name ?? 'Instructor',
  }
}

async function logAvailabilityAction(
  params: {
    instructorId: string
    availabilityId?: string | null
    action: string
    dayOfWeek?: number | null
    startTime?: string | null
    endTime?: string | null
    status?: string | null
    validFrom?: string | null
    validUntil?: string | null
    notes?: string | null
    blockedDate?: string | null
    blockReason?: string | null
    blockStartTime?: string | null
    blockEndTime?: string | null
    prevValues?: Record<string, unknown>
    changedBy: string
    changedByName: string
  }
) {
  await (admin().from('instructor_availability_log').insert({
    instructor_id: params.instructorId,
    availability_id: params.availabilityId ?? null,
    action: params.action,
    day_of_week: params.dayOfWeek ?? null,
    start_time: params.startTime ?? null,
    end_time: params.endTime ?? null,
    status: params.status ?? null,
    valid_from: params.validFrom ?? null,
    valid_until: params.validUntil ?? null,
    notes: params.notes ?? null,
    blocked_date: params.blockedDate ?? null,
    block_reason: params.blockReason ?? null,
    block_start_time: params.blockStartTime ?? null,
    block_end_time: params.blockEndTime ?? null,
    changed_by: params.changedBy,
    changed_by_name: params.changedByName,
    prev_values: params.prevValues ?? {},
  } as never))
}

// ─── Instructor: guardar disponibilidad (batch — compatible con UI actual) ─

export async function saveInstructorAvailabilityAction(
  slots: Array<{ day_of_week: number; start_time: string; end_time: string }>
): Promise<{ success?: boolean; error?: string }> {
  const session = await getInstructorFromSession()
  if (!session) return { error: 'Sesión expirada.' }
  const { instructor, userEmail, userName } = session
  const adminClient = admin()

  // Obtener valores anteriores para el log
  const { data: oldSlots } = await adminClient
    .from('instructor_availability')
    .select('*')
    .eq('instructor_id', instructor.id)

  await adminClient.from('instructor_availability').delete().eq('instructor_id', instructor.id)

  // Registrar eliminación de cada slot anterior
  if (oldSlots) {
    for (const slot of oldSlots as any[]) {
      await logAvailabilityAction({
        instructorId: instructor.id,
        availabilityId: slot.id,
        action: 'deleted',
        dayOfWeek: slot.day_of_week,
        startTime: slot.start_time,
        endTime: slot.end_time,
        status: slot.status ?? 'available',
        validFrom: slot.valid_from ?? null,
        validUntil: slot.valid_until ?? null,
        notes: slot.notes ?? null,
        changedBy: userEmail,
        changedByName: userName,
        prevValues: slot,
      })
    }
  }

  if (slots.length > 0) {
    const { error, data: newSlots } = await adminClient.from('instructor_availability').insert(
      slots.map(s => ({ ...s, instructor_id: instructor.id }))
    ).select()

    if (error) return { error: error.message }

    // Registrar creación de cada nuevo slot
    if (newSlots) {
      for (const slot of newSlots as any[]) {
        await logAvailabilityAction({
          instructorId: instructor.id,
          availabilityId: slot.id,
          action: 'created',
          dayOfWeek: slot.day_of_week,
          startTime: slot.start_time,
          endTime: slot.end_time,
          status: slot.status ?? 'available',
          validFrom: slot.valid_from ?? null,
          validUntil: slot.valid_until ?? null,
          notes: slot.notes ?? null,
          changedBy: userEmail,
          changedByName: userName,
        })
      }
    }
  }

  revalidatePath('/mi-cuenta')
  return { success: true }
}

// ─── Instructor: crear disponibilidad individual ────────────────────

export async function createInstructorAvailabilityAction(
  slot: { day_of_week: number; start_time: string; end_time: string; status?: string; notes?: string; valid_from?: string; valid_until?: string }
): Promise<{ success?: boolean; error?: string }> {
  const session = await getInstructorFromSession()
  if (!session) return { error: 'Sesión expirada.' }
  const { instructor, userEmail, userName } = session

  const { error, data: newSlot } = await admin().from('instructor_availability').insert({
    instructor_id: instructor.id,
    day_of_week: slot.day_of_week,
    start_time: slot.start_time,
    end_time: slot.end_time,
    status: slot.status ?? 'available',
    notes: slot.notes ?? null,
    valid_from: slot.valid_from ?? new Date().toISOString().slice(0, 10),
    valid_until: slot.valid_until ?? null,
  }).select().single()

  if (error) return { error: error.message }

  await logAvailabilityAction({
    instructorId: instructor.id,
    availabilityId: newSlot?.id,
    action: 'created',
    dayOfWeek: slot.day_of_week,
    startTime: slot.start_time,
    endTime: slot.end_time,
    status: slot.status ?? 'available',
    changedBy: userEmail,
    changedByName: userName,
  })

  revalidatePath('/mi-cuenta')
  return { success: true }
}

// ─── Instructor: actualizar disponibilidad individual ───────────────

export async function updateInstructorAvailabilityAction(
  id: string,
  updates: { day_of_week?: number; start_time?: string; end_time?: string; status?: string; notes?: string; valid_from?: string; valid_until?: string }
): Promise<{ success?: boolean; error?: string }> {
  const session = await getInstructorFromSession()
  if (!session) return { error: 'Sesión expirada.' }
  const { instructor, userEmail, userName } = session

  // Obtener valor anterior
  const { data: old } = await admin().from('instructor_availability').select('*').eq('id', id).single()
  if (!old) return { error: 'Horario no encontrado.' }

  const { error } = await admin().from('instructor_availability').update({
    ...updates,
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('instructor_id', instructor.id)

  if (error) return { error: error.message }

  await logAvailabilityAction({
    instructorId: instructor.id,
    availabilityId: id,
    action: 'updated',
    dayOfWeek: updates.day_of_week ?? (old as any).day_of_week,
    startTime: updates.start_time ?? (old as any).start_time,
    endTime: updates.end_time ?? (old as any).end_time,
    status: updates.status ?? (old as any).status,
    validFrom: updates.valid_from ?? (old as any).valid_from,
    validUntil: updates.valid_until ?? (old as any).valid_until,
    notes: updates.notes ?? (old as any).notes,
    changedBy: userEmail,
    changedByName: userName,
    prevValues: old as Record<string, unknown>,
  })

  revalidatePath('/mi-cuenta')
  return { success: true }
}

// ─── Instructor: eliminar disponibilidad individual ─────────────────

export async function deleteInstructorAvailabilityAction(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await getInstructorFromSession()
  if (!session) return { error: 'Sesión expirada.' }
  const { instructor, userEmail, userName } = session

  const { data: old } = await admin().from('instructor_availability').select('*').eq('id', id).single()
  if (!old) return { error: 'Horario no encontrado.' }

  const { error } = await admin().from('instructor_availability').delete().eq('id', id).eq('instructor_id', instructor.id)
  if (error) return { error: error.message }

  await logAvailabilityAction({
    instructorId: instructor.id,
    availabilityId: id,
    action: 'deleted',
    dayOfWeek: (old as any).day_of_week,
    startTime: (old as any).start_time,
    endTime: (old as any).end_time,
    status: (old as any).status,
    validFrom: (old as any).valid_from ?? null,
    validUntil: (old as any).valid_until ?? null,
    notes: (old as any).notes ?? null,
    changedBy: userEmail,
    changedByName: userName,
    prevValues: old as Record<string, unknown>,
  })

  revalidatePath('/mi-cuenta')
  return { success: true }
}

// ─── Instructor: ampliar horario ────────────────────────────────────

export async function extendInstructorAvailabilityAction(
  id: string,
  newEndTime: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await getInstructorFromSession()
  if (!session) return { error: 'Sesión expirada.' }
  const { instructor, userEmail, userName } = session

  const { data: old } = await admin().from('instructor_availability').select('*').eq('id', id).single()
  if (!old) return { error: 'Horario no encontrado.' }

  if (newEndTime <= (old as any).end_time) {
    return { error: 'El nuevo horario debe ser mayor al actual.' }
  }

  const { error } = await admin().from('instructor_availability').update({
    end_time: newEndTime,
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('instructor_id', instructor.id)

  if (error) return { error: error.message }

  await logAvailabilityAction({
    instructorId: instructor.id,
    availabilityId: id,
    action: 'extended',
    dayOfWeek: (old as any).day_of_week,
    startTime: (old as any).start_time,
    endTime: newEndTime,
    status: (old as any).status,
    notes: `Ampliado de ${(old as any).end_time?.slice(0, 5)} a ${newEndTime.slice(0, 5)}`,
    changedBy: userEmail,
    changedByName: userName,
    prevValues: old as Record<string, unknown>,
  })

  revalidatePath('/mi-cuenta')
  return { success: true }
}

// ─── Instructor: bloquear fecha específica ──────────────────────────

export async function blockDateForInstructorAction(params: {
  blocked_date: string
  start_time: string
  end_time: string
  reason: string
}): Promise<{ success?: boolean; error?: string }> {
  const session = await getInstructorFromSession()
  if (!session) return { error: 'Sesión expirada.' }
  const { instructor, userEmail, userName } = session

  const { error, data: block } = await admin().from('instructor_availability_blocks').insert({
    instructor_id: instructor.id,
    blocked_date: params.blocked_date,
    start_time: params.start_time,
    end_time: params.end_time,
    reason: params.reason,
    created_by: userEmail,
    created_by_name: userName,
  } as never).select().single()

  if (error) return { error: error.message }

  await logAvailabilityAction({
    instructorId: instructor.id,
    action: 'blocked',
    changedBy: userEmail,
    changedByName: userName,
    blockedDate: params.blocked_date,
    blockStartTime: params.start_time,
    blockEndTime: params.end_time,
    blockReason: params.reason,
  })

  revalidatePath('/mi-cuenta')
  return { success: true, ...(block ? { blockId: (block as any).id } : {}) }
}

// ─── Instructor: desbloquear fecha específica ───────────────────────

export async function unblockDateForInstructorAction(
  blockId: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await getInstructorFromSession()
  if (!session) return { error: 'Sesión expirada.' }
  const { instructor, userEmail, userName } = session

  const { data: old } = await admin().from('instructor_availability_blocks').select('*').eq('id', blockId).single()
  if (!old) return { error: 'Bloqueo no encontrado.' }

  const { error } = await admin().from('instructor_availability_blocks').delete().eq('id', blockId).eq('instructor_id', instructor.id)
  if (error) return { error: error.message }

  await logAvailabilityAction({
    instructorId: instructor.id,
    action: 'unblocked',
    changedBy: userEmail,
    changedByName: userName,
    blockedDate: (old as any).blocked_date,
    blockStartTime: (old as any).start_time,
    blockEndTime: (old as any).end_time,
    blockReason: (old as any).reason,
    prevValues: old as Record<string, unknown>,
  })

  revalidatePath('/mi-cuenta')
  return { success: true }
}

// ─── Instructor: obtener bloqueos ───────────────────────────────────

export async function getInstructorBlocksAction(): Promise<any[]> {
  const session = await getInstructorFromSession()
  if (!session) return []
  const { data } = await admin().from('instructor_availability_blocks')
    .select('*')
    .eq('instructor_id', session.instructor.id)
    .order('blocked_date', { ascending: false })
    .limit(50)
  return data ?? []
}

// ─── Instructor: obtener historial de cambios ───────────────────────

export async function getInstructorAvailabilityLogAction(): Promise<any[]> {
  const session = await getInstructorFromSession()
  if (!session) return []
  const { data } = await admin().from('instructor_availability_log')
    .select('*')
    .eq('instructor_id', session.instructor.id)
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

// ─── Instructor: actualizar perfil (nombre, email, foto) ─────────────

export async function updateInstructorProfileAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  const name      = (formData.get('name')      as string)?.trim()
  const email     = (formData.get('email')     as string)?.trim()
  const avatarUrl = (formData.get('avatar_url') as string)?.trim() || undefined

  if (!name) return { error: 'El nombre es requerido.' }

  const adminClient = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instructor } = await (adminClient as any)
    .from('instructors')
    .select('id')
    .or(`email.eq.${user.email},id.eq.${user.id}`)
    .maybeSingle()

  if (!instructor) return { error: 'Instructor no encontrado.' }

  const updates: Record<string, string> = { name }
  if (email) updates.email = email

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updErr } = await (adminClient as any)
    .from('instructors')
    .update(updates)
    .eq('id', instructor.id)

  if (updErr) return { error: 'No se pudo actualizar el perfil.' }

  const metaUpdates: Record<string, string> = { full_name: name }
  if (avatarUrl) metaUpdates.avatar_url = avatarUrl

  await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, ...metaUpdates },
  })

  revalidatePath('/mi-cuenta')
  return { success: true }
}

// ─── Instructor: cancelar clase ──────────────────────────────────────

export async function cancelInstructorSessionAction(sessionId: string): Promise<{
  success?: boolean
  error?: string
  student?: { name: string; phone: string | null }
  session?: { date: string; time: string; course: string }
  lateCancellation?: boolean
}> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Sesión expirada.' }

  const adminClient = admin()

  const { data: instructor } = await adminClient
    .from('instructors')
    .select('id')
    .eq('email', user.email.trim())
    .maybeSingle()

  if (!instructor) return { error: 'Instructor no encontrado.' }

  const { data: session, error: fetchErr } = await adminClient
    .from('class_sessions')
    .select('*, student:students(name, phone), course:courses(name)')
    .eq('id', sessionId)
    .eq('instructor_id', instructor.id)
    .single()

  if (fetchErr || !session) return { error: 'Clase no encontrada.' }
  if (!['pending', 'confirmed'].includes(session.status)) return { error: 'La clase ya está cancelada o completada.' }

  // late_cancellation SIEMPRE false en cancelaciones por instructor —
  // el trigger fn_handle_late_cancellation solo descuenta crédito cuando
  // late_cancellation pasa de false→true; el estudiante nunca es penalizado
  // por una cancelación que no es su responsabilidad.
  const classDateTime = new Date(`${session.scheduled_date}T${session.start_time}`)
  const hoursUntil = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const isShortNotice = hoursUntil < 24  // solo para aviso visual en UI

  const { error: updateErr } = await adminClient
    .from('class_sessions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'instructor',
      late_cancellation: false,
      cancellation_reason: 'Cancelado por instructor',
    })
    .eq('id', sessionId)

  if (updateErr) return { error: updateErr.message }

  await safeRecordStudentActivity(
    session.student_id,
    'class_cancelled',
    `Clase cancelada por instructor${isShortNotice ? ' (menos de 24h de anticipación)' : ''}.`,
    { session_id: sessionId, scheduled_date: session.scheduled_date, start_time: session.start_time }
  )

  await activity.sessionCancelled({
    session_id:   sessionId,
    scheduled_at: `${session.scheduled_date} ${session.start_time}`,
    source:       'instructor-portal',
  })

  revalidatePath('/mi-cuenta')
  return {
    success: true,
    lateCancellation: false,
    student: { name: session.student?.name ?? 'Estudiante', phone: session.student?.phone ?? null },
    session: {
      date: session.scheduled_date,
      time: session.start_time?.slice(0, 5) ?? '',
      course: session.course?.name ?? 'Clase',
    },
  }
}
