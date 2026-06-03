'use client'

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import AudioExperience from "@/components/ui/AudioExperience";

const SLIDES: Array<{ src: string; type: 'image' | 'video' }> = [
  { src: "/images/hero/magnific_anima-esta-imagen-sin-hac_SOf98hOUb8.mp4", type: 'video' },
  { src: "/images/hero/magnific_anima-esta-imagen_5xefFSwKxe.mp4", type: 'video' },
];

const stats = [
  {
    number: "+1,200",
    label: "Estudiantes",
    icon: (
      <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Zm-6 7v4.5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5V10" />
    ),
  },
  {
    number: "+25",
    label: "Cursos",
    icon: (
      <path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-2-2.83M19 16a3 3 0 1 1-2-2.83" />
    ),
  },
];

const statsRow = (
  <div className="grid grid-cols-2 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/15 bg-black/45 shadow-2xl backdrop-blur-md">
    {stats.map((stat) => (
      <div key={stat.label} className="min-w-[92px] px-5 py-3.5 text-center">
        <svg className="mx-auto mb-2 h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {stat.icon}
        </svg>
        <p className="text-[#ff7a00] font-bold text-base font-poppins">{stat.number}</p>
        <p className="text-white/70 text-[10px] font-roboto">{stat.label}</p>
      </div>
    ))}
  </div>
);

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero-home relative w-full overflow-hidden bg-black">
      {/* Carousel de imágenes/video */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {slide.type === 'video' ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover object-[60%_50%]"
              src={slide.src}
            />
          ) : (
            <OptimizedImage
              src={slide.src}
              alt="4uStudio Academy — estudio de música profesional"
              fill
              priority={i === 0}
              className="object-cover object-[60%_50%]"
              sizes="100vw"
            />
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/45 to-black/15" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/30" />

      {/* Dots de navegación */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-[#ff7a00]" : "w-1.5 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

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
              Aprende, crea y conecta con tu pasión.<br />
              Cursos para niños, adolescentes<br />
              y adultos de todos los niveles.
            </p>

            <div className="flex lg:hidden mb-6 animate-fade-in-up anim-d5">
              {statsRow}
            </div>

            <div className="flex flex-wrap items-center gap-4 animate-fade-in-up anim-d6">
              <Button href="/planes" size="md" className="px-7 py-3.5">
                Ver Cursos
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
              <AudioExperience />
            </div>
          </div>

          <div className="hero-stats hidden lg:block animate-scale-in anim-d5">
            {statsRow}
          </div>
        </div>
      </div>
    </section>
  );
}
