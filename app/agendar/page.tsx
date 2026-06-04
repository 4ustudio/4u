import type { Metadata } from "next"
import Image from "next/image"
import Header from "@/components/layout/Header"
import BookingCalendar from "@/components/sections/BookingCalendar"
import { createAuthServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { studentBookAction } from "@/app/(student)/_actions/student"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Agendar Clase — 4U Studio Academy",
  description:
    "Agenda tu clase de música en 4U Studio Academy. Selecciona fecha, instrumento e instructor — Guitarra, Piano, Canto, Batería, Bajo y Producción Musical.",
}

export default async function AgendarPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const adminClient = createAdminClient()

  let activeCourses: { id: string; name: string }[] = []
  let studentId: string | undefined

  const [instrResult, coursesResult] = await Promise.all([
    adminClient.from("instructors").select("id, name, notes").eq("status", "active").order("name"),
    adminClient.from("courses").select("id, name").eq("is_active", true).order("name"),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allInstructors = (instrResult.data ?? []) as { id: string; name: string; notes?: string | null }[]
  activeCourses = (coursesResult.data ?? []) as { id: string; name: string }[]

  if (isLoggedIn && user) {
    const { data } = await adminClient.from("students").select("id").eq("user_id", user.id).maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentId = (data as any)?.id as string | undefined
  }

  const instructorsForCalendar = isLoggedIn
    ? allInstructors.map(({ id, name }) => ({ id, name }))
    : []

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#090909] px-4 pt-[92px] pb-16">
        <div className="mx-auto max-w-[1400px]">

          {/* ══ HERO ══════════════════════════════════════════════════════ */}
          <section className="mb-8 pt-2">
            <h1 className="font-poppins text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Agenda tu curso <span style={{ color: "#ff7a00" }}>ideal</span>
            </h1>
            <p className="mt-2 text-white/50 text-sm max-w-2xl leading-relaxed font-roboto">
              Selecciona la fecha y horario que mejor se adapten a ti. Un instructor especializado será asignado según disponibilidad y especialidad.
            </p>
          </section>

          {/* ══ MAIN GRID: Team (left) + Calendar (right) ════════════════ */}
          <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">

            {/* ── COLUMNA IZQUIERDA: Equipo docente ────────────────────── */}
            <div className="order-2 lg:order-1">

              {/* Card equipo docente premium */}
              <div className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">

                <div className="relative h-32 rounded-t-xl overflow-hidden">
                  <Image
                    src="/images/banners-responsive/Banner Responsive.png"
                    alt="Equipo de instructores 4U Studio Academy"
                    fill
                    className="object-cover object-center"
                    sizes="340px"
                  />
                  <div className="absolute inset-0" style={{ background:"linear-gradient(to top, #141414 0%, rgba(255,100,0,0.15) 50%, transparent 100%)" }} />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor:"rgba(255,122,0,0.15)", color:"#ff7a00" }}>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </span>
                    <p className="text-white/60 text-xs font-semibold font-roboto">Nuestro equipo docente</p>
                  </div>

                  <p className="text-white/40 text-[11px] font-roboto leading-relaxed">
                    Nuestros instructores especializados
                  </p>

                  <ul className="space-y-1">
                    {[
                      "Atención personalizada",
                      "Horarios flexibles",
                      "Clases presenciales",
                      "Material incluido",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-1.5 text-xs text-white/60 font-roboto">
                        <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-400 font-roboto">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Disponibles hoy
                  </span>

                  <p className="text-white/35 text-xs font-roboto leading-relaxed pt-3 border-t border-white/[0.06]">
                    Los horarios disponibles se generan automáticamente según la disponibilidad y especialidad de nuestros instructores.
                  </p>
                </div>
              </div>

            </div>

            {/* ── COLUMNA DERECHA: Calendario + Flujo de reserva ──────── */}
            <div className="order-1 lg:order-2">
              <BookingCalendar
                serverAction={isLoggedIn ? studentBookAction : undefined}
                mode={isLoggedIn ? "student" : "public"}
                isLoggedIn={isLoggedIn}
                instructors={instructorsForCalendar}
                activeCourses={activeCourses}
                studentId={studentId}
              />
            </div>

          </div>
        </div>
      </main>
    </>
  )
}
