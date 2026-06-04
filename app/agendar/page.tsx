import type { Metadata } from "next"
import Header from "@/components/layout/Header"
import BookingCalendar from "@/components/sections/BookingCalendar"
import { createAuthServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { studentBookAction } from "@/app/(student)/_actions/student"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Agendar Clase",
  description:
    "Agenda tu clase de música en 4U Studio Academy. Selecciona fecha, instrumento e instructor — Guitarra, Piano, Canto, Batería, Bajo y Producción Musical.",
}

// ─── Sub-components del servidor ─────────────────────────────────────────────

function InstructorInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <div
      className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-black text-white font-poppins"
      style={{ backgroundColor: "#ff7a00" }}
    >
      {initials}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgendarPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  let instructors: { id: string; name: string; notes?: string | null }[] = []
  let activeCourses: { id: string; name: string }[] = []
  let studentId: string | undefined

  if (isLoggedIn && user) {
    const adminClient = createAdminClient()
    const [instrResult, coursesResult, studentResult] = await Promise.all([
      adminClient.from("instructors").select("id, name, notes").eq("status", "active").order("name"),
      adminClient.from("courses").select("id, name").eq("is_active", true).order("name"),
      adminClient.from("students").select("id").eq("user_id", user.id).maybeSingle(),
    ])
    instructors   = (instrResult.data   ?? []) as typeof instructors
    activeCourses = (coursesResult.data  ?? []) as { id: string; name: string }[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentId     = (studentResult.data as any)?.id as string | undefined
  } else {
    // Para usuarios no logueados, cargar instructores para la sección de equipo
    const adminClient = createAdminClient()
    const { data } = await adminClient.from("instructors").select("id, name, notes").eq("status", "active").order("name")
    instructors = (data ?? []) as typeof instructors
  }

  // Instructores para el BookingCalendar (solo id + name)
  const instructorsForCalendar = isLoggedIn
    ? instructors.map(({ id, name }) => ({ id, name }))
    : []

  // Máx 4 para la sección de equipo
  const teamInstructors = instructors.slice(0, 4)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fafafa] px-4 pt-[92px] pb-16">
        <div className="mx-auto max-w-[1180px] space-y-8">

          {/* ══ 1. HERO ══════════════════════════════════════════════════ */}
          <section className="pt-2">
            <h1 className="font-poppins text-3xl sm:text-4xl font-extrabold text-gray-950 leading-tight">
              Agenda tu curso <span style={{ color: "#ff7a00" }}>ideal</span>
            </h1>
            <p className="mt-2 text-gray-500 text-sm sm:text-base max-w-xl">
              Selecciona una fecha y horario disponible para comenzar tu experiencia musical.
            </p>
          </section>

          {/* ══ 2. BENEFICIOS ════════════════════════════════════════════ */}
          <section className="grid sm:grid-cols-3 gap-3">
            {[
              {
                icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
                  </svg>
                ),
                title: "Atención personalizada",
                text: "Instructores especializados.",
              },
              {
                icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="1"/>
                  </svg>
                ),
                title: "Horarios flexibles",
                text: "Agenda según tu disponibilidad.",
              },
              {
                icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                ),
                title: "Clases presenciales",
                text: "Experiencia real en estudio.",
              },
            ].map((b) => (
              <div
                key={b.title}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(255,122,0,0.1)", color: "#ff7a00" }}
                >
                  {b.icon}
                </span>
                <div>
                  <p className="font-poppins font-bold text-gray-950 text-sm">{b.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 font-roboto">{b.text}</p>
                </div>
              </div>
            ))}
          </section>

          {/* ══ 3. CALENDARIO (elemento principal) ══════════════════════ */}
          <section>
            <BookingCalendar
              serverAction={isLoggedIn ? studentBookAction : undefined}
              mode={isLoggedIn ? "student" : "public"}
              isLoggedIn={isLoggedIn}
              instructors={instructorsForCalendar}
              activeCourses={activeCourses}
              studentId={studentId}
            />
          </section>

          {/* ══ 4. EQUIPO DOCENTE ════════════════════════════════════════ */}
          <section className="rounded-2xl border border-gray-200 bg-white px-6 py-7 shadow-sm">
            <div className="mb-6">
              <h2 className="font-poppins text-xl font-extrabold text-gray-950">Nuestros instructores</h2>
              <p className="text-gray-500 text-sm mt-1 font-roboto">
                Tu instructor será asignado según disponibilidad y especialidad.
              </p>
            </div>
            <div className={`grid gap-4 ${teamInstructors.length <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
              {teamInstructors.map((inst) => (
                <div
                  key={inst.id}
                  className="flex flex-col items-center text-center rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-5 gap-3"
                >
                  <InstructorInitials name={inst.name} />
                  <div>
                    <p className="font-poppins font-bold text-gray-900 text-sm">{inst.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5 font-roboto">
                      {inst.notes && !inst.notes.includes("user_id")
                        ? inst.notes
                        : "Instructor certificado"}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold font-roboto"
                    style={{ backgroundColor: "rgba(255,122,0,0.1)", color: "#ff7a00" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    Activo
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ══ 5. INFORMACIÓN DE LA CLASE ══════════════════════════════ */}
          <section className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
            <h2 className="font-poppins text-base font-bold text-gray-900 mb-4">Información de la clase</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  ),
                  label: "Duración",
                  value: "60 min",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  ),
                  label: "Modalidad",
                  value: "Presencial",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  ),
                  label: "Sede",
                  value: "4U Studio Academy",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                    </svg>
                  ),
                  label: "Incluye",
                  value: "Material de apoyo",
                },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 ${i < 3 ? "sm:border-r sm:border-gray-100" : ""}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(255,122,0,0.1)", color: "#ff7a00" }}
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-roboto">{item.label}</p>
                    <p className="text-sm font-bold text-gray-900 font-roboto">{item.value}</p>
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
