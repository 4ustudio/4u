import type { Metadata } from 'next'
import PageLayout from '@/components/layout/PageLayout'
import BookingForm from '@/components/sections/BookingForm'

export const metadata: Metadata = {
  title: 'Agendar Clase',
  description: 'Agenda tu primera clase de música en 4U Studio Academy. Guitarra, Piano, Canto, Batería, Bajo y Producción Musical.',
}

const TRUST_ITEMS = [
  { icon: '🎓', label: '+1,200 estudiantes' },
  { icon: '⭐', label: '4.9/5 valoración' },
  { icon: '🎵', label: '+25 cursos disponibles' },
]

export default function AgendarPage() {
  return (
    <PageLayout>
      <section className="relative w-full min-h-screen overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-orange-500/8 blur-3xl rounded-full" aria-hidden="true" />
        <div className="pointer-events-none absolute top-0 -right-40 w-96 h-96 bg-orange-500/5 blur-3xl rounded-full" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 -left-40 w-96 h-96 bg-orange-500/5 blur-3xl rounded-full" aria-hidden="true" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-start">

            {/* Columna izquierda — Copy */}
            <div className="lg:sticky lg:top-24 space-y-8">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70 font-poppins backdrop-blur-md mb-4">
                  <span className="text-[#ff7a00]">♫</span> Primera clase sin compromiso
                </p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight font-poppins">
                  Empieza tu camino{' '}
                  <span className="text-[#ff7a00]">musical hoy</span>
                </h1>
                <p className="mt-4 text-white/60 text-lg leading-relaxed font-roboto max-w-md">
                  Cuéntanos sobre ti y el curso que te interesa. Te contactaremos para coordinar horario y modalidad.
                </p>
              </div>

              {/* Trust items */}
              <ul className="space-y-3">
                {TRUST_ITEMS.map((item) => (
                  <li key={item.label} className="flex items-center gap-3 text-white/70 font-roboto text-sm">
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </li>
                ))}
              </ul>

              {/* Proceso */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                <p className="text-white/50 text-xs uppercase tracking-widest font-roboto">¿Cómo funciona?</p>
                {[
                  { n: '01', text: 'Completa el formulario — toma menos de 2 minutos' },
                  { n: '02', text: 'Te contactamos para confirmar horario y modalidad' },
                  { n: '03', text: 'Asiste a tu primera clase y descubre tu potencial' },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ff7a00]/30 text-[#ff7a00] text-xs font-bold font-poppins">
                      {step.n}
                    </span>
                    <p className="text-white/65 text-sm leading-snug font-roboto pt-1">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha — Formulario */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 shadow-2xl">
              <div className="mb-7">
                <h2 className="text-white font-bold text-xl font-poppins">Agenda tu clase</h2>
                <p className="text-white/45 text-sm mt-1 font-roboto">Los campos con * son obligatorios</p>
              </div>
              <BookingForm />
            </div>

          </div>
        </div>
      </section>
    </PageLayout>
  )
}
