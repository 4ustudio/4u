import type { Metadata } from "next"
import PageLayout from "@/components/layout/PageLayout"
import BookingCalendar from "@/components/sections/BookingCalendar"
import { createAuthServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { studentBookAction } from "@/app/(student)/_actions/student"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Agendar Clase",
  description:
    "Agenda tu primera clase de música en 4U Studio Academy. Selecciona fecha, instrumento e instructor — Guitarra, Piano, Canto, Batería, Bajo y Producción Musical.",
}

export default async function AgendarPage() {
  const supabase    = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn  = !!user

  let instructors: { id: string; name: string }[] = []
  let activeCourses: { id: string; name: string }[] = []
  let studentId: string | undefined

  if (isLoggedIn && user) {
    const adminClient = createAdminClient()

    const [instrResult, coursesResult, studentResult] = await Promise.all([
      adminClient
        .from("instructors")
        .select("id, name")
        .eq("status", "active")
        .order("name"),

      adminClient
        .from("courses")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),

      adminClient
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ])

    instructors   = (instrResult.data   ?? []) as { id: string; name: string }[]
    activeCourses = (coursesResult.data  ?? []) as { id: string; name: string }[]
    studentId     = (studentResult.data as any)?.id as string | undefined
  }

  return (
    <PageLayout>
      <section className="relative w-full min-h-screen overflow-hidden">
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,122,0,0.08), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(255,122,0,0.05), transparent 60%)",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/6 blur-3xl rounded-full" aria-hidden="true" />
        <div className="pointer-events-none absolute top-0 -right-40 w-96 h-96 bg-orange-500/4 blur-3xl rounded-full" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <BookingCalendar
            serverAction={isLoggedIn ? studentBookAction : undefined}
            mode={isLoggedIn ? "student" : "public"}
            isLoggedIn={isLoggedIn}
            instructors={instructors}
            activeCourses={activeCourses}
            studentId={studentId}
          />
        </div>
      </section>
    </PageLayout>
  )
}
