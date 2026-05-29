import { createClient } from '@supabase/supabase-js'

// Usado exclusivamente en Server Actions y Route Handlers.
// Nunca importar desde código de cliente ("use client").
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno de Supabase')
  }

  return createClient(url, key)
}
