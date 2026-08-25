import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// Catálogos de course/classroom/instructor cambian solo por acción admin
// explícita (crear/editar), no por reserva de clases — cachear 5 min evita
// repetir estas 3 queries en cada navegación de /admin/agenda y /admin/students/[id].

export const getCachedCourses = unstable_cache(
  async () => {
    const { data } = await createAdminClient().from('courses').select('id, name').eq('is_active', true)
    return data ?? []
  },
  ['catalog-courses'],
  { revalidate: 300, tags: ['catalog-courses'] },
)

export const getCachedClassrooms = unstable_cache(
  async () => {
    const { data } = await createAdminClient()
      .from('classrooms')
      .select('id, name, classroom_courses(course_id)')
      .eq('is_active', true)
    return data ?? []
  },
  ['catalog-classrooms'],
  { revalidate: 300, tags: ['catalog-classrooms'] },
)

export const getCachedInstructors = unstable_cache(
  async () => {
    const { data } = await createAdminClient().from('instructors').select('id, name').eq('status', 'active')
    return data ?? []
  },
  ['catalog-instructors'],
  { revalidate: 300, tags: ['catalog-instructors'] },
)
