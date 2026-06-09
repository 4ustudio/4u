export default async function ConfirmarExpiradoPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const dateLabel = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <svg className="h-8 w-8 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Clase no disponible</h1>
        {dateLabel && (
          <p className="text-sm text-white/50 capitalize">
            La clase del {dateLabel} ya fue cancelada o finalizada.
          </p>
        )}
        <p className="text-xs text-white/30">
          Contacta a la academia si tienes preguntas.
        </p>
      </div>
    </main>
  )
}
