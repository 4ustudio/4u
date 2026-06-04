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

export default async function AgendarPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  let instructors: { id: string; name: string }[] = []
  let activeCourses: { id: string; name: string }[] = []
  let studentId: string | undefined

  if (isLoggedIn && user) {
    const adminClient = createAdminClient()

    const [instrResult, coursesResult, studentResult] = await Promise.all([
      adminClient.from("instructors").select("id, name").eq("status","active").order("name"),
      adminClient.from("courses").select("id, name").eq("is_active", true).order("name"),
      adminClient.from("students").select("id").eq("user_id", user.id).maybeSingle(),
    ])

    instructors   = (instrResult.data   ?? []) as { id: string; name: string }[]
    activeCourses = (coursesResult.data  ?? []) as { id: string; name: string }[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentId     = (studentResult.data as any)?.id as string | undefined
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fafafa] px-4 pt-[92px] pb-12">
        <div className="mx-auto max-w-[1180px] space-y-6">
          <div>
            <h1 className="font-poppins text-3xl font-extrabold text-gray-950">Agenda tu clase</h1>
            <p className="mt-1 text-sm text-gray-600">Selecciona una fecha y horario disponible.</p>
          </div>
          <BookingCalendar
            serverAction={isLoggedIn ? studentBookAction : undefined}
            mode={isLoggedIn ? "student" : "public"}
            isLoggedIn={isLoggedIn}
            instructors={instructors}
            activeCourses={activeCourses}
            studentId={studentId}
          />
        </div>
      </main>
    </>
  )
}
