import type { Metadata } from "next"
import Image from "next/image"
import Header from "@/components/layout/Header"
import BookingCalendar from "@/components/sections/BookingCalendar"
import { createAuthServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { studentBookAction } from "@/app/(student)/_actions/student"
import { instructors as staticInstructors } from "@/data/instructors"

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

            {/* ── COLUMNA IZQUIERDA: Instructores ──────────────────────── */}
            <div className="order-2 lg:order-1 lg:sticky lg:top-[100px] flex flex-col gap-5">

              {/* Encabezado */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color:"rgba(255,122,0,0.65)" }}>
                  Nuestros instructores
                </p>
                <p className="text-sm text-white/50 font-roboto leading-relaxed">
                  Tu horario disponible depende de la agenda de nuestros instructores. Conoce parte del equipo que te acompañará en tu proceso musical.
                </p>
              </div>

              {/* Badge instructores disponibles */}
              <span className="self-start inline-flex items-center gap-2 rounded-xl border border-[#ff7a00]/25 bg-[#ff7a00]/8 px-4 py-2 text-sm font-bold text-[#ff7a00] font-roboto">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {staticInstructors.length} instructores disponibles esta semana
              </span>

              {/* Cards de instructores */}
              {staticInstructors.map((inst) => (
                <div key={inst.id} className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden shadow-xl shadow-black/40">

                  {/* Foto */}
                  {inst.photo && (
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={inst.photo}
                        alt={inst.name}
                        fill
                        className="object-cover object-top"
                        sizes="340px"
                      />
                      <div className="absolute inset-0" style={{ background:"linear-gradient(to top, #141414 10%, rgba(0,0,0,0.25) 60%, transparent 100%)" }} />
                      {/* Badge disponible sobre la foto */}
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/15 px-2.5 py-1 text-[11px] font-bold text-green-400 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"/>
                        Disponible
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-poppins font-extrabold text-white text-base leading-tight">{inst.name}</h3>
                      <p className="text-xs font-semibold mt-0.5" style={{ color:"#ff7a00" }}>{inst.role}</p>
                    </div>

                    <p className="text-xs text-white/50 font-roboto leading-relaxed">{inst.bio}</p>

                    {/* Chips de especialidades */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {inst.specialties.map((s) => (
                        <span key={s}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                          style={{ background:"rgba(255,122,0,0.12)", border:"1px solid rgba(255,122,0,0.22)", color:"#ff7a00" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Nota final */}
              <p className="text-[11px] text-white/30 font-roboto leading-relaxed border-t border-white/8 pt-4">
                Los horarios disponibles se generan automáticamente según la disponibilidad real de nuestros instructores.
              </p>

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
