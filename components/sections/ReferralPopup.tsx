"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { ACADEMY } from "@/lib/constants";

const REFERRAL_WA_MESSAGE =
  "Hola, quiero referir a un amigo y recibir informacion del plan de referidos de 4U Studio Academy.";

export default function ReferralPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openTimer = window.setTimeout(() => setIsOpen(true), 180);
    return () => window.clearTimeout(openTimer);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const referralLink = `https://api.whatsapp.com/send/?phone=${ACADEMY.phone}&text=${encodeURIComponent(
    REFERRAL_WA_MESSAGE
  )}`;

  return (
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-md sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-referidos-title"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative grid max-h-[calc(100vh-32px)] w-full max-w-[1100px] overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/10 bg-[#050505] shadow-[0_30px_120px_rgba(0,0,0,0.65)] animate-scale-in lg:max-h-[min(92vh,760px)] lg:grid-cols-[0.94fr_1.06fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar popup"
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/80 transition hover:border-white/30 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="relative min-h-[240px] sm:min-h-[280px] lg:min-h-[690px]">
          <OptimizedImage
            src="/images/offers/popup-referidos.png"
            alt="Estudiantes de 4U Studio Academy tocando y cantando en estudio"
            fill
            priority
            quality={100}
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/18 lg:hidden" />
        </div>

        <div className="relative flex flex-col justify-center bg-[radial-gradient(circle_at_bottom_right,rgba(255,122,0,0.18),transparent_30%),linear-gradient(180deg,#0b0b0b_0%,#050505_100%)] px-5 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8 lg:px-10 lg:py-10">
          <div className="mb-3 inline-flex items-center gap-2 text-[#ff7a00] sm:mb-4">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.96 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
            </svg>
            <span className="font-poppins text-[15px] font-semibold sm:text-base">
              Plan de referidos
            </span>
          </div>

          <h2
            id="popup-referidos-title"
            className="max-w-[13ch] font-poppins text-[2rem] font-extrabold leading-[0.94] text-white sm:text-[3rem] lg:text-[4.45rem]"
          >
            10% para el <span className="text-[#ff7a00]">próximo mes</span>
          </h2>

          <p className="mt-4 font-poppins text-[1.05rem] font-semibold text-white/92 sm:mt-5 sm:text-[1.45rem]">
            Comparte el talento. Comparte la experiencia.
          </p>
          <div className="mt-3 h-[2px] w-16 rounded-full bg-[#ff7a00] sm:mt-4" />

          <p className="mt-4 max-w-[46ch] text-[0.95rem] leading-7 text-white/76 sm:mt-5 sm:text-[1.05rem]">
            Por cada amigo que se inscriba gracias a ti, recibe un 10% de descuento.
          </p>

          <ul className="mt-5 space-y-3 text-[0.95rem] text-white/82 sm:mt-6 sm:space-y-4 sm:text-base">
            {[
              "10% de descuento por cada referido efectivo",
              "Sin sorteos ni acumulación de puntos",
              "Tu descuento aplica en tu siguiente mensualidad",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#ff7a00]/60 text-[#ff7a00]">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path
                      d="m5 13 4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:mt-10 sm:max-w-[360px]">
            <Link
              href={referralLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#ff7a00] px-6 py-3.5 text-center font-poppins text-base font-bold text-white shadow-[0_16px_45px_rgba(255,122,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff8b26] sm:py-4 sm:text-lg"
            >
              Quiero referir
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="M5 12h14m-6-6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <Link
              href="/contacto"
              className="text-center font-roboto text-sm text-white/72 underline underline-offset-4 transition hover:text-white"
            >
              Más información
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
