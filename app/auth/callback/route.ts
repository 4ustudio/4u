import { createAuthServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/mi-cuenta'
  // Prevenir open redirect: solo permitir paths relativos internos
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/mi-cuenta'

  if (code) {
    const supabase = await createAuthServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/mi-cuenta/login?error=link_invalido`)
}
