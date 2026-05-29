import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión — no usar getSession() aquí (no es seguro en middleware)
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Rutas /admin ──────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login'

    if (!user && !isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    if (user && isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  // ── Rutas /mi-cuenta (dashboard — excluye login y recuperar) ──────
  if (pathname === '/mi-cuenta') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/mi-cuenta/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirigir al dashboard si ya tiene sesión y entra al login del portal
  if (pathname === '/mi-cuenta/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/mi-cuenta'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/mi-cuenta', '/mi-cuenta/login'],
}
