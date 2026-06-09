export default function ConfirmarErrorPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Error al confirmar</h1>
        <p className="text-sm text-white/50">
          No pudimos registrar tu confirmación. Por favor intenta de nuevo o contáctanos por WhatsApp.
        </p>
      </div>
    </main>
  )
}
