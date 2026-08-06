import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { parseRole, hasAdminAccess, hasAcademicAccess, canAccessSalesDashboard } from '@/lib/auth/roles'

const ACADEMIC_PATHS = ['/admin/students', '/admin/agenda', '/admin/instructors', '/admin/reactivacion', '/admin/enrollments']
const SALES_PATHS    = ['/admin/ventas', '/admin/leads']

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_HOST = SUPABASE_URL ? new URL(SUPABASE_URL).host : ''

function buildCsp(nonce: string) {
  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: ${SUPABASE_HOST ? `https://${SUPABASE_HOST}` : ''};
    connect-src 'self' ${SUPABASE_HOST ? `https://${SUPABASE_HOST} wss://${SUPABASE_HOST}` : ''};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()
}

function withSecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
  withSecurityHeaders(supabaseResponse, csp)

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
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          withSecurityHeaders(supabaseResponse, csp)
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
  const role = parseRole(user?.user_metadata ?? null)

  // ── Ruta /agendar ─────────────────────────────────────────────────
  if (pathname === '/agendar') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/mi-cuenta/login'
      url.searchParams.set('next', '/agendar')
      return withSecurityHeaders(NextResponse.redirect(url), csp)
    }
  }

  // ── Rutas /admin ──────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/mi-cuenta/login'
      return withSecurityHeaders(NextResponse.redirect(url), csp)
    }
    if (!hasAdminAccess(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/mi-cuenta'
      return withSecurityHeaders(NextResponse.redirect(url), csp)
    }

    if (ACADEMIC_PATHS.some((p) => pathname.startsWith(p)) && !hasAcademicAccess(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return withSecurityHeaders(NextResponse.redirect(url), csp)
    }

    if (SALES_PATHS.some((p) => pathname.startsWith(p)) && !canAccessSalesDashboard(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return withSecurityHeaders(NextResponse.redirect(url), csp)
    }
  }

  // ── Rutas /mi-cuenta (dashboard — excluye login y recuperar) ──────
  if (pathname === '/mi-cuenta') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/mi-cuenta/login'
      return withSecurityHeaders(NextResponse.redirect(url), csp)
    }
  }

  // /agendar es pública: logueados usan el flujo real, no logueados usan WhatsApp

  // Redirigir al dashboard si ya tiene sesión y entra al login del portal
  if (pathname === '/mi-cuenta/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/mi-cuenta'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|audio|videos).*)'],
}
