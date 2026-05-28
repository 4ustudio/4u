"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { navLinks } from "@/data/navigation";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,122,0,0.3)] font-poppins">
          <span className="text-2xl font-bold text-white">4U</span>
          <span className="text-xl font-light text-[#ff7a00]">Studio</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/70 hover:text-[#ff7a00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            href="/contacto"
            size="sm"
            className="hidden lg:inline-flex"
          >
            Agendar Clase
          </Button>

          <button
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
          id="mobile-menu"
          role="navigation"
          aria-label="Navegación móvil"
          className="lg:hidden border-t border-white/10 bg-black/60 backdrop-blur-xl"
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
              href="/contacto"
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
