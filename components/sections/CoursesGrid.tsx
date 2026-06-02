'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import OptimizedImage from '@/components/ui/OptimizedImage'
import CourseCardFull from '@/components/cards/CourseCardFull'
import { courses } from '@/data/courses'
import { ACADEMY } from '@/lib/constants'
import type { Course } from '@/types'

export default function CoursesGrid() {
  const [selected, setSelected] = useState<Course | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {courses.map((course) => (
          <CourseCardFull
            key={course.title}
            course={course}
            onClick={() => setSelected(course)}
          />
        ))}
      </div>

      {mounted && selected && createPortal(
        <CourseModal course={selected} onClose={() => setSelected(null)} />,
        document.body
      )}
    </>
  )
}

function CourseModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const waLink = `https://api.whatsapp.com/send/?phone=${ACADEMY.phone}&text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20el%20curso%20de%20${encodeURIComponent(course.title)}%20en%204U%20Studio%20Academy`

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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero imagen */}
        <div className="relative h-[200px] shrink-0">
          <OptimizedImage
            src={course.image || '/images/hero/banner-principal.jpg'}
            alt={course.title}
            fill
            className="object-cover object-[center_25%]"
            sizes="512px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* Icono + título sobre la imagen */}
          <div className="absolute bottom-4 left-5 z-10 flex items-end gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lg"
              style={{ backgroundColor: course.color }}
            >
              <div className="scale-[0.42] [&_svg]:fill-white">{course.icon}</div>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white font-poppins leading-tight">{course.title}</h2>
              {course.subtitle && (
                <p className="text-xs text-white/50 font-roboto">{course.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Descripción */}
          <p className="text-sm text-white/70 font-roboto leading-relaxed">{course.description}</p>

          {/* Habilidades */}
          {course.highlights && course.highlights.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest font-poppins mb-3" style={{ color: course.color }}>
                Lo que aprenderás
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {course.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] border border-white/8 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                    <span className="text-xs text-white/70 font-roboto">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info rápida */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/[0.04] border border-white/8 px-4 py-3">
              <p className="text-[10px] text-white/35 uppercase tracking-wider font-roboto mb-1">Sesiones</p>
              <p className="text-sm font-semibold text-white font-poppins">{course.duration ?? '8 sesiones/mes'}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/8 px-4 py-3">
              <p className="text-[10px] text-white/35 uppercase tracking-wider font-roboto mb-1">Nivel</p>
              <p className="text-sm font-semibold text-white font-poppins">{course.level ?? 'Básico a Avanzado'}</p>
            </div>
          </div>

          {/* Indicador activo */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs text-white/40 font-roboto uppercase tracking-wide">{course.status}</span>
          </div>

          {/* CTAs principales */}
          <div className="border-t border-white/10 pt-5 space-y-2.5">
            <Link
              href="/agendar"
              className="flex items-center justify-center gap-2.5 w-full rounded-xl py-3 text-sm font-bold text-white font-poppins transition-all hover:brightness-110"
              style={{ backgroundColor: course.color }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Agendar clase de prueba
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full rounded-xl border border-white/15 py-3 text-sm font-semibold text-white/80 hover:text-white hover:border-white/30 font-poppins transition-all"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 448 512" aria-hidden="true">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
              </svg>
              Solicitar información
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
