"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { instructors } from "@/data/instructors";

const ALL_FILTERS = [
  "Todos",
  "Producción Musical",
  "Guitarra",
  "Batería",
  "Piano",
  "Canto",
  "Composición",
] as const;

type Filter = (typeof ALL_FILTERS)[number];

export default function TeamSection() {
  const [active, setActive] = useState<Filter>("Todos");
  const [selected, setSelected] = useState<(typeof instructors)[0] | null>(null);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  const filtered = useMemo(
    () =>
      active === "Todos"
        ? instructors
        : instructors.filter((i) => i.filterTags.includes(active)),
    [active]
  );

  return (
    <>
      <section className="relative w-full bg-zinc-950 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* ── Header ── */}
          <div className="text-center mb-14">
            <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins">
              Nuestros instructores
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mt-3 mb-4 font-poppins leading-tight">
              Nuestro{" "}
              <span className="text-[#ff7a00]">Equipo</span>
            </h2>
            <p className="text-white/50 text-base font-roboto max-w-xl mx-auto mb-10">
              Conoce a los músicos, productores y profesionales que acompañarán tu desarrollo artístico.
            </p>

            {/* Badges institucionales — solo datos verificables */}
            <div className="flex flex-wrap justify-center gap-3 mb-2">
              {[
                { icon: "🎓", label: "Formación nacional e internacional" },
                { icon: "🎸", label: "Instructores activos en la industria" },
                { icon: "🎯", label: "Clases 100% personalizadas" },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/10 text-white/60 text-xs font-roboto px-4 py-2 rounded-full"
                >
                  <span>{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Filtros ── */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {ALL_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200 font-poppins ${
                  active === f
                    ? "bg-[#ff7a00] border-[#ff7a00] text-white shadow-lg shadow-[#ff7a00]/20"
                    : "border-white/15 text-white/50 hover:border-[#ff7a00]/40 hover:text-white/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* ── Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {filtered.map((instructor) => (
              <div
                key={instructor.id}
                className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 transition-all duration-500 hover:border-[#ff7a00]/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#ff7a00]/10 flex flex-col"
              >
                {/* Photo */}
                <button
                  onClick={() => setSelected(instructor)}
                  className="relative w-full aspect-[3/4] overflow-hidden focus:outline-none"
                  aria-label={`Ver perfil de ${instructor.name}`}
                >
                  <OptimizedImage
                    src={instructor.photo ?? ""}
                    alt={instructor.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ objectPosition: instructor.photoPosition ?? "center top" }}
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                  {/* Instrument badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full font-poppins border border-white/10">
                      {instructor.instrumentEmoji} {instructor.instrument}
                    </span>
                  </div>

                  {/* Ver perfil hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-[#ff7a00] text-white text-xs font-bold px-4 py-2 rounded-full font-poppins shadow-lg">
                      Ver perfil
                    </span>
                  </div>
                </button>

                {/* Info */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Disponibilidad */}
                  <span className="inline-flex items-center gap-1.5 self-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider font-poppins">
                      Recibiendo estudiantes
                    </span>
                  </span>

                  <div>
                    <h3 className="text-white font-bold text-sm md:text-base font-poppins leading-tight">
                      {instructor.name}
                    </h3>
                    <p className="text-white/40 text-xs mt-0.5 font-roboto leading-snug line-clamp-2">
                      {instructor.role}
                    </p>
                  </div>

                  {/* CTA */}
                  <Link
                    href="/inscripcion"
                    className="mt-auto inline-flex items-center justify-center gap-2 bg-[#ff7a00] hover:bg-[#e66e00] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-[#ff7a00]/20 font-poppins"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Tomar clases
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-white/30 font-roboto text-sm py-12">
              No hay instructores en esta categoría por el momento.
            </p>
          )}
        </div>
      </section>

      {/* ── Modal ── */}
      {selected && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

          <div
            className="relative z-10 bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-10 text-white/40 hover:text-white transition-colors bg-black/40 rounded-full p-1.5"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>

            {/* Photo */}
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <OptimizedImage
                src={selected.photo ?? ""}
                alt={selected.name}
                fill
                className="object-cover"
                style={{ objectPosition: selected.photoPosition ?? "center center" }}
                sizes="512px"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-900 to-transparent" />
            </div>

            {/* Content */}
            <div className="px-6 pb-8 pt-2">

              {/* Header info */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.15em] font-poppins">
                      {selected.role}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white font-poppins">
                    {selected.name}
                  </h3>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-full font-poppins mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Activo
                </span>
              </div>

              {/* Resumen rápido */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/5">
                  <p className="text-[10px] text-white/40 font-poppins uppercase tracking-wider mb-0.5">Instrumento</p>
                  <p className="text-white text-xs font-bold font-roboto">
                    {selected.instrumentEmoji} {selected.instrument}
                  </p>
                </div>
                {selected.experience && (
                  <div className="bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/5">
                    <p className="text-[10px] text-white/40 font-poppins uppercase tracking-wider mb-0.5">Experiencia</p>
                    <p className="text-white text-xs font-bold font-roboto">{selected.experience}</p>
                  </div>
                )}
              </div>

              {/* Logros destacados */}
              <div className="mb-5">
                <p className="text-[10px] text-white/40 font-poppins uppercase tracking-wider mb-2.5">Formación y logros</p>
                <ul className="flex flex-col gap-2">
                  {selected.achievements.map((a) => (
                    <li key={a} className="flex items-start gap-2.5 text-white/70 text-sm font-roboto leading-snug">
                      <span className="text-[#ff7a00] mt-0.5 shrink-0">▸</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bio */}
              <p className="text-white/50 text-sm leading-relaxed font-roboto mb-5">
                {selected.bio}
              </p>

              {/* Specialties */}
              {selected.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selected.specialties.map((s) => (
                    <span
                      key={s}
                      className="bg-[#ff7a00]/10 border border-[#ff7a00]/20 text-[#ff7a00] text-xs font-semibold px-3 py-1 rounded-full font-roboto"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA principal */}
              <Link
                href="/inscripcion"
                className="flex items-center justify-center gap-2.5 w-full bg-[#ff7a00] hover:bg-[#e66e00] text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-xl shadow-[#ff7a00]/25 font-poppins"
                onClick={() => setSelected(null)}
              >
                Tomar clases
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
