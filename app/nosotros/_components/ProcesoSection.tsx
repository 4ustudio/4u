'use client'

import { useState, useEffect, useRef } from 'react'

const STEPS = [
  { label: 'Soñar',           desc: 'Descubre tu pasión musical y define tu objetivo.' },
  { label: 'Aprender',        desc: 'Adquiere conocimientos con guía profesional.' },
  { label: 'Practicar',       desc: 'Desarrolla habilidades mediante ejercicios y acompañamiento.' },
  { label: 'Grabar',          desc: 'Registra tu progreso en estudio profesional.' },
  { label: 'Escuchar',        desc: 'Analiza tu desempeño y fortalece tu oído.' },
  { label: 'Mejorar',         desc: 'Corrige detalles y perfecciona tu técnica.' },
  { label: 'Mostrar',         desc: 'Comparte tu trabajo y gana confianza.' },
  { label: 'Sentirse artista', desc: 'Vive la experiencia completa de un músico.' },
] as const

const N = STEPS.length

export default function ProcesoSection() {
  const [hovered, setHovered] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const desktopRef = useRef<HTMLDivElement>(null)
  const mobileRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    if (desktopRef.current) obs.observe(desktopRef.current)
    if (mobileRef.current)  obs.observe(mobileRef.current)
    return () => obs.disconnect()
  }, [])

  // Track: spans from center of col 0 to center of col N-1
  // Each col = 100/N %. Center of col i = (2i+1)/(2N)*100%
  const halfColPct = 100 / (2 * N)       // 6.25%
  const trackPct   = 100 - 2 * halfColPct // 87.5%
  const fillPct    = hovered !== null
    ? (hovered / (N - 1)) * trackPct
    : 0

  return (
    <section className="relative w-full bg-zinc-950 pt-20 pb-32 md:pt-28 md:pb-40">
      {/* Glow decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#ff7a00] blur-[120px] opacity-[0.04]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Título */}
        <div className="text-center mb-20">
          <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins">
            Nuestro proceso
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#ff7a00] mt-4 font-poppins leading-tight">
            Nuestro objetivo es que cada alumno<br className="hidden md:block" />
            viva este proceso
          </h2>
        </div>

        {/* ── DESKTOP ────────────────────────────────────────── */}
        <div ref={desktopRef} className="hidden lg:block relative">

          {/* Línea de fondo */}
          <div
            className="absolute h-px bg-white/10 pointer-events-none"
            style={{ top: 32, left: `${halfColPct}%`, width: `${trackPct}%`, zIndex: 0 }}
          />

          {/* Línea naranja de progreso */}
          <div
            className="absolute h-px pointer-events-none"
            style={{
              top: 32,
              left: `${halfColPct}%`,
              width: `${fillPct}%`,
              background: 'linear-gradient(to right, #ff7a00, #ff9933)',
              boxShadow: fillPct > 0 ? '0 0 10px rgba(255,122,0,0.65)' : 'none',
              transition: 'width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease',
              zIndex: 0,
            }}
          />

          {/* Steps */}
          <div className="grid grid-cols-8 gap-1">
            {STEPS.map((step, i) => {
              const isLast    = i === N - 1
              const isHovered = hovered === i
              const isActive  = isHovered || isLast

              // Clamp tooltip for first / last step so it doesn't clip edge
              const tooltipAlign: React.CSSProperties =
                i === 0       ? { left: 0, transform: `translateY(${isHovered ? 0 : 6}px)` }
                : i === N - 1 ? { left: 'auto', right: 0, transform: `translateY(${isHovered ? 0 : 6}px)` }
                :               { left: '50%', transform: `translateX(-50%) translateY(${isHovered ? 0 : 6}px)` }

              return (
                <div
                  key={step.label}
                  className={`relative flex flex-col items-center text-center transition-all duration-500 ${
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: visible ? `${i * 110}ms` : '0ms' }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Tooltip flotante */}
                  <div
                    className="absolute z-30 w-44 pointer-events-none"
                    style={{
                      bottom: 'calc(100% + 16px)',
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity .2s ease, transform .2s ease',
                      ...tooltipAlign,
                    }}
                  >
                    <div className="bg-zinc-900/95 backdrop-blur-sm border border-[#ff7a00]/35 rounded-xl px-3.5 py-3 shadow-2xl shadow-black/60">
                      <p className="text-[11px] font-bold text-[#ff7a00] font-poppins mb-1">{step.label}</p>
                      <p className="text-[10px] text-white/70 leading-snug font-roboto">{step.desc}</p>
                    </div>
                    {/* Caret apuntando hacia abajo */}
                    <div
                      className="rotate-45 bg-zinc-900/95 border-r border-b border-[#ff7a00]/35"
                      style={{
                        width: 10,
                        height: 10,
                        marginTop: -6,
                        marginLeft: i === 0 ? 20 : i === N - 1 ? 'auto' : 'auto',
                        marginRight: i === N - 1 ? 20 : undefined,
                        ...(i !== 0 && i !== N - 1 ? { marginLeft: 'auto', marginRight: 'auto' } : {}),
                      }}
                    />
                  </div>

                  {/* Círculo */}
                  <div className="relative z-10">
                    {/* Ring pulsante solo en último paso */}
                    {isLast && (
                      <div
                        className="absolute inset-0 rounded-full border-2 border-[#ff7a00]/50 animate-ping"
                        style={{ animationDuration: '3s' }}
                      />
                    )}
                    <div
                      className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 text-base font-bold font-poppins cursor-pointer select-none"
                      style={{
                        borderColor:     isActive ? '#ff7a00' : 'rgba(255,255,255,0.15)',
                        color:           isActive ? '#ff7a00' : 'rgba(255,255,255,0.70)',
                        backgroundColor: isActive ? 'rgba(255,122,0,0.12)' : 'rgba(255,255,255,0.04)',
                        transform:       isHovered ? 'translateY(-8px) scale(1.08)' : isLast ? 'scale(1.05)' : 'translateY(0) scale(1)',
                        boxShadow:       isHovered
                          ? '0 0 24px rgba(255,122,0,0.55), 0 14px 32px rgba(255,122,0,0.22)'
                          : isLast
                          ? '0 0 18px rgba(255,122,0,0.35)'
                          : 'none',
                        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease, color 0.3s ease',
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Etiqueta */}
                  <span
                    className="mt-3 text-[11px] font-semibold font-poppins leading-tight px-0.5 transition-colors duration-300"
                    style={{ color: isHovered ? '#fff' : isLast ? '#ff7a00' : 'rgba(255,255,255,0.50)' }}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── MÓVIL: lista 2 columnas con descripción visible ── */}
        <div
          ref={mobileRef}
          className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {STEPS.map((step, i) => {
            const isLast = i === N - 1
            return (
              <div
                key={step.label}
                className={`flex items-start gap-4 transition-all duration-500 ${
                  visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                style={{ transitionDelay: visible ? `${i * 80}ms` : '0ms' }}
              >
                {/* Círculo */}
                <div className="relative shrink-0 mt-0.5">
                  {isLast && (
                    <div
                      className="absolute inset-0 rounded-full border-2 border-[#ff7a00]/40 animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                  )}
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold font-poppins"
                    style={{
                      borderColor:     isLast ? '#ff7a00' : 'rgba(255,255,255,0.18)',
                      color:           isLast ? '#ff7a00' : 'rgba(255,255,255,0.75)',
                      backgroundColor: isLast ? 'rgba(255,122,0,0.10)' : 'rgba(255,255,255,0.04)',
                      boxShadow:       isLast ? '0 0 14px rgba(255,122,0,0.28)' : 'none',
                    }}
                  >
                    {i + 1}
                  </div>
                </div>
                {/* Texto */}
                <div>
                  <p
                    className="text-sm font-bold font-poppins leading-tight"
                    style={{ color: isLast ? '#ff7a00' : '#fff' }}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-white/45 font-roboto leading-relaxed mt-1">
                    {step.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
