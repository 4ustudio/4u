'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

interface Props {
  userEmail?: string
  avatarUrl?: string | null
  firstName?: string | null
}

export default function StudentPortalHeader({ userEmail, avatarUrl, firstName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [avatarMenu, setAvatarMenu] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const initial = (firstName?.[0] ?? userEmail?.[0] ?? 'U').toUpperCase()

  useEffect(() => {
    if (!avatarMenu) return
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarMenu])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAvatarMenu(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/mi-cuenta/login')
    router.refresh()
  }

  const navItems = [
    { href: '/mi-cuenta', label: 'Dashboard' },
    { href: '/mi-cuenta/mis-clases', label: 'Mis Clases' },
  ]

  return (
    <header className="fixed w-full top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 h-[52px] flex items-center justify-between gap-4">
        <Link href="/mi-cuenta" className="flex items-center gap-2 shrink-0">
          <span className="text-base font-extrabold text-white font-poppins tracking-tight">4U</span>
          <span className="text-[10px] text-white/25 font-roboto hidden sm:block border-l border-white/10 pl-2">
            Mi Cuenta
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-roboto transition-colors ${
                pathname === item.href
                  ? 'text-white bg-white/10'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div ref={avatarRef} className="relative">
          <button
            onClick={() => setAvatarMenu(v => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors"
            aria-label="Menú de usuario"
          >
            <div
              className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-white text-[10px] font-bold border border-white/10"
              style={{ backgroundColor: avatarUrl ? 'transparent' : '#ff7a00' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
          </button>

          {avatarMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-scale-in">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="text-xs text-white/40 font-roboto truncate">{userEmail}</p>
              </div>
              <Link
                href="/mi-cuenta"
                onClick={() => setAvatarMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors font-roboto"
              >
                Mi cuenta
              </Link>
              <button
                onClick={() => { setAvatarMenu(false); handleLogout() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-colors font-roboto"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
