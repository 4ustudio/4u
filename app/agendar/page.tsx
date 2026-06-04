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

  if (user) {
    const { data } = await adminClient.from("students").select("id").eq("user_id", user.id).maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentId = (data as any)?.id as string | undefined
  }

  const instructorsForCalendar = allInstructors.map(({ id, name }) => ({ id, name }))

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#090909] px-4 pt-[92px] pb-16">
        <div className="mx-auto max-w-[1400px]">

          {/* ══ HERO ══════════════════════════════════════════════════════ */}
          <section className="mb-7 pt-2">
            <h1 className="font-poppins text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Agenda tu curso <span style={{ color: "#ff7a00" }}>ideal</span>
            </h1>
            <p className="mt-2 text-white/50 text-sm max-w-xl leading-relaxed font-roboto">
              Elige fecha, clase y horario. Confirma tu reserva en pocos pasos.
            </p>
          </section>

          {/* ══ MAIN GRID: Team (left) + Calendar (right) ════════════════ */}
          <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">

            {/* ── COLUMNA IZQUIERDA: Equipo docente ────────────────────── */}
            <div className="order-2 lg:order-1 lg:sticky lg:top-[100px]">

              {/* Card equipo docente premium */}
              <div className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden shadow-2xl shadow-black/30">

                <div className="relative h-40 rounded-t-xl overflow-hidden">
                  <Image
                    src="/images/instructors/mario-mayorga.jpeg"
                    alt="Equipo de instructores 4U Studio Academy"
                    fill
                    className="object-cover object-center"
                    sizes="340px"
                  />
                  <div className="absolute inset-0" style={{ background:"linear-gradient(to top, #141414 0%, rgba(255,100,0,0.15) 50%, transparent 100%)" }} />
                </div>

                <div className="p-5 space-y-4">
                  <h2 className="font-poppins text-xl font-extrabold text-white">Nuestro equipo docente</h2>

                  <ul className="grid gap-3">
                    {[
                      "Atención personalizada",
                      "Horarios flexibles",
                      "Clases presenciales",
                      "Material incluido",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-white/75 font-roboto">
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <span className="inline-flex items-center gap-2 rounded-xl border border-green-500/35 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 font-roboto">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                    Disponibles hoy
                  </span>
                </div>
              </div>

            </div>

            {/* ── COLUMNA DERECHA: Calendario + Flujo de reserva ──────── */}
            <div className="order-1 lg:order-2">
              <BookingCalendar
                serverAction={studentBookAction}
                mode="student"
                isLoggedIn={true}
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
