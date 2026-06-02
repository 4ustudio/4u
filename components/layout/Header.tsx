"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { navLinks } from "@/data/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { NavLink } from "@/types";

const linkClass =
  "relative text-[13px] font-semibold text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded after:absolute after:-bottom-3 after:left-0 after:h-0.5 after:w-0 after:bg-[#ff7a00] after:transition-all hover:after:w-full";

function NavDropdown({ link }: { link: NavLink }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link
        href={link.href}
        className={`${linkClass} flex items-center gap-1`}
        style={{ fontFamily: "'Roboto', sans-serif" }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {link.label}
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Link>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50">
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[220px]">
            {link.children!.map((child, i) => (
              <Link
                key={child.href}
                href={child.href}
                className={`flex flex-col px-5 py-3.5 hover:bg-white/[0.08] transition-colors group ${i > 0 ? "border-t border-white/5" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span className="text-sm font-semibold text-white group-hover:text-[#ff7a00] transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {child.label}
                </span>
                {child.description && (
                  <span className="text-xs text-white/40 mt-0.5" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    {child.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [open, setOpen]               = useState(false);
  const [planesOpen, setPlanesOpen]   = useState(false);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [userEmail, setUserEmail]     = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hidden, setHidden]           = useState(false);

  const menuRef     = useRef<HTMLDivElement>(null);
  const toggleRef   = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const supabaseRef = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    const supabase = supabaseRef.current;
    const checkAuth = (session: ReturnType<typeof Object.create> | null) => {
      const role = session?.user?.user_metadata?.role;
      setIsAdmin(!!session && role !== "student");
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email ?? null);
    };
    supabase.auth.getSession().then(({ data: { session } }) => checkAuth(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => checkAuth(session));
    return () => subscription.unsubscribe();
  }, []);

  // Auto-hide navbar on scroll
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      // Mostrar siempre en los primeros 60px (zona del hero)
      if (current < 60) {
        setHidden(false);
      } else {
        setHidden(current > lastScrollY.current);
      }
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar menú usuario al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (open) { setOpen(false); toggleRef.current?.focus(); }
      if (userMenuOpen) setUserMenuOpen(false);
    }
  }, [open, userMenuOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLElement>("a, button");
      first?.focus();
    }
  }, [open]);

  const closeMobile = () => { setOpen(false); setPlanesOpen(false); };

  const handleSignOut = async () => {
    await supabaseRef.current.auth.signOut();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserEmail(null);
    setUserMenuOpen(false);
    window.location.href = "/";
  };

  // Inicial del email para el avatar
  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : "U";
  const dashboardHref = isAdmin ? "/admin" : "/mi-cuenta";

  return (
    <header
      className="fixed w-full top-0 z-50 bg-black/25 backdrop-blur-md border-b border-white/10 transition-transform duration-300 ease-in-out"
      style={{ transform: hidden ? 'translateY(-100%)' : 'translateY(0)' }}
    >
      <div className="home-frame h-[58px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/images/icons/Recurso 1.png" alt="4U Studio" width={120} height={40} className="h-9 w-auto" priority />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) =>
            link.children ? (
              <NavDropdown key={link.href} link={link} />
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass}
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Acciones desktop */}
        <div className="flex items-center gap-3">

          {/* ── Botón / avatar de sesión (desktop) ── */}
          {!isLoggedIn ? (
            <Link
              href="/mi-cuenta/login"
              className="hidden lg:inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/70 hover:text-white border border-white/15 hover:border-white/30 rounded-full px-4 py-1.5 transition-all"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Iniciar sesión
            </Link>
          ) : (
            <div ref={userMenuRef} className="relative hidden lg:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-white/15 hover:border-[#ff7a00]/50 pl-1 pr-3 py-1 transition-all group"
                aria-label="Menú de usuario"
                aria-expanded={userMenuOpen}
              >
                {/* Avatar */}
                <span
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white font-poppins"
                  style={{ backgroundColor: "#ff7a00" }}
                >
                  {avatarLetter}
                </span>
                <span className="text-[12px] text-white/70 group-hover:text-white transition-colors font-roboto max-w-[120px] truncate">
                  {isAdmin ? "Admin" : userEmail?.split("@")[0]}
                </span>
                <svg
                  className={`h-3 w-3 text-white/40 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute top-full right-0 pt-2 z-50 w-48">
                  <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/5">
                      <p className="text-[10px] text-white/35 font-roboto truncate">{userEmail}</p>
                    </div>
                    <Link
                      href={dashboardHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.07] transition-colors text-sm text-white/80 hover:text-white"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      <svg className="h-4 w-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                      {isAdmin ? "Panel Admin" : "Mi Cuenta"}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.07] transition-colors text-sm text-white/50 hover:text-red-400 border-t border-white/5"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button href="/agendar" size="sm" className="hidden lg:inline-flex px-5 py-2 text-[13px]">
            Agendar Clase
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Button>

          {/* Hamburger */}
          <button
            ref={toggleRef}
            className="lg:hidden flex flex-col gap-1.5 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50 rounded"
            onClick={() => setOpen(!open)}
            aria-label="Menú de navegación"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <span aria-hidden="true" className={`block w-6 h-0.5 bg-white transition-transform ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span aria-hidden="true" className={`block w-6 h-0.5 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
            <span aria-hidden="true" className={`block w-6 h-0.5 bg-white transition-transform ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Overlay móvil */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* Menú móvil */}
      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="navigation"
          aria-label="Navegación móvil"
          className="relative z-50 lg:hidden border-t border-white/10 bg-black/70 backdrop-blur-xl"
        >
          <div className="flex flex-col px-6 py-4 gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.href}>
                  <button
                    onClick={() => setPlanesOpen(!planesOpen)}
                    className="w-full flex items-center justify-between text-sm font-medium text-white/70 hover:text-[#ff7a00] transition-colors py-2.5"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    {link.label}
                    <svg
                      className={`h-4 w-4 transition-transform ${planesOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {planesOpen && (
                    <div className="ml-4 mb-1 space-y-0.5 border-l border-white/10 pl-4">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={closeMobile}
                          className="flex flex-col py-2 text-white/60 hover:text-[#ff7a00] transition-colors"
                        >
                          <span className="text-sm font-semibold" style={{ fontFamily: "'Roboto', sans-serif" }}>{child.label}</span>
                          {child.description && <span className="text-xs text-white/30">{child.description}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className="text-sm font-medium text-white/70 hover:text-[#ff7a00] transition-colors py-2.5"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  {link.label}
                </Link>
              )
            )}

            <div className="pt-3 space-y-2">
              <Link
                href="/agendar"
                onClick={closeMobile}
                className="flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-full text-sm text-center justify-center"
                style={{ backgroundColor: "#ff7a00", fontFamily: "'Poppins', sans-serif" }}
              >
                Agendar Clase
              </Link>

              {/* Sesión en móvil */}
              {!isLoggedIn ? (
                <Link
                  href="/mi-cuenta/login"
                  onClick={closeMobile}
                  className="flex items-center justify-center gap-2 border border-white/15 text-white/70 font-semibold px-6 py-2.5 rounded-full text-sm"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Iniciar sesión
                </Link>
              ) : (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 border border-white/15 text-white/70 font-semibold px-6 py-2.5 rounded-full text-sm"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {isAdmin ? "Panel Admin" : "Mi Cuenta"}
                  </Link>
                  <button
                    onClick={() => { closeMobile(); handleSignOut(); }}
                    className="w-full flex items-center justify-center gap-2 text-white/40 text-sm py-2"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
