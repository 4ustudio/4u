/**
 * Seed de disponibilidad de instructores + cursos faltantes
 *
 * 1. Agrega Piano y Producción Musical a la tabla courses
 * 2. Configura disponibilidad Lunes–Sábado 10:00–22:00 para cada instructor
 *
 * Uso: node scripts/seed-availability.mjs
 */

import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://sctfqgrsrzwpwhkfcbed.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdGZxZ3Jzcnp3cHdoa2ZjYmVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk3OTYzMCwiZXhwIjoyMDk1NTU1NjMwfQ.G3XEqA6wPcUMTsNf5UkZ2RHzq529KtRoV6V_lzc2bKw',
  { auth: { persistSession: false } }
)

// ── 1. Cursos faltantes ────────────────────────────────────────────────
async function seedCourses() {
  const missing = [
    { name: 'Piano',              slug: 'piano'              },
    { name: 'Producción Musical', slug: 'produccion-musical' },
  ]

  for (const course of missing) {
    const { data: existing } = await sb.from('courses').select('id').eq('slug', course.slug).maybeSingle()
    if (existing) {
      console.log(`  ↩  Curso ya existe: ${course.name}`)
      continue
    }
    const { error } = await sb.from('courses').insert({ ...course, is_active: true })
    if (error) console.error(`  ✗  ${course.name}:`, error.message)
    else       console.log(`  ✓  Curso agregado: ${course.name}`)
  }
}

// ── 2. Disponibilidad instructores ─────────────────────────────────────
// ISODOW: 1=Lunes … 6=Sábado
async function seedAvailability() {
  const { data: instructors } = await sb.from('instructors').select('id, name').eq('status', 'active')
  if (!instructors?.length) { console.log('  ✗  No hay instructores'); return }

  const DAYS  = [1, 2, 3, 4, 5, 6]   // Lunes–Sábado
  const START = '10:00:00'
  const END   = '22:00:00'

  for (const inst of instructors) {
    let added = 0
    for (const day of DAYS) {
      // Verificar si ya existe esa combinación
      const { data: existing } = await sb
        .from('instructor_availability')
        .select('id')
        .eq('instructor_id', inst.id)
        .eq('day_of_week', day)
        .maybeSingle()

      if (existing) continue

      const { error } = await sb.from('instructor_availability').insert({
        instructor_id: inst.id,
        day_of_week:   day,
        start_time:    START,
        end_time:      END,
      })
      if (error) console.error(`  ✗  ${inst.name} día ${day}:`, error.message)
      else added++
    }
    console.log(`  ✓  ${inst.name}: ${added > 0 ? `${added} días configurados` : 'ya tenía disponibilidad'}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log('═══ Seed: cursos + disponibilidad ═══\n')

  console.log('── Cursos ──')
  await seedCourses()

  console.log('\n── Disponibilidad instructores (L–S 10:00–22:00) ──')
  await seedAvailability()

  // Verificación final
  const { data: courses } = await sb.from('courses').select('name').eq('is_active', true).order('name')
  const { data: avail }   = await sb.from('instructor_availability').select('instructor_id')
  console.log(`\n✓ Cursos activos (${courses?.length}): ${courses?.map(c => c.name).join(', ')}`)
  console.log(`✓ Filas de disponibilidad: ${avail?.length}`)
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
