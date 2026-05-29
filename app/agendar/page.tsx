import type { Metadata } from "next"
import PageLayout from "@/components/layout/PageLayout"
import BookingCalendar from "@/components/sections/BookingCalendar"
import { createAuthServerClient } from "@/lib/supabase/server"
import { studentBookAction } from "@/app/(student)/_actions/student"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Agendar Clase",
  description:
    "Agenda tu primera clase de música en 4U Studio Academy. Selecciona fecha, horario e instructor — Guitarra, Piano, Canto, Batería, Bajo y Producción Musical.",
}

export default async function AgendarPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <PageLayout>
      <section className="relative w-full min-h-screen overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,122,0,0.08), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(255,122,0,0.05), transparent 60%)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/6 blur-3xl rounded-full" aria-hidden="true" />
        <div className="pointer-events-none absolute top-0 -right-40 w-96 h-96 bg-orange-500/4 blur-3xl rounded-full" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          {user ? (
            /* Usuario autenticado: reserva directa con fn_book_session */
            <BookingCalendar serverAction={studentBookAction} mode="student" />
          ) : (
            /* Sin sesión: CTA de acceso */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-8">
              {/* Glow central */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <div className="w-[500px] h-[300px] bg-orange-500/10 blur-3xl rounded-full" />
              </div>

              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60 font-poppins backdrop-blur-md">
                  <span style={{ color: '#ff7a00' }}>♫</span> Portal de estudiantes
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight font-poppins">
                  Reserva tu clase<br />
                  <span style={{ color: '#ff7a00' }}>cuando quieras</span>
                </h1>
                <p className="text-white/50 text-base max-w-md mx-auto font-roboto leading-relaxed">
                  Crea tu cuenta o inicia sesión para ver disponibilidad, agendar clases y gestionar tus reservas.
                </p>
              </div>

              <div className="relative flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm">
                <a
                  href="/mi-cuenta/registro"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white font-poppins transition-all hover:brightness-110"
                  style={{ backgroundColor: '#ff7a00', boxShadow: '0 0 30px rgba(255,122,0,0.3)' }}
                >
                  Crear cuenta
                </a>
                <a
                  href="/mi-cuenta/login"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white/70 font-poppins border border-white/15 hover:border-white/30 hover:text-white transition-all"
                >
                  Iniciar sesión
                </a>
              </div>

              <p className="relative text-xs text-white/25 font-roboto">
                ¿Aún no eres estudiante?{' '}
                <a href="/planes" className="text-white/40 hover:text-white/60 transition-colors">
                  Ver planes →
                </a>
              </p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
