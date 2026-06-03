import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Producción Musical",
  description:
    "Construye tu carrera musical con 4U Studio Academy. Producción de álbum, grabación profesional, mezcla, masterización y proyección artística.",
};

// ─── Datos de las 4 cards ────────────────────────────────────
const INCLUDES = [
  {
    title: ["PRODUCCIÓN", "DE ÁLBUM:"],
    items: [
      "Planeación conceptual del disco",
      "Dirección artística del proyecto",
      "Producción musical comercial",
      "Producción de varias canciones",
      "Sonido competitivo a nivel profesional",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
        <circle cx="12" cy="12" r="2" />
        <path d="M9 18V5l10-2v13" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="16" r="2" />
      </svg>
    ),
  },
  {
    title: ["PRODUCCIÓN", "TÉCNICA:"],
    items: [
      "Grabación profesional completa",
      "Mezcla avanzada",
      "Masterización de álbum completo",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
  },
  {
    title: ["PRODUCTO", "FINAL:"],
    items: [
      "Disco listo para distribución",
      "Material para prensa y promoción",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    title: ["PROYECCIÓN", "ARTÍSTICA:"],
    items: [
      "Orientación de carrera",
      "Desarrollo de marca artística",
      "Preparación para conciertos y presentaciones",
      "Estrategia básica de posicionamiento",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <polyline points="4 16 6 14 8 16" />
        <polyline points="10 6 12 4 14 6" />
        <polyline points="16 12 18 10 20 12" />
      </svg>
    ),
  },
];

export default function ProduccionPage() {
  return (
    <PageLayout>
      {/* ─── HERO ──────────────────────────────────────── */}
      <section className="relative w-full min-h-[560px] lg:min-h-[620px] bg-black overflow-hidden flex items-stretch">
        {/* Imagen derecha */}
        <div className="absolute inset-0 lg:left-[48%]">
          <OptimizedImage
            src="/images/hero/banner-principal.jpg"
            alt="Estudio de producción musical 4U Studio Academy"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 52vw"
          />
          {/* Degradado izquierdo que cubre el texto (más suave/claro) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
          {/* Degradado base en móvil */}
          <div className="absolute inset-0 bg-black/35 lg:hidden" />
        </div>

        {/* Contenido izquierdo */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24 flex items-center">
          <Reveal className="max-w-[480px]">
            {/* Eyebrow */}
            <p className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.15em] mb-5 font-poppins">
              Plan 4 – Plan Artista Profesional
            </p>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6 font-poppins">
              Construyo<br />
              mi carrera<br />
              <span className="text-[#ff7a00]">musical</span>
            </h1>

            {/* Descripción */}
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 font-roboto max-w-sm">
              Para quien quiere hacer de la música su proyecto principal y producir un disco completo.
            </p>

            {/* CTA */}
            <Button href="/inscripcion" size="md">
              Inscríbete con nosotros
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ─── INCLUYE ───────────────────────────────────── */}
      <section className="bg-white py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Título */}
          <Reveal className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-2">
              <span className="h-px w-10 bg-[#ff7a00]" />
              <span className="h-1 w-1 rounded-full bg-[#ff7a00]" />
              <span className="h-px w-10 bg-[#ff7a00]" />
            </div>
            <h2 className="text-3xl font-black text-gray-950 uppercase tracking-wide font-poppins">
              Incluye:
            </h2>
          </Reveal>

          {/* Grid de 4 cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {INCLUDES.map((card, i) => (
              <Reveal
                key={i}
                delay={i * 120}
                className="border border-gray-200 rounded-xl p-6 flex flex-col items-center text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5"
              >
                {/* Línea naranja superior */}
                <div className="w-12 h-1 bg-[#ff7a00] rounded-full mb-5" />

                {/* Ícono */}
                <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#ff7a00]/20 bg-orange-50">
                  {card.icon}
                </div>

                {/* Título */}
                <h3 className="text-sm font-black uppercase text-gray-950 leading-tight mb-4 font-poppins">
                  {card.title.map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < card.title.length - 1 && <br />}
                    </span>
                  ))}
                </h3>

                {/* Lista */}
                <ul className="text-left w-full space-y-2 mb-5">
                  {card.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-700 font-roboto">
                      <span className="text-[#ff7a00] font-bold mt-0.5 shrink-0">›</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Línea naranja inferior */}
                <div className="w-full h-px bg-[#ff7a00]/20 mt-auto" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BANNER INFERIOR ───────────────────────────── */}
      <section className="relative w-full min-h-[420px] lg:min-h-[460px] bg-black overflow-hidden flex items-center">
        {/* Imagen de fondo completa con overlay oscuro */}
        <div className="absolute inset-0">
          <OptimizedImage
            src="/images/hero/Banner-2.jpg.jpeg"
            alt="Cantante en estudio 4U Studio Academy"
            fill
            className="object-cover object-[40%_25%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Contenido centrado / derecha */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <Reveal className="lg:ml-auto lg:max-w-lg text-center lg:text-left">
            {/* Título */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 font-poppins">
              Más que una<br />
              academia de música
            </h2>

            {/* Subtítulo */}
            <p className="max-w-[520px] text-white/75 text-base md:text-lg font-roboto mb-8 leading-relaxed">
              4U Studio es un espacio para aprender, crear y desarrollar<br className="hidden md:block" />
              tu talento artístico.
            </p>

            {/* CTA */}
            <Button href="/inscripcion" size="md">
              Inscríbete con nosotros
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Button>
          </Reveal>
        </div>
      </section>
    </PageLayout>
  );
}
