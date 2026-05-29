import { createClient } from '@supabase/supabase-js'

// Singleton para uso en el browser (real-time, futura fase admin).
let _client: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  _client = createClient(url, key)
  return _client
}
