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

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
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

  const teamInstructors = allInstructors.slice(0, 4)

  const benefits = [
    {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
        </svg>
      ),
      label: "Atención personalizada",
    },
    {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      label: "Horarios flexibles",
    },
    {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: "Clases presenciales en estudio",
    },
    {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
      ),
      label: "Material de apoyo incluido",
    },
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#090909] px-4 pt-[92px] pb-16">
        <div className="mx-auto max-w-[1200px] space-y-6">

          {/* ══ HERO ══════════════════════════════════════════════════════ */}
          <section className="grid sm:grid-cols-[1fr_auto] gap-6 items-center pt-2 pb-2">
            <div>
              <h1 className="font-poppins text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Agenda tu curso <span style={{ color: "#ff7a00" }}>ideal</span>
              </h1>
              <p className="mt-2 text-white/50 text-sm max-w-lg leading-relaxed font-roboto">
                Selecciona la fecha y horario que mejor se adapten a ti.<br className="hidden sm:block" />
                Un instructor especializado será asignado según disponibilidad y especialidad.
              </p>
            </div>
            {/* Benefit chips — solo desktop */}
            <div className="hidden lg:flex flex-col gap-2 shrink-0">
              {[
                { icon: "👤", t: "Atención personalizada", s: "Instructores especializados." },
                { icon: "📅", t: "Horarios flexibles",     s: "Agenda según tu disponibilidad." },
                { icon: "🎸", t: "Clases presenciales",    s: "Experiencia real en estudio." },
              ].map(b => (
                <div key={b.t} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 min-w-[240px]">
                  <span className="text-base shrink-0">{b.icon}</span>
                  <div>
                    <p className="text-white text-xs font-bold font-poppins leading-tight">{b.t}</p>
                    <p className="text-white/40 text-[10px] font-roboto">{b.s}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ MAIN GRID ══════════════════════════════════════════════════ */}
          <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">

            {/* ── COLUMNA IZQUIERDA ─────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Team card */}
              <div className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
                {/* Photo */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src="/images/instructors/Perfil.png"
                    alt="Instructor 4U Studio Academy"
                    fill
                    className="object-cover object-top"
                    sizes="300px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent" />
                  {/* Instructor avatars overlay */}
                  <div className="absolute bottom-4 left-4 flex -space-x-2">
                    {teamInstructors.map((inst) => (
                      <div
                        key={inst.id}
                        className="h-9 w-9 rounded-full border-2 border-[#141414] flex items-center justify-center text-white text-[11px] font-black font-poppins shrink-0"
                        style={{ backgroundColor: "#ff7a00" }}
                        title={inst.name}
                      >
                        {initials(inst.name)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] text-white/40 font-roboto uppercase tracking-widest mb-1">
                      Nuestro equipo docente
                    </p>
                    <h3 className="font-poppins font-extrabold text-white text-base leading-snug">
                      Instructores especializados
                    </h3>
                    <p className="text-white/50 text-sm font-roboto">en música y producción</p>
                  </div>

                  <ul className="space-y-2">
                    {[
                      "Más de 10 años de experiencia",
                      "Enfoque personalizado",
                      "Resultados reales",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-white/70 font-roboto">
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400 font-roboto">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Disponibles hoy
                  </span>

                  <p className="text-white/35 text-xs leading-relaxed font-roboto border-t border-white/8 pt-4">
                    Nuestros instructores son asignados según disponibilidad y especialidad para brindarte la mejor experiencia posible.
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="h-4 w-4 text-[#ff7a00] shrink-0" viewBox="0 0 24 24" fill="#ff7a00" aria-hidden="true">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                  <p className="text-white text-sm font-bold font-poppins">Beneficios de estudiar con nosotros</p>
                </div>
                <ul className="space-y-3">
                  {benefits.map((b) => (
                    <li key={b.label} className="flex items-center gap-3 text-sm text-white/70 font-roboto">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(255,122,0,0.12)", color: "#ff7a00" }}>
                        {b.icon}
                      </span>
                      {b.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile benefit chips */}
              <div className="lg:hidden grid sm:grid-cols-3 gap-2">
                {[
                  { t: "Atención personalizada", s: "Instructores especializados." },
                  { t: "Horarios flexibles",     s: "Agenda según tu disponibilidad." },
                  { t: "Clases presenciales",    s: "Experiencia real en estudio." },
                ].map(b => (
                  <div key={b.t} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-white text-xs font-bold font-poppins">{b.t}</p>
                    <p className="text-white/40 text-[10px] font-roboto mt-0.5">{b.s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── COLUMNA DERECHA: Calendario ───────────────────────────── */}
            <div>
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

          {/* ══ INFORMACIÓN DE LA CLASE ════════════════════════════════════ */}
          <section className="rounded-2xl border border-white/10 bg-[#141414] px-6 py-6">
            <p className="text-[10px] text-white/35 font-roboto uppercase tracking-widest mb-5">Información de la clase</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                {
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  ),
                  label: "Duración",
                  value: "60 min",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  ),
                  label: "Modalidad",
                  value: "Presencial",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  ),
                  label: "Sede",
                  value: "4U Studio Academy",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                    </svg>
                  ),
                  label: "Incluye",
                  value: "Material de apoyo",
                },
              ].map((item, i) => (
                <div key={item.label} className={`flex items-center gap-3 ${i < 3 ? "sm:border-r sm:border-white/8" : ""}`}>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(255,122,0,0.12)", color: "#ff7a00" }}
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider font-roboto">{item.label}</p>
                    <p className="text-sm font-bold text-white font-roboto mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
