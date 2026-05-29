"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { navLinks } from "@/data/navigation";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
      toggleRef.current?.focus();
    }
  }, [open]);

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

  return (
    <header className="fixed w-full top-0 z-50 bg-black/25 backdrop-blur-md border-b border-white/10">
      <div className="home-frame h-[58px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-poppins leading-none">
          <div className="flex flex-col">
            <span className="text-[18px] font-extrabold tracking-tight text-white">
              <span className="text-[#ff7a00]">4U</span> STUDIO
            </span>
            <span className="text-[8px] uppercase tracking-[0.55em] text-white/65 pl-7">academy</span>
          </div>
          <span className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ff7a00] text-[#ff7a00]">
            <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M3 17h5l3-8 5 15 4-11 3 4h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-[13px] font-semibold text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded after:absolute after:-bottom-3 after:left-0 after:h-0.5 after:w-0 after:bg-[#ff7a00] after:transition-all hover:after:w-full"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            href="/agendar"
            size="sm"
            className="hidden lg:inline-flex px-5 py-2 text-[13px]"
          >
            Agendar Clase
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Button>

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

      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="navigation"
          aria-label="Navegación móvil"
          className="relative z-50 lg:hidden border-t border-white/10 bg-black/60 backdrop-blur-xl"
        >
          <div className="flex flex-col px-6 lg:px-8 py-4 gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-white/70 hover:text-[#ff7a00] transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50 rounded"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/agendar"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-full text-sm text-center justify-center mt-2"
              style={{ backgroundColor: "#ff7a00", fontFamily: "'Poppins', sans-serif" }}
            >
              Agendar Clase
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
