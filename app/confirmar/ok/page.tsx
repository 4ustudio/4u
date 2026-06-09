export default async function ConfirmarOkPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; time?: string; already?: string }>
}) {
  const { date, time, already } = await searchParams

  const dateLabel = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg className="h-8 w-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">
          {already ? '¡Ya estabas confirmado!' : '¡Asistencia confirmada!'}
        </h1>
        {dateLabel && time && (
          <p className="text-sm text-white/50 capitalize">
            {dateLabel} a las {time} hs
          </p>
        )}
        <p className="text-xs text-white/30">
          Nos vemos pronto en 4U Studio Academy.
        </p>
      </div>
    </main>
  )
}
