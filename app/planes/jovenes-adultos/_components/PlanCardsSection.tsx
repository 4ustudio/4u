'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import OptimizedImage from '@/components/ui/OptimizedImage'
import { PLANES_ADULTOS, type PlanDetail } from '@/data/plans-adults'

const FILTERS = ['Todos', 'Inicial', 'Artista', 'Profesional', 'Empresas'] as const

const KEY_HIGHLIGHTS: Record<number, string[]> = {
  1: [
    'Grabación profesional cada 3 meses',
    '8 clases mensuales personalizadas',
    'Presentaciones en tarima 4× al año',
    'MP3 de clases para seguimiento',
  ],
  2: [
    'Grabación profesional cada mes',
    '8 clases mensuales personalizadas',
    'Presentaciones en tarima 4× al año',
    'MP3 de clases para seguimiento',
  ],
  3: [
    'Grabación grupal cada 3 meses',
    '8 sesiones mensuales de ensamble',
    'Presentaciones en tarima 4× al año',
    'Hasta 4 integrantes por banda',
  ],
  4: [
    'Producción y desarrollo de tu canción',
    '8 sesiones mensuales',
    'Dirección artística personalizada',
    'Canción mezclada y masterizada',
  ],
  5: [
    'Canción producida + imagen artística',
    '8 sesiones mensuales',
    'Sesión fotográfica + diseño de portada',
    'Identidad visual y asesoría de imagen',
  ],
  6: [
    'Álbum, EP o catálogo completo',
    'Dirección artística integral',
    'Mezcla y masterización profesional',
    'Desarrollo de identidad artística',
  ],
  7: [
    'Diagnóstico y estrategia de marca sonora',
    'Jingles y producción institucional',
    'Locuciones y audiobranding',
    'Entrega optimizada por canal',
  ],
}

const SHORT_DESC: Record<number, string> = {
  1: 'Comienza tu camino musical. Aprende, crea y graba tu primera canción profesional.',
  2: 'Avanza más rápido. Una grabación profesional cada mes para construir tu portafolio.',
}

export default function PlanCardsSection() {
  const [active, setActive] = useState<string>('Todos')
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
          <PlanCard
            key={plan.id}
            plan={plan}
            highlights={KEY_HIGHLIGHTS[plan.id] ?? plan.features.slice(0, 4)}
            shortDesc={SHORT_DESC[plan.id] ?? plan.description}
            onDetails={() => setSelectedPlan(plan)}
          />
        ))}
      </div>

      {mounted && selectedPlan && createPortal(
        <PlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />,
        document.body
      )}
    </>
  )
}

function PlanCard({
  plan,
  highlights,
  shortDesc,
  onDetails,
}: {
  plan: PlanDetail
  highlights: string[]
  shortDesc: string
  onDetails: () => void
}) {
  return (
    <article
      className="
        group overflow-hidden rounded-xl
        bg-white text-gray-950
        ring-1 ring-gray-200
        shadow-xl shadow-gray-950/10
        flex flex-col
        [transition:transform_.3s_ease,box-shadow_.3s_ease,background-color_.3s_ease]
        hover:-translate-y-[6px]
        hover:shadow-[0_20px_40px_rgba(0,0,0,0.22)]
        hover:bg-[#050816]
        hover:ring-[#050816]
      "
    >
      {/* Imagen */}
      <div className="relative h-[160px] overflow-hidden shrink-0">
        <OptimizedImage
          src={plan.image}
          alt={plan.name}
          fill
          className="object-cover object-[center_25%] transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,.25))' }}
          aria-hidden="true"
        />
        <span className="absolute left-4 top-4 rounded-md bg-[#ff6b00] px-3 py-1.5 text-sm font-extrabold text-white font-poppins z-10">
          {String(plan.id).padStart(2, '0')}
        </span>
        {plan.highlighted && plan.badge && (
          <span className="absolute right-4 top-4 rounded-full bg-[#ff6b00] px-3 py-1 text-xs font-bold text-white font-poppins z-10">
            {plan.badge}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6b00] font-roboto mb-1">
          {plan.subtitle}
        </p>
        <h2 className="text-lg font-extrabold leading-tight font-poppins text-gray-950 group-hover:text-white [transition:color_.3s_ease] mb-2">
          {plan.name}
        </h2>

        {shortDesc && (
          <p className="text-xs font-roboto text-gray-500 group-hover:text-white/55 [transition:color_.3s_ease] leading-relaxed mb-3 line-clamp-2">
            {shortDesc}
          </p>
        )}

        <ul className="space-y-1.5 mb-4">
          {highlights.slice(0, 4).map((h) => (
            <li key={h} className="flex items-start gap-2 text-[12px] font-roboto text-gray-600 group-hover:text-white/60 [transition:color_.3s_ease]">
              <span className="mt-0.5 text-[#ff6b00] shrink-0">◎</span> {h}
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <p className="text-lg font-extrabold font-poppins text-gray-950 group-hover:text-white [transition:color_.3s_ease] mb-3">
            {plan.priceOnRequest ? 'A consultar' : plan.price}
            {plan.priceNote && !plan.priceOnRequest && (
              <span className="text-xs font-normal text-gray-400 group-hover:text-white/35 ml-1 [transition:color_.3s_ease]">{plan.priceNote}</span>
            )}
          </p>
          <button
            onClick={onDetails}
            className="w-full rounded-lg border border-gray-200 group-hover:border-white/20 py-2.5 text-sm font-bold text-gray-700 group-hover:text-white/75 font-poppins [transition:all_.3s_ease] hover:!border-[#ff6b00] hover:!text-[#ff6b00]"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  )
}

function PlanModal({ plan, onClose }: { plan: PlanDetail; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero imagen */}
        <div className="relative h-[200px] shrink-0">
          <OptimizedImage
            src={plan.image}
            alt={plan.name}
            fill
            className="object-cover object-[center_20%]"
            sizes="672px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          <div className="absolute bottom-4 left-6 z-10">
            {plan.badge && (
              <span className="inline-block rounded-full bg-[#ff6b00] px-3 py-1 text-xs font-bold text-white font-poppins mb-2">
                {plan.badge}
              </span>
            )}
            <h2 className="text-2xl font-extrabold text-white font-poppins leading-tight">{plan.name}</h2>
            <p className="text-sm text-white/55 font-roboto mt-0.5">{plan.subtitle}</p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {plan.description && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b00] font-poppins mb-2">Descripción</h3>
              <p className="text-sm text-white/70 font-roboto leading-relaxed">{plan.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b00] font-poppins mb-3">Incluye</h3>
            <ul className="space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/70 font-roboto leading-relaxed">
                  <span className="mt-0.5 text-[#ff6b00] shrink-0">◎</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {plan.instruments && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b00] font-poppins mb-2">Instrumentos</h3>
              <div className="flex flex-wrap gap-2">
                {plan.instruments.map((i) => (
                  <span key={i} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/55 font-roboto">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {plan.priceAlt && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b00] font-poppins mb-2">Modalidades de precio</h3>
              <p className="text-sm text-white/60 font-roboto">{plan.priceAlt}</p>
            </div>
          )}

          {plan.footerNote && (
            <p className="text-xs text-white/30 font-roboto italic">{plan.footerNote}</p>
          )}

          <div className="border-t border-white/10 pt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-extrabold text-white font-poppins">
                {plan.priceOnRequest ? 'Precio a consultar' : plan.price}
              </p>
              {plan.priceNote && !plan.priceOnRequest && (
                <p className="text-xs text-white/35 font-roboto mt-0.5">{plan.priceNote}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-zinc-600 text-white/60 hover:text-white hover:border-zinc-500 px-5 py-2.5 text-sm font-poppins transition-all"
              >
                Cerrar
              </button>
              <Link
                href="/inscripcion"
                className="rounded-lg bg-[#ff6b00] text-white px-6 py-2.5 text-sm font-bold font-poppins hover:brightness-110 transition-all"
              >
                Inscribirme
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
