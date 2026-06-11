'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { activity } from '@/lib/activity'
import type { ActivityAction } from '@/lib/activity'
import type { WhatsAppTemplate } from '@/lib/whatsapp'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

async function getActorInfo() {
  try {
    const supabase = await createAuthServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return {
      actor_user_id: user.id,
      actor_name:    (user.user_metadata?.name as string) ?? user.email ?? 'Admin',
      actor_role:    (user.user_metadata?.role as string) ?? 'admin',
    }
  } catch { return null }
}

// ── Log de evento WhatsApp ─────────────────────────────────────────

export async function logWhatsAppOpened(params: {
  entity_type:  'student' | 'lead' | 'payment' | 'retention'
  entity_id:    string
  contact_name: string
  template:     WhatsAppTemplate
  action?:      ActivityAction
}): Promise<void> {
  try {
    const actor = await getActorInfo()
    await activity.whatsappOpened({
      entity_type:   params.entity_type,
      entity_id:     params.entity_id,
      contact_name:  params.contact_name,
      template:      params.template,
      action:        params.action,
      actor_name:    actor?.actor_name,
      actor_user_id: actor?.actor_user_id,
      actor_role:    actor?.actor_role,
      source:        'admin',
    })
  } catch {
    // fire-and-forget: no bloqueamos el flujo si falla el log
  }
}

// ── Lookup de teléfono para ActivityClient ─────────────────────────

export async function getContactPhoneForActivity(
  entity_type: string,
  entity_id: string
): Promise<{ name: string; phone: string } | null> {
  try {
    if (entity_type === 'student' || entity_type === 'retention') {
      const { data } = await db()
        .from('students')
        .select('name, phone')
        .eq('id', entity_id)
        .single()
      if (data?.phone) return { name: data.name, phone: data.phone }
    }

    if (entity_type === 'lead' || entity_type === 'enrollment') {
      const { data } = await db()
        .from('enrollments')
        .select('student_name, phone')
        .eq('id', entity_id)
        .single()
      if (data?.phone) return { name: data.student_name, phone: data.phone }
    }

    if (entity_type === 'payment') {
      const { data } = await db()
        .from('payments')
        .select('student_id, students(name, phone)')
        .eq('id', entity_id)
        .single()
      const s = (data?.students as any)
      if (s?.phone) return { name: s.name, phone: s.phone }
    }

    return null
  } catch { return null }
}
