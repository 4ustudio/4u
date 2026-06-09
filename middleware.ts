import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  parseRole,
  hasAdminAccess,
  hasAcademicAccess,
  canAccessSalesDashboard,
} from '@/lib/auth/roles'

// Rutas que requieren acceso académico (admin + owner únicamente)
const ACADEMIC_PATHS = [
  '/admin/students',
  '/admin/agenda',
  '/admin/instructors',
  '/admin/reactivacion',
]

// Rutas que requieren acceso comercial (owner + sales únicamente)
const SALES_PATHS = [
  '/admin/ventas',
  '/admin/leads',
  '/admin/enrollments',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo aplicar a rutas /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next({ request })
  }

  // Construir cliente Supabase con gestión de cookies del middleware
  let response = NextResponse.next({ request })

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
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión (necesario para mantener tokens válidos)
  const { data: { user } } = await supabase.auth.getUser()

  // Sin sesión → login
  if (!user) {
    const loginUrl = new URL('/mi-cuenta/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = parseRole(user.user_metadata)

  // Sin rol de staff → login
  if (!hasAdminAccess(role)) {
    return NextResponse.redirect(new URL('/mi-cuenta/login', request.url))
  }

  // Rutas académicas → solo admin / owner
  if (ACADEMIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (!hasAcademicAccess(role)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Rutas comerciales → solo owner / sales
  if (SALES_PATHS.some((p) => pathname.startsWith(p))) {
    if (!canAccessSalesDashboard(role)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Proteger /admin/* excluyendo assets estáticos
    '/admin/:path*',
  ],
}
