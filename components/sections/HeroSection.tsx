'use client'

import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import AudioExperience from "@/components/ui/AudioExperience";

const SLIDES: Array<{ src: string; type: 'image' | 'video'; poster?: string }> = [
  {
    src: "/images/hero/magnific_anima-esta-imagen-sin-hac_SOf98hOUb8.mp4",
    type: 'video',
  },
  {
    src: "/images/hero/magnific_anima-esta-imagen_5xefFSwKxe.mp4",
    type: 'video',
  },
];

// ─── Card de identidad ───────────────────────────────────────────────
const identityCard = (
  <div className="grid grid-cols-2 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/15 bg-black/45 shadow-2xl backdrop-blur-md">

    <div className="px-5 py-4">
      <svg className="mb-2.5 h-5 w-5 text-[#ff7a00]" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="9" cy="7" r="3"/>
        <path d="M3 20v-1a6 6 0 0 1 6-6h.5"/>
        <path d="M16 11v6M19 11v6"/>
        <path d="M14 14h6"/>
      </svg>
      <p className="text-white font-bold text-[13px] font-poppins leading-tight">Desde los 6 años</p>
      <p className="text-white/55 text-[10px] font-roboto mt-1 leading-snug">Niños · Jóvenes · Adultos</p>
    </div>

    <div className="px-5 py-4">
      <svg className="mb-2.5 h-5 w-5 text-[#ff7a00]" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
      </svg>
      <p className="text-white font-bold text-[13px] font-poppins leading-tight">Academia + Estudio</p>
      <p className="text-white/55 text-[10px] font-roboto mt-1 leading-snug">Aprende y crea música real</p>
    </div>

  </div>
);

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Rotación automática
  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  // Solo el slide activo reproduce video — ahorra recursos y evita conflictos
  useEffect(() => {
    SLIDES.forEach((_, i) => {
      const v = videoRefs.current[i];
      if (!v) return;
      if (i === current) {
        v.currentTime = 0;
        v.play().catch(() => {
          // Algunos browsers bloquean autoplay incluso con muted — fallback silencioso
        });
      } else {
        v.pause();
      }
    });
  }, [current]);

  return (
    <section className="hero-home relative w-full overflow-hidden bg-black">

      {/* ── Slides ──────────────────────────────────────────────────── */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {slide.type === 'video' ? (
            <video
              ref={el => { videoRefs.current[i] = el }}
              muted
              loop
              playsInline
              preload={i === 0 ? 'auto' : 'metadata'}
              className="absolute inset-0 h-full w-full object-cover object-[60%_50%]"
              // NO usamos src directo — usamos <source> con type explícito
              // para que todos los navegadores reconozcan el MIME type correcto
            >
              <source src={slide.src} type="video/mp4" />
              {/* Fallback para navegadores muy antiguos */}
              Tu navegador no soporta video HTML5.
            </video>
          ) : (
            <OptimizedImage
              src={slide.src}
              alt="4U Studio Academy — estudio de música profesional"
              fill
              priority={i === 0}
              className="object-cover object-[60%_50%]"
              sizes="100vw"
            />
          )}
        </div>
      ))}

      {/* Gradientes */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/45 to-black/15"/>
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/30"/>

      {/* ── Dots de navegación ──────────────────────────────────────── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-[#ff7a00]" : "w-1.5 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      {/* ── Contenido ───────────────────────────────────────────────── */}
      <div className="home-frame relative z-10">
        <div className="hero-home-inner relative">

          <div className="hero-copy w-full">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80 font-poppins backdrop-blur-md animate-fade-in-up">
              <span className="text-[#ff7a00]">♫</span> LA MÚSICA TE TRANSFORMA
            </p>

            <h1 className="hero-heading mb-4 font-extrabold text-white font-poppins animate-fade-in-up anim-d2">
              Cumple tus{" "}
              <span className="text-[#ff7a00]">sueños</span>{" "}
              <span className="text-[#ff7a00]">musicales</span>
            </h1>

            <p className="text-base md:text-lg text-white/80 max-w-[470px] mb-7 leading-snug font-roboto animate-fade-in-up anim-d4">
              Aprende, crea y conecta con tu pasión.<br/>
              Lecciones para niños, adolescentes<br/>
              y adultos de todos los niveles.
            </p>

            <div className="flex lg:hidden mb-6 animate-fade-in-up anim-d5">
              {identityCard}
            </div>

            <div className="flex flex-wrap items-center gap-4 animate-fade-in-up anim-d6">
              <Button href="/planes" size="md" className="px-7 py-3.5">
                Ver Lecciones
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              {/* Badge de audio — aparece solo mientras reproduce */}
              <AudioExperience/>
            </div>
          </div>

          <div className="hero-stats hidden lg:block animate-scale-in anim-d5">
            {identityCard}
          </div>

        </div>
      </div>
    </section>
  );
}
