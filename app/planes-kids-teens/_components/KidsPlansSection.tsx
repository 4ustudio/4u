'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import OptimizedImage from '@/components/ui/OptimizedImage'

const INSTRUMENTOS = "Técnica vocal · Guitarra · Bajo · Teclado · Batería · Otros instrumentos según disponibilidad."
const MUSICALIDAD  = "Entrenamiento auditivo · Sentido rítmico · Interpretación y expresión artística."
const MP3_FEATURE  = "4 de las 8 clases son grabadas y entregadas al estudiante en formato MP3 (audio original sin edición), como herramienta de análisis, seguimiento y aprendizaje."
const PRESENTACIONES = "Presentaciones en vivo en tarima durante los eventos de la academia realizados en marzo, junio, septiembre y diciembre.*"

interface KidsPlan {
  label: string
  title: string
  accent: string
  price: string
  color: string
  imagePosition: string
  image: string
  features: string[]
  objective: string
  highlights: string[]
  shortDesc: string
}

const kidsPlans: KidsPlan[] = [
  {
    label: "Plan Kids & Teens",
    title: "Plan",
    accent: "Kids & Teens",
    price: "$1.100.000",
    color: "#ff6b00",
    imagePosition: "object-top",
    image: "/images/courses/plan-kids/Plan 1 Kids.png",
    highlights: [
      "Grabación profesional cada 3 meses",
      "8 clases mensuales personalizadas",
      "Presentaciones en tarima 4× al año",
      "MP3 de clases para seguimiento",
    ],
    shortDesc: "Aprende, crea y expresa tu talento en un ambiente divertido e inspirador.",
    features: [
      "Cada 3 meses se entrega una canción acústica grabada profesionalmente, mezclada y masterizada, lista para compartir con familiares, amigos o publicar en plataformas digitales.",
      "8 clases mensuales.",
      PRESENTACIONES,
      `Clases con profesores especializados en: ${INSTRUMENTOS}`,
      "Metodología lúdica, dinámica y creativa.",
      `Desarrollo de la musicalidad integral: ${MUSICALIDAD}`,
      MP3_FEATURE,
    ],
    objective: "Que el niño o adolescente aprenda, cree y se exprese musicalmente en un ambiente divertido e inspirador, culminando con una grabación profesional que queda como recuerdo.",
  },
  {
    label: "Plan Premium Kids & Teens",
    title: "Plan Premium",
    accent: "Kids & Teens",
    price: "$1.900.000",
    color: "#1397a5",
    imagePosition: "object-top",
    image: "/images/courses/plan-kids/Plan 2 Teens.png",
    highlights: [
      "Grabación profesional cada mes",
      "8 clases mensuales personalizadas",
      "Presentaciones en tarima 4× al año",
      "MP3 de clases para seguimiento",
    ],
    shortDesc: "Una grabación profesional cada mes para construir tu portafolio musical propio.",
    features: [
      "Cada mes se entrega una canción acústica grabada profesionalmente, mezclada y masterizada, lista para compartir con familiares, amigos o publicar en plataformas digitales.",
      "8 clases mensuales.",
      PRESENTACIONES,
      `Clases con profesores especializados en: ${INSTRUMENTOS}`,
      "Metodología lúdica, dinámica y creativa.",
      `Desarrollo de la musicalidad integral: ${MUSICALIDAD}`,
      MP3_FEATURE,
    ],
    objective: "Vivir la emoción de grabar una canción profesional cada mes, construyendo confianza, autoestima y un portafolio musical propio.",
  },
]

export default function KidsPlansSection() {
  const [selectedPlan, setSelectedPlan] = useState<KidsPlan | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <div className="plans-frame grid gap-8 lg:grid-cols-2">
        {kidsPlans.map((plan) => (
          <KidsPlanCard
            key={plan.label}
            plan={plan}
            onDetails={() => setSelectedPlan(plan)}
          />
        ))}
      </div>

      {mounted && selectedPlan && createPortal(
        <KidsModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />,
        document.body
      )}
    </>
  )
}

function KidsPlanCard({ plan, onDetails }: { plan: KidsPlan; onDetails: () => void }) {
  const { color, image, imagePosition, label, title, accent, price, highlights, shortDesc } = plan

  return (
    <article
      className="grid overflow-hidden rounded-2xl bg-white shadow-xl shadow-gray-950/10 ring-1 lg:grid-cols-[45%_55%]"
      style={{ borderColor: `${color}55` }}
    >
      {/* Imagen lateral — object-[center_35%] prioriza caras en fotos grupales */}
      <div className="relative min-h-[340px] lg:min-h-0">
        <OptimizedImage
          src={image}
          alt={accent}
          fill
          className="object-cover object-[center_35%]"
          sizes="(max-width: 1024px) 100vw, 45vw"
        />
      </div>

      <div className="flex flex-col p-6">
        <span className="inline-flex self-start rounded-lg px-4 py-2 text-sm font-extrabold uppercase text-white font-poppins" style={{ backgroundColor: color }}>
          {label}
        </span>
        <h2 className="mt-4 text-2xl font-extrabold uppercase leading-tight font-poppins">
          {title}
          <br />
          <span className="normal-case" style={{ color }}>{accent}</span>
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500 font-roboto">{shortDesc}</p>

        <ul className="mt-4 space-y-1.5">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 text-[13px] text-gray-700 font-roboto">
              <span className="mt-0.5 shrink-0" style={{ color }}>◎</span>
              {h}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-5">
          <p className="text-2xl font-extrabold font-poppins mb-3">{price}</p>
          <button
            onClick={onDetails}
            className="w-full rounded-lg border py-2.5 text-sm font-bold font-poppins transition-all hover:opacity-80"
            style={{ borderColor: color, color }}
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  )
}

function KidsModal({ plan, onClose }: { plan: KidsPlan; onClose: () => void }) {
  const { color, image, imagePosition, label, title, accent, price, features, objective } = plan

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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero imagen */}
        <div className="relative h-[200px]">
          <OptimizedImage
            src={image}
            alt={accent}
            fill
            className="object-cover object-[center_40%]"
            sizes="672px"
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 60%, transparent 100%)` }} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 -mt-2 space-y-5">
          <div>
            <span className="inline-flex rounded-lg px-3 py-1.5 text-sm font-extrabold uppercase text-white font-poppins" style={{ backgroundColor: color }}>
              {label}
            </span>
            <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight font-poppins text-gray-950">
              {title} <span className="normal-case" style={{ color }}>{accent}</span>
            </h2>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest font-poppins mb-3" style={{ color }}>Incluye</h3>
            <ul className="space-y-2.5">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-700 font-roboto leading-relaxed">
                  <span className="mt-0.5 shrink-0" style={{ color }}>◎</span> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: `${color}12` }}>
            <p className="font-extrabold font-poppins text-sm" style={{ color }}>Objetivo</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-700 font-roboto">{objective}</p>
          </div>

          <div className="border-t border-gray-100 pt-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl font-extrabold font-poppins text-gray-950">{price}</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 px-5 py-2.5 text-sm font-poppins transition-all"
              >
                Cerrar
              </button>
              <Link
                href="/inscripcion"
                className="rounded-lg px-6 py-2.5 text-sm font-bold text-white font-poppins hover:brightness-110 transition-all"
                style={{ backgroundColor: color }}
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
