'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useCallback, useEffect, useRef } from 'react'
import { navLinks } from '@/data/navigation'

interface Props {
  userEmail?: string
  avatarUrl?: string | null
  firstName?: string | null
}

export default function StudentNav({ userEmail, avatarUrl, firstName }: Props) {
  const router = useRouter()
  const [open, setOpen]             = useState(false)
  const [avatarMenu, setAvatarMenu] = useState(false)
  const [hidden, setHidden]         = useState(false)
  const menuRef      = useRef<HTMLDivElement>(null)
  const toggleRef    = useRef<HTMLButtonElement>(null)
  const avatarRef    = useRef<HTMLDivElement>(null)
  const lastScrollY  = useRef(0)

  const initial = (firstName?.[0] ?? userEmail?.[0] ?? 'U').toUpperCase()

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      if (current < 60) { setHidden(false) }
      else { setHidden(current > lastScrollY.current) }
      lastScrollY.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cerrar el menú de avatar al hacer clic fuera
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
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (open) { setOpen(false); toggleRef.current?.focus() }
      if (avatarMenu) setAvatarMenu(false)
    }
  }, [open, avatarMenu])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/mi-cuenta/login')
    router.refresh()
  }

  return (
    <header
      className="fixed w-full top-0 z-50 bg-black/25 backdrop-blur-md border-b border-white/10 transition-transform duration-300 ease-in-out"
      style={{ transform: hidden ? 'translateY(-100%)' : 'translateY(0)' }}
    >
      <div className="home-frame h-[58px] flex items-center justify-between">
        {/* Logo + badge */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/images/icons/Recurso 1.png"
            alt="4U Studio"
            width={120}
            height={40}
            className="h-9 w-auto"
            priority
          />
          <span className="text-[11px] text-white/30 border-l border-white/10 pl-3 font-roboto hidden sm:block">
            Mi Cuenta
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-[13px] font-semibold text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50 rounded after:absolute after:-bottom-3 after:left-0 after:h-0.5 after:w-0 after:bg-[#ff7a00] after:transition-all hover:after:w-full"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Acciones — desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {userEmail ? (
            <div ref={avatarRef} className="relative">
              <button
                onClick={() => setAvatarMenu(v => !v)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors"
                aria-label="Menú de usuario"
              >
                {/* Avatar */}
                <div
                  className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-white text-xs font-bold border border-white/10"
                  style={{ backgroundColor: avatarUrl ? 'transparent' : '#ff7a00' }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                {/* Nombre */}
                {firstName && (
                  <span className="text-sm text-white/80 font-roboto max-w-[100px] truncate">
                    {firstName}
                  </span>
                )}
                {/* Chevron */}
                <svg
                  className={`h-3.5 w-3.5 text-white/40 transition-transform duration-200 ${avatarMenu ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown */}
              {avatarMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900/95 backdrop-blur border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-scale-in">
                  <div className="px-3 py-2.5 border-b border-white/10">
                    <p className="text-xs font-medium text-white/50 font-roboto truncate">{userEmail}</p>
                  </div>
                  <Link
                    href="/mi-cuenta"
                    onClick={() => setAvatarMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors font-roboto"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
                    </svg>
                    Mi cuenta
                  </Link>
                  <button
                    onClick={() => { setAvatarMenu(false); handleLogout() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-colors font-roboto"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/mi-cuenta/login"
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/30 rounded-xl px-4 py-2 font-roboto"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

        {/* Hamburger — móvil */}
        <button
          ref={toggleRef}
          className="lg:hidden flex flex-col gap-1.5 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50 rounded"
          onClick={() => setOpen(!open)}
          aria-label="Menú de navegación"
          aria-expanded={open}
        >
          <span className={`block w-6 h-0.5 bg-white transition-transform ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-transform ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Overlay móvil */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {/* Menú móvil */}
      {open && (
        <div ref={menuRef} className="relative z-50 lg:hidden border-t border-white/10 bg-black/60 backdrop-blur-xl">
          <div className="flex flex-col px-6 py-4 gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-white/70 hover:text-[#ff7a00] transition-colors py-2"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-3 mt-1 space-y-2">
              {userEmail ? (
                <>
                  {/* Avatar móvil */}
                  <div className="flex items-center gap-3 pb-2">
                    <div
                      className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-white text-sm font-bold border border-white/10"
                      style={{ backgroundColor: avatarUrl ? 'transparent' : '#ff7a00' }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="min-w-0">
                      {firstName && <p className="text-sm text-white font-medium font-roboto truncate">{firstName}</p>}
                      <p className="text-xs text-white/30 font-roboto truncate">{userEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setOpen(false); handleLogout() }}
                    className="w-full text-sm font-medium text-white/60 hover:text-white border border-white/15 rounded-xl py-2.5 font-roboto transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/mi-cuenta/login"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center text-sm font-medium text-white/60 hover:text-white border border-white/15 rounded-xl py-2.5 font-roboto transition-colors"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
