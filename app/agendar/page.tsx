import type { Metadata } from "next"
import PageLayout from "@/components/layout/PageLayout"
import BookingCalendar from "@/components/sections/BookingCalendar"

export const metadata: Metadata = {
  title: "Agendar Clase",
  description:
    "Agenda tu primera clase de música en 4U Studio Academy. Selecciona fecha, horario e instructor — Guitarra, Piano, Canto, Batería, Bajo y Producción Musical.",
}

export default function AgendarPage() {
  return (
    <PageLayout>
      <section className="relative w-full min-h-screen overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,122,0,0.08), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(255,122,0,0.05), transparent 60%)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/6 blur-3xl rounded-full" aria-hidden="true" />
        <div className="pointer-events-none absolute top-0 -right-40 w-96 h-96 bg-orange-500/4 blur-3xl rounded-full" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <BookingCalendar />
        </div>
      </section>
    </PageLayout>
  )
}
