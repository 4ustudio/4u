/**
 * Seed de usuarios de prueba — 4U Studio Academy
 *
 * Crea:
 *   1. Usuario admin:    admin@4ustudio.com   / Admin4U2026!
 *   2. Usuario estudiante: test@4ustudio.com  / Test4U2026!
 *      → registro en tabla `students` vinculado al auth user
 *      → cuota mensual de 8 clases para el mes actual
 *
 * Uso:  node scripts/seed-test-users.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://sctfqgrsrzwpwhkfcbed.supabase.co'
const SERVICE_ROLE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdGZxZ3Jzcnp3cHdoa2ZjYmVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk3OTYzMCwiZXhwIjoyMDk1NTU1NjMwfQ.G3XEqA6wPcUMTsNf5UkZ2RHzq529KtRoV6V_lzc2bKw'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const now   = new Date()
const YEAR  = now.getFullYear()
const MONTH = now.getMonth() + 1

// ─────────────────────────────────────────────────────────────────────
async function upsertAuthUser(email, password, metadata = {}) {
  // Buscar si ya existe
  const { data: list } = await supabase.auth.admin.listUsers()
  const existing = list?.users?.find(u => u.email === email)

  if (existing) {
    console.log(`  ↩  Auth user ya existe: ${email} (${existing.id})`)
    // Actualizar contraseña y metadata por si cambió
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: metadata,
      email_confirm: true,
    })
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (error) throw new Error(`createUser(${email}): ${error.message}`)
  console.log(`  ✓  Auth user creado: ${email} (${data.user.id})`)
  return data.user.id
}

// ─────────────────────────────────────────────────────────────────────
async function upsertStudent(userId, email) {
  // Ver si ya existe un estudiante con este user_id
  const { data: existing } = await supabase
    .from('students')
    .select('id, name')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    console.log(`  ↩  Estudiante ya existe: ${existing.name} (${existing.id})`)
    return existing.id
  }

  // Ver si existe por email (sin user_id aún)
  const { data: byEmail } = await supabase
    .from('students')
    .select('id, name')
    .eq('email', email)
    .maybeSingle()

  if (byEmail) {
    // Vincular user_id
    await supabase.from('students').update({ user_id: userId }).eq('id', byEmail.id)
    console.log(`  ↩  Estudiante vinculado: ${byEmail.name} (${byEmail.id})`)
    return byEmail.id
  }

  const { data, error } = await supabase
    .from('students')
    .insert({
      name:         'Estudiante Prueba',
      first_name:   'Estudiante',
      last_name:    'Prueba',
      email,
      phone:        '3001234567',
      status:       'active',
      student_type: 'regular',
      user_id:      userId,
    })
    .select('id')
    .single()

  if (error) throw new Error(`insert student: ${error.message}`)
  console.log(`  ✓  Estudiante creado: Estudiante Prueba (${data.id})`)
  return data.id
}

// ─────────────────────────────────────────────────────────────────────
async function upsertMonthlyQuota(studentId) {
  const { data: existing } = await supabase
    .from('monthly_quotas')
    .select('id, quota_total')
    .eq('student_id', studentId)
    .eq('period_year', YEAR)
    .eq('period_month', MONTH)
    .maybeSingle()

  if (existing) {
    console.log(`  ↩  Cuota ya existe: ${YEAR}-${String(MONTH).padStart(2,'0')} → ${existing.quota_total} clases`)
    return
  }

  const { error } = await supabase.from('monthly_quotas').insert({
    student_id:   studentId,
    period_year:  YEAR,
    period_month: MONTH,
    quota_total:  8,
  })

  if (error) throw new Error(`insert monthly_quota: ${error.message}`)
  console.log(`  ✓  Cuota creada: ${YEAR}-${String(MONTH).padStart(2,'0')} → 8 clases`)
}

// ─────────────────────────────────────────────────────────────────────
async function printSummary() {
  const { data: courses    } = await supabase.from('courses').select('name').eq('is_active', true)
  const { data: classrooms } = await supabase.from('classrooms').select('name').eq('is_active', true)
  const { data: instructors} = await supabase.from('instructors').select('name').eq('status', 'active')

  console.log('\n── Catálogos disponibles ───────────────────────────')
  console.log('  Cursos:     ', courses?.map(c => c.name).join(', ') || 'ninguno')
  console.log('  Salones:    ', classrooms?.map(c => c.name).join(', ') || 'ninguno')
  console.log('  Instructores:', instructors?.map(i => i.name).join(', ') || 'ninguno')
}

// ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══ Seed de usuarios de prueba — 4U Studio Academy ═══\n')

  try {
    // 1. Admin
    console.log('── Admin ──')
    await upsertAuthUser('admin@4ustudio.com', 'Admin4U2026!', { role: 'admin' })

    // 2. Estudiante
    console.log('\n── Estudiante ──')
    const studentUserId = await upsertAuthUser('test@4ustudio.com', 'Test4U2026!', { role: 'student' })
    const studentId     = await upsertStudent(studentUserId, 'test@4ustudio.com')
    await upsertMonthlyQuota(studentId)

    // 3. Resumen de catálogos
    await printSummary()

    console.log('\n═══ Listo ═══')
    console.log('\nCredenciales:')
    console.log('  Admin:      admin@4ustudio.com   /  Admin4U2026!')
    console.log('  Estudiante: test@4ustudio.com    /  Test4U2026!')
    console.log('\nURLs:')
    console.log('  Portal estudiante: /mi-cuenta/login')
    console.log('  Panel admin:       /admin/login')

  } catch (err) {
    console.error('\n✗ Error:', err.message)
    process.exit(1)
  }
}

main()
