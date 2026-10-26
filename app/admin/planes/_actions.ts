'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { resolveRole, hasAdminAccess } from '@/lib/auth/roles'
import { planLabel, type PlanOption } from '@/lib/students/plans'

async function assertAdmin(): Promise<{ error: string } | null> {
  const { data: { user } } = await getAuthUser()
  if (!hasAdminAccess(resolveRole(user))) return { error: 'No autorizado.' }
  return null
}

export async function getPlans(includeInactive = false): Promise<PlanOption[]> {
  if (await assertAdmin()) return []
  let query = createAdminClient()
    .from('plans')
    .select('id, name, price, duration_months, description, active, sort_order')
    .order('sort_order')
    .order('name')
  if (!includeInactive) query = query.eq('active', true)
  const { data } = await query
  return (data ?? []).map(p => ({ ...p, label: planLabel(p) }))
}

export interface PlanInput {
  name: string
  price: number | null
  duration_months: number | null
  description: string | null
  active: boolean
  sort_order: number
}

function validate(input: PlanInput): string | null {
  if (!input.name.trim()) return 'El nombre es obligatorio.'
  if (input.price != null && (!Number.isInteger(input.price) || input.price < 0)) return 'Precio inválido.'
  if (input.duration_months != null && (!Number.isInteger(input.duration_months) || input.duration_months < 1)) return 'Duración inválida.'
  return null
}

export async function createPlan(input: PlanInput): Promise<{ error: string | null }> {
  if (await assertAdmin()) return { error: 'No autorizado.' }
  const invalid = validate(input)
  if (invalid) return { error: invalid }
  const { error } = await createAdminClient().from('plans').insert({ ...input, name: input.name.trim() })
  if (error) return { error: error.code === '23505' ? 'Ya existe un plan con ese nombre.' : error.message }
  revalidatePath('/admin/planes')
  return { error: null }
}

export async function updatePlan(id: string, input: PlanInput): Promise<{ error: string | null }> {
  if (await assertAdmin()) return { error: 'No autorizado.' }
  const invalid = validate(input)
  if (invalid) return { error: invalid }
  const admin = createAdminClient()
  const { data: current } = await admin.from('plans').select('name').eq('id', id).single()
  if (!current) return { error: 'Plan no encontrado.' }

  const name = input.name.trim()
  const { error } = await admin.from('plans').update({ ...input, name, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.code === '23505' ? 'Ya existe un plan con ese nombre.' : error.message }

  // students.plan_name guarda el nombre: al renombrar, mover a los alumnos al nuevo nombre.
  // payments.plan_name se deja igual (histórico del cobro).
  if (current.name !== name) {
    await admin.from('students').update({ plan_name: name }).eq('plan_name', current.name)
  }

  revalidatePath('/admin/planes')
  return { error: null }
}
