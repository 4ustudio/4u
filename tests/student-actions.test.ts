import { beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authUser: null as { id: string; email?: string } | null,
  tables: new Map<string, Array<{ data?: unknown; error?: { message: string } | null }>>(),
  rpcResults: new Map<string, Array<{ data?: unknown; error?: { message: string } | null }>>(),
  updates: [] as Array<{ table: string; values: Record<string, unknown> }>,
  revalidatePath: vi.fn(),
  activity: {
    attendanceConfirmed: vi.fn(),
    attendanceNoShow: vi.fn(),
    sessionCancelled: vi.fn(),
    sessionCreated: vi.fn(),
  },
  recordActivity: vi.fn(),
}))

function take<T>(source: Map<string, T[]>, key: string): T {
  const result = source.get(key)?.shift()
  if (!result) throw new Error(`No se configuró una respuesta para ${key}`)
  return result
}

function query(table: string, result: { data?: unknown; error?: { message: string } | null }) {
  let updateValues: Record<string, unknown> | null = null
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'ilike', 'gte', 'lt', 'lte', 'gte', 'order', 'limit', 'not', 'maybeSingle', 'single']
  for (const method of methods) chain[method] = () => chain
  chain.update = (values: Record<string, unknown>) => {
    updateValues = values
    return chain
  }
  chain.then = (resolve: (value: typeof result) => unknown) => {
    if (updateValues) mocks.updates.push({ table, values: updateValues })
    return Promise.resolve(result).then(resolve)
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createAuthServerClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: mocks.authUser } })) },
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => query(table, take(mocks.tables, table)),
    rpc: (name: string) => Promise.resolve(take(mocks.rpcResults, name)),
  })),
}))

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/app/admin/_actions/retention', () => ({ safeRecordStudentActivity: mocks.recordActivity }))
vi.mock('@/lib/activity', () => ({ activity: mocks.activity }))
vi.mock('@/lib/bold/client', () => ({ createBoldPaymentLink: vi.fn() }))

import {
  cancelInstructorSessionAction,
  instructorRegisterAttendanceAction,
  studentBookAction,
} from '@/app/(student)/_actions/student'

function addTable(table: string, ...results: Array<{ data?: unknown; error?: { message: string } | null }>) {
  mocks.tables.set(table, results)
}

function addRpc(name: string, ...results: Array<{ data?: unknown; error?: { message: string } | null }>) {
  mocks.rpcResults.set(name, results)
}

function attendanceForm(sessionId: string, attendance: string) {
  const form = new FormData()
  form.set('session_id', sessionId)
  form.set('attendance', attendance)
  return form
}

beforeEach(() => {
  mocks.authUser = { id: 'instructor-user', email: 'instructor@4ustudio.co' }
  mocks.tables.clear()
  mocks.rpcResults.clear()
  mocks.updates.length = 0
  vi.clearAllMocks()
})

describe('instructor: asistencia y cancelación', () => {
  test('registra asistencia únicamente en una clase propia y la completa', async () => {
    addTable('instructors', { data: { id: 'inst-1', name: 'Ana' } })
    addTable(
      'class_sessions',
      { data: { student_id: 'student-1', course_id: 'course-1', instructor_id: 'inst-1' } },
      { error: null },
    )

    const result = await instructorRegisterAttendanceAction({}, attendanceForm('session-1', 'attended'))

    expect(result).toEqual({ success: true })
    expect(mocks.updates).toEqual([{
      table: 'class_sessions',
      values: expect.objectContaining({ attendance_status: 'attended', status: 'completed' }),
    }])
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/mi-cuenta')
  })

  test('impide que un instructor registre asistencia de una clase ajena', async () => {
    addTable('instructors', { data: { id: 'inst-1', name: 'Ana' } })
    addTable('class_sessions', { data: { student_id: 'student-2', course_id: 'course-1', instructor_id: 'inst-2' } })

    const result = await instructorRegisterAttendanceAction({}, attendanceForm('session-ajena', 'attended'))

    expect(result).toEqual({ error: 'No autorizado.' })
    expect(mocks.updates).toEqual([])
  })

  test('cancela una clase confirmada sin descontar clases al alumno', async () => {
    addTable('instructors', { data: { id: 'inst-1' } })
    addTable(
      'class_sessions',
      { data: {
        id: 'session-1', student_id: 'student-1', status: 'confirmed', scheduled_date: '2030-08-26', start_time: '10:00:00',
        student: { name: 'Estudiante Prueba', phone: '3001234567' }, course: { name: 'Batería' },
      } },
      { error: null },
    )

    const result = await cancelInstructorSessionAction('session-1')

    expect(result).toMatchObject({ success: true, lateCancellation: false, student: { name: 'Estudiante Prueba' } })
    expect(mocks.updates).toEqual([{
      table: 'class_sessions',
      values: expect.objectContaining({ status: 'cancelled', cancelled_by: 'instructor', late_cancellation: false }),
    }])
  })

  test('no permite cancelar una clase que ya fue completada', async () => {
    addTable('instructors', { data: { id: 'inst-1' } })
    addTable('class_sessions', { data: { id: 'session-1', status: 'completed' } })

    const result = await cancelInstructorSessionAction('session-1')

    expect(result).toEqual({ error: 'La clase ya está cancelada o completada.' })
    expect(mocks.updates).toEqual([])
  })
})

describe('estudiante: agendar clase', () => {
  test('rechaza una reserva sin sesión de estudiante', async () => {
    mocks.authUser = null

    const result = await studentBookAction({ status: 'idle' }, new FormData())

    expect(result).toEqual({ status: 'error', message: 'Debes iniciar sesión para agendar una clase.' })
  })

  test('no reserva un horario que dejó de estar disponible', async () => {
    addTable('students', { data: { id: 'student-1', name: 'Estudiante Prueba' } })
    addTable('courses', { data: { id: 'course-1', name: 'Batería' } })
    addRpc('fn_available_slots', { data: [{ slot_time: '10:00:00', classroom_id: 'room-1', is_available: false }] })
    const form = new FormData()
    form.set('selected_date_iso', '2030-08-26')
    form.set('selected_time_24h', '10:00')
    form.set('course', 'Batería')

    const result = await studentBookAction({ status: 'idle' }, form)

    expect(result).toEqual(expect.objectContaining({ status: 'error', isRaceCondition: true }))
  })

  test('agenda un horario disponible con el instructor seleccionado', async () => {
    addTable('students', { data: { id: 'student-1', name: 'Estudiante Prueba' } })
    addTable('courses', { data: { id: 'course-1', name: 'Batería' } })
    addRpc(
      'fn_available_slots',
      { data: [{ slot_time: '10:00:00', classroom_id: 'room-1', is_available: true }] },
    )
    addRpc('fn_book_session', { data: { success: true, session_id: 'session-1' }, error: null })
    const form = new FormData()
    form.set('selected_date_iso', '2030-08-26')
    form.set('selected_time_24h', '10:00')
    form.set('course', 'Batería')
    form.set('selected_instructor_id', 'inst-1')

    const result = await studentBookAction({ status: 'idle' }, form)

    expect(result).toEqual({ status: 'success', submittedCourse: 'Batería' })
    expect(mocks.activity.sessionCreated).toHaveBeenCalledWith(expect.objectContaining({ session_id: 'session-1', source: 'portal' }))
  })
})
