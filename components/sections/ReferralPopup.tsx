"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { createBrowserClient } from "@supabase/ssr";
import { ACADEMY } from "@/lib/constants";

const REFERRAL_WA_MESSAGE =
  "Hola, quiero referir a un amigo y recibir informacion del plan de referidos de 4U Studio Academy.";

const AGENDAMIENTO_WA_MESSAGE =
  "Hola, quiero agendar una clase de prueba en 4U Studio Academy.";

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Cerrar popup"
      onClick={onClick}
      className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 transition hover:bg-black/80 hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function AgendamientoPopup({ onClose, ctaLink }: { onClose: () => void; ctaLink: string }) {
  return (
    <div
      className="relative grid w-full max-w-[780px] overflow-hidden rounded-2xl border border-white/10 bg-[#050505] shadow-[0_20px_80px_rgba(0,0,0,0.7)] animate-scale-in sm:grid-cols-[1fr_1fr]"
      style={{ maxHeight: "min(90vh, 520px)" }}
    >
      <CloseButton onClick={onClose} />

      <div className="relative min-h-[200px] sm:min-h-0">
        <OptimizedImage
          src="/images/offers/popup-agendamiento.png"
          alt="Programa tu primera sesión - 4U Studio Academy"
          fill
          priority
          quality={95}
          sizes="(max-width: 640px) 100vw, 390px"
          className="object-cover object-center"
        />
      </div>

      <div className="flex flex-col justify-center bg-[radial-gradient(circle_at_bottom_right,rgba(255,122,0,0.18),transparent_30%),linear-gradient(180deg,#0b0b0b_0%,#050505_100%)] px-5 py-6 sm:px-7 sm:py-7">
        <div className="mb-2 inline-flex items-center gap-2 text-[#ff7a00]">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 16H5V9h14v11ZM7 11h5v5H7z" />
          </svg>
          <span className="font-poppins text-sm font-semibold">Primera sesión</span>
        </div>

        <h2 className="font-poppins text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          Programa tu <span className="text-[#ff7a00]">primera clase</span> con nosotros
        </h2>

        <p className="mt-2 font-poppins text-sm font-semibold text-white/90 sm:text-base">
          Descubre tu potencial musical.
        </p>
        <div className="mt-2 h-[2px] w-12 rounded-full bg-[#ff7a00]" />

        <p className="mt-3 text-sm leading-6 text-white/75">
          Agenda una clase de prueba y vive la experiencia 4U Studio Academy{" "}
          <span className="text-[#ff7a00] font-semibold">sin compromisos</span>.
        </p>

        <ul className="mt-3 space-y-2 text-sm text-white/80">
          {[
            "Clase personalizada con un instructor profesional",
            "Todos los niveles y edades bienvenidos",
            "Elige el instrumento o área que quieras",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#ff7a00]/60 text-[#ff7a00]">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                  <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-5 py-3 text-center font-poppins text-sm font-bold text-white shadow-[0_8px_30px_rgba(255,122,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff8b26]"
          >
            Agendar clase de prueba
          </Link>
          <Link
            href="/inscripcion"
            onClick={onClose}
            className="text-center text-xs text-white/60 underline underline-offset-4 transition hover:text-white"
          >
            Ver planes e inscripción
          </Link>
        </div>
      </div>
    </div>
  );
}

function ReferidosPopup({ onClose, ctaLink }: { onClose: () => void; ctaLink: string }) {
  return (
    <div
      className="relative grid w-full max-w-[780px] overflow-hidden rounded-2xl border border-white/10 bg-[#050505] shadow-[0_20px_80px_rgba(0,0,0,0.7)] animate-scale-in sm:grid-cols-[1fr_1fr]"
      style={{ maxHeight: "min(90vh, 520px)" }}
    >
      <CloseButton onClick={onClose} />

      <div className="relative min-h-[200px] sm:min-h-0">
        <OptimizedImage
          src="/images/offers/popupreferidos.jpeg"
          alt="Estudiantes de 4U Studio Academy tocando y cantando en estudio"
          fill
          priority
          quality={95}
          sizes="(max-width: 640px) 100vw, 390px"
          className="object-cover object-center"
        />
      </div>

      <div className="flex flex-col justify-center bg-[radial-gradient(circle_at_bottom_right,rgba(255,122,0,0.18),transparent_30%),linear-gradient(180deg,#0b0b0b_0%,#050505_100%)] px-5 py-6 sm:px-7 sm:py-7">
        <div className="mb-2 inline-flex items-center gap-2 text-[#ff7a00]">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.96 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
          </svg>
          <span className="font-poppins text-sm font-semibold">Plan de referidos</span>
        </div>

        <h2 className="font-poppins text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          10% para el <span className="text-[#ff7a00]">próximo mes</span>
        </h2>

        <p className="mt-2 font-poppins text-sm font-semibold text-white/90 sm:text-base">
          Comparte el talento. Comparte la experiencia.
        </p>
        <div className="mt-2 h-[2px] w-12 rounded-full bg-[#ff7a00]" />

        <p className="mt-3 text-sm leading-6 text-white/75">
          Por cada amigo que se inscriba gracias a ti, recibe un{" "}
          <span className="text-[#ff7a00] font-semibold">10% de descuento</span>.
        </p>

        <ul className="mt-3 space-y-2 text-sm text-white/80">
          {[
            "10% de descuento por cada referido efectivo",
            "Sin sorteos ni acumulación de puntos",
            "Tu descuento aplica en tu siguiente mensualidad",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#ff7a00]/60 text-[#ff7a00]">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                  <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-5 py-3 text-center font-poppins text-sm font-bold text-white shadow-[0_8px_30px_rgba(255,122,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff8b26]"
          >
            Quiero referir
          </Link>
          <Link
            href="/contacto"
            onClick={onClose}
            className="text-center text-xs text-white/60 underline underline-offset-4 transition hover:text-white"
          >
            Más información
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReferralPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  useEffect(() => {
    if (isLoggedIn === null) return;
    const timer = window.setTimeout(() => setIsOpen(true), 180);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isOpen) { document.body.style.overflow = ""; return; }
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKeyDown); };
  }, [isOpen]);

  if (!isOpen || isLoggedIn === null) return null;

  const ctaLink = isLoggedIn
    ? `https://api.whatsapp.com/send/?phone=${ACADEMY.phone}&text=${encodeURIComponent(REFERRAL_WA_MESSAGE)}`
    : `https://api.whatsapp.com/send/?phone=${ACADEMY.phone}&text=${encodeURIComponent(AGENDAMIENTO_WA_MESSAGE)}`;

  return (
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={() => setIsOpen(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {isLoggedIn ? (
          <ReferidosPopup onClose={() => setIsOpen(false)} ctaLink={ctaLink} />
        ) : (
          <AgendamientoPopup onClose={() => setIsOpen(false)} ctaLink={ctaLink} />
        )}
      </div>
    </div>
  );
}
