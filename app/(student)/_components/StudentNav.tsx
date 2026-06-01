'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useCallback, useEffect, useRef } from 'react'
import { navLinks } from '@/data/navigation'

export default function StudentNav({ userEmail }: { userEmail?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) { setOpen(false); toggleRef.current?.focus() }
  }, [open])

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
    <header className="fixed w-full top-0 z-50 bg-black/25 backdrop-blur-md border-b border-white/10">
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
            <>
              <span className="text-xs text-white/40 font-roboto">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="text-[13px] font-medium text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/30 rounded-xl px-4 py-2 font-roboto"
              >
                Cerrar sesión
              </button>
            </>
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
                  <p className="text-xs text-white/30 font-roboto">{userEmail}</p>
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
