import type { Metadata } from "next"
import Header from "@/components/layout/Header"
import BookingCalendar from "@/components/sections/BookingCalendar"
import { createAuthServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  studentBookAction,
  getAvailableSlotsAction,
  getCoursesWithAvailabilityAction,
  getDaySlotCountsAction,
} from "@/app/(student)/_actions/student"
import { instructors as staticInstructors } from "@/data/instructors"
import InstructorCard from "./_components/InstructorCard"
import { getHolidayMap } from "@/lib/calendar/colombia-holidays"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Agendar Clase — 4U Studio Academy",
  description:
    "Agenda tu clase de música en 4U Studio Academy. Selecciona fecha, instrumento e instructor — Guitarra, Piano, Canto, Batería, Bajo y Producción Musical.",
}

export default async function AgendarPage({
  searchParams,
}: {
  searchParams: Promise<{ instructor?: string }>;
}) {
  const { instructor: instructorParam } = await searchParams;
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  let activeCourses: { id: string; name: string }[] = []
  let studentId: string | undefined

  const [instrResult, ccResult] = await Promise.all([
    adminClient.from("instructors").select("id, name, notes").eq("status", "active").order("name"),
    adminClient.from("classroom_courses").select("course_id"),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allInstructors = (instrResult.data ?? []) as { id: string; name: string; notes?: string | null }[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowedCourseIds = [...new Set(((ccResult.data ?? []) as any[]).map((r: any) => r.course_id as string))]
  const { data: coursesData } = await adminClient
    .from("courses")
    .select("id, name")
    .in("id", allowedCourseIds)
    .eq("is_active", true)
    .order("name")
  activeCourses = (coursesData ?? []) as { id: string; name: string }[]

  if (user) {
    const { data } = await adminClient.from("students").select("id").eq("user_id", user.id).maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentId = (data as any)?.id as string | undefined
  }

  const instructorsForCalendar = allInstructors.map(({ id, name }) => ({ id, name }))

  // Precarga en servidor la disponibilidad de HOY para que /agendar cargue instantáneo
  // (evita el round-trip cliente→server-action que hacía esperar spinner al abrir el día actual).
  const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date())
  const todayDow = new Date(todayIso + "T12:00:00").getDay()
  let initialSlots: Awaited<ReturnType<typeof getAvailableSlotsAction>> = []
  let initialCourseAvailability: Record<string, boolean> = {}
  if (todayDow !== 0 && todayDow !== 6) {
    try {
      const [slotsRes, availRes] = await Promise.all([
        getAvailableSlotsAction(todayIso),
        getCoursesWithAvailabilityAction(todayIso, activeCourses.map((c) => c.name)),
      ])
      initialSlots = slotsRes
      initialCourseAvailability = availRes
    } catch {
      // silencioso — el cliente recalcula al hacer click en el día
    }
  }

  // Precarga en servidor los "X cupos" del mes actual completo (días hábiles, no festivos, no pasados)
  // para que el calendario no muestre celdas vacías esperando al fetch cliente por cada día.
  const [todayYearStr, todayMonthStr, todayDayStr] = todayIso.split("-")
  const todayYearNum = Number(todayYearStr)
  const todayMonthNum = Number(todayMonthStr)
  const todayDayNum = Number(todayDayStr)
  const daysInMonth = new Date(todayYearNum, todayMonthNum, 0).getDate()
  const holidayMap = getHolidayMap(todayYearNum)

  const eligibleDays: { dateIso: string; day: number }[] = []
  for (let day = todayDayNum; day <= daysInMonth; day++) {
    const dateIso = `${todayYearStr}-${todayMonthStr}-${String(day).padStart(2, "0")}`
    const dow = new Date(todayYearNum, todayMonthNum - 1, day).getDay()
    if (dow === 0 || dow === 6) continue
    if (holidayMap[dateIso]?.[0]) continue
    eligibleDays.push({ dateIso, day })
  }

  const nowBogota = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }))
  const nowMinutes = nowBogota.getHours() * 60 + nowBogota.getMinutes()

  const initialDaySlotCounts: Record<string, number> = {}
  try {
    const otherDays = eligibleDays.map((d) => d.dateIso).filter((d) => d !== todayIso)
    const [otherCounts] = await Promise.all([
      otherDays.length ? getDaySlotCountsAction(otherDays) : Promise.resolve({} as Record<string, number>),
    ])
    Object.assign(initialDaySlotCounts, otherCounts)

    if (eligibleDays.some((d) => d.dateIso === todayIso)) {
      const times = new Set(initialSlots.filter((s) => s.is_available).map((s) => s.slot_time.slice(0, 5)))
      let count = 0
      for (const t of times) {
        const [h, m] = t.split(":").map(Number)
        if (h * 60 + m > nowMinutes) count++
      }
      initialDaySlotCounts[todayIso] = count
    }
  } catch {
    // silencioso — el cliente recalcula al abrir el mes
  }

  // Preselect instructor from query param (slug → name → Supabase UUID)
  const matchedStatic = instructorParam
    ? staticInstructors.find((i) => i.id === instructorParam)
    : null
  const initialInstructorId = matchedStatic
    ? (allInstructors.find((i) => i.name === matchedStatic.name)?.id ?? "")
    : ""

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
                <InstructorCard
                  key={inst.id}
                  id={inst.id}
                  name={inst.name}
                  role={inst.role}
                  bio={inst.bio}
                  specialties={inst.specialties}
                  photo={inst.photo ?? null}
                />
              ))}

              {/* Nota final */}
              <p className="text-[11px] text-white/30 font-roboto leading-relaxed border-t border-white/8 pt-4">
                Los horarios se actualizan según la disponibilidad real de nuestros instructores.
              </p>

            </div>

            {/* ── COLUMNA DERECHA: Calendario + Flujo de reserva ──────── */}
            <div className="order-1 lg:order-2">
              <BookingCalendar
                serverAction={studentBookAction}
                mode="student"
                isLoggedIn={!!user}
                instructors={instructorsForCalendar}
                activeCourses={activeCourses}
                studentId={studentId}
                initialInstructorId={initialInstructorId}
                initialDateIso={todayIso}
                initialSlots={initialSlots}
                initialCourseAvailability={initialCourseAvailability}
                initialDaySlotCounts={initialDaySlotCounts}
              />
            </div>

          </div>
        </div>
      </main>
    </>
  )
}
