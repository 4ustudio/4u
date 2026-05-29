// Panel de administración — próximas fases:
// - Listar citas (appointments) con filtro por status
// - Cambiar status: pending → contacted → scheduled / cancelled
// - Requiere: Supabase Auth + service_role key

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <svg className="h-8 w-8 text-[#ff7a00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold font-poppins">Panel de administración</h1>
      <p className="text-white/50 text-sm font-roboto max-w-xs">
        Esta sección está en desarrollo. Aquí podrás gestionar las citas y leads capturados.
      </p>
    </main>
  )
}
