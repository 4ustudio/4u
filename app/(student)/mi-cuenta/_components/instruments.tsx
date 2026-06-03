import type { ReactNode } from 'react'

// Mapeo de instrumento (course.name) → icono SVG inline + emoji para PDF.
// Cursos en BD: Canto, Guitarra, Bajo, Batería, Teclado (+ Producción fallback).

type InstrumentKey = 'canto' | 'guitarra' | 'bajo' | 'bateria' | 'teclado' | 'produccion' | 'default'

function normalize(courseName?: string | null): InstrumentKey {
  const n = (courseName ?? '').toLowerCase().trim()
  if (!n) return 'default'
  if (n.includes('canto') || n.includes('voz') || n.includes('vocal')) return 'canto'
  if (n.includes('bajo')) return 'bajo'
  if (n.includes('guitar')) return 'guitarra'
  if (n.includes('bater') || n.includes('drum')) return 'bateria'
  if (n.includes('teclado') || n.includes('piano')) return 'teclado'
  if (n.includes('produc')) return 'produccion'
  return 'default'
}

const EMOJI: Record<InstrumentKey, string> = {
  canto: '🎤',
  guitarra: '🎸',
  bajo: '🎸',
  bateria: '🥁',
  teclado: '🎹',
  produccion: '🎚️',
  default: '🎵',
}

export function instrumentEmoji(courseName?: string | null): string {
  return EMOJI[normalize(courseName)]
}

// SVG paths (stroke-based, viewBox 0 0 24 24) — coherente con los iconos del proyecto
const ICON_PATHS: Record<InstrumentKey, ReactNode> = {
  // micrófono
  canto: (
    <>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
    </>
  ),
  // guitarra (cuerpo + mástil)
  guitarra: (
    <>
      <path d="M14 4l6 6-2 2-1-1-2 2a4 4 0 1 1-4-4l2-2-1-1 2-2z" />
      <circle cx="9" cy="15" r="1.5" />
    </>
  ),
  // bajo (similar, con clavijero marcado)
  bajo: (
    <>
      <path d="M15 3l6 6-2.5 2.5-1-1-2 2a4.5 4.5 0 1 1-4-4l2-2-1-1L15 3z" />
      <path d="M19 5l1.5 1.5" />
    </>
  ),
  // batería
  bateria: (
    <>
      <ellipse cx="12" cy="9" rx="8" ry="3" />
      <path d="M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9" />
      <path d="M12 12V3M9 3h6" />
    </>
  ),
  // teclado / piano
  teclado: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 5v9M12 5v9M16 5v9M3 14h18" />
    </>
  ),
  // producción (faders / sliders)
  produccion: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M2 14h4M10 8h4M18 16h4" />
    </>
  ),
  // nota musical
  default: (
    <>
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M9 18V5l12-2v13" />
    </>
  ),
}

export function InstrumentIcon({
  courseName,
  className = 'h-4 w-4',
}: {
  courseName?: string | null
  className?: string
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[normalize(courseName)]}
    </svg>
  )
}
