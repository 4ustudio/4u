import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Cliente con service_role — bypassa RLS completamente.
// Usar SOLO en Server Actions y Server Components del panel /admin.
// Nunca exponer al browser ni pasar a componentes cliente.

let _adminClient: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  if (_adminClient) return _adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }

  _adminClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return _adminClient
}
