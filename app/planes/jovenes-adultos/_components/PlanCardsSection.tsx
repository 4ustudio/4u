'use client'

import { useState } from 'react'
import Link from 'next/link'
import OptimizedImage from '@/components/ui/OptimizedImage'
import { PLANES_ADULTOS } from '@/data/plans-adults'

const FILTERS = ['Todos', 'Inicial', 'Artista', 'Profesional', 'Empresas'] as const

export default function PlanCardsSection() {
  const [active, setActive] = useState<string>('Todos')

  const visible = active === 'Todos'
    ? PLANES_ADULTOS
    : PLANES_ADULTOS.filter((p) => p.tag === active)

  return (
    <>
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`inline-flex min-w-[132px] items-center justify-center gap-3 rounded-lg px-6 py-3 text-sm font-bold shadow-md font-poppins transition-colors duration-200 ${
              active === f
                ? 'bg-[#ff6b00] text-white shadow-orange-500/25'
                : 'bg-white text-gray-950 ring-1 ring-gray-200 hover:ring-[#ff6b00]/40 hover:text-[#ff6b00]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid de cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {visible.map((plan) => (
          <article
            key={plan.id}
            className="
              group overflow-hidden rounded-xl cursor-pointer
              bg-white text-gray-950
              ring-1 ring-gray-200
              shadow-xl shadow-gray-950/10
              [transition:transform_.3s_ease,box-shadow_.3s_ease,background-color_.3s_ease,color_.3s_ease]
              hover:-translate-y-[10px]
              hover:shadow-[0_20px_40px_rgba(0,0,0,0.22)]
              hover:bg-[#050816]
              hover:ring-[#050816]
            "
          >
            {/* Imagen */}
            <div className="relative h-[165px] overflow-hidden">
              <OptimizedImage
                src={plan.image}
                alt={plan.name}
                fill
                className={`object-cover transition-transform duration-300 group-hover:scale-105 ${plan.imagePosition ?? ''}`}
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
              {/* Overlay oscuro en hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,.70), rgba(0,0,0,.30))' }}
                aria-hidden="true"
              />
              <span className="absolute left-5 top-5 rounded-md bg-[#ff6b00] px-3 py-2 text-base font-extrabold text-white font-poppins z-10">
                {String(plan.id).padStart(2, '0')}
              </span>
              {plan.highlighted && (
                <span className="absolute right-5 top-5 rounded-full bg-[#ff6b00] px-3 py-1 text-xs font-bold text-white font-poppins z-10">
                  {plan.badge}
                </span>
              )}
            </div>

            {/* Contenido */}
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6b00] font-roboto mb-1">
                {plan.subtitle}
              </p>

              <h2 className="text-xl font-extrabold leading-tight font-poppins text-gray-950 group-hover:text-white [transition:color_.3s_ease]">
                {plan.name}
              </h2>

              {plan.description && (
                <p className="mt-2 text-sm font-roboto text-gray-600 group-hover:text-white/70 [transition:color_.3s_ease]">
                  {plan.description}
                </p>
              )}

              <ul className="mt-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs font-roboto text-gray-600 group-hover:text-white/65 [transition:color_.3s_ease]">
                    <span className="mt-0.5 text-[#ff6b00] shrink-0">◎</span> {f}
                  </li>
                ))}
              </ul>

              {plan.instruments && (
                <p className="mt-3 text-xs font-roboto text-gray-400 group-hover:text-white/40 [transition:color_.3s_ease]">
                  Instrumentos: {plan.instruments.join(', ')}
                </p>
              )}

              {plan.priceAlt && (
                <p className="mt-2 text-[11px] font-roboto text-gray-400 group-hover:text-white/40 [transition:color_.3s_ease]">
                  {plan.priceAlt}
                </p>
              )}

              {plan.footerNote && (
                <p className="mt-3 text-[10px] font-roboto text-gray-400/70 group-hover:text-white/30 [transition:color_.3s_ease] italic">
                  {plan.footerNote}
                </p>
              )}

              <div className="mt-6">
                <p className="text-lg font-extrabold font-poppins text-gray-950 group-hover:text-white [transition:color_.3s_ease]">
                  {plan.price}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
