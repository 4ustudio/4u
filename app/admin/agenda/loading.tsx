export default function AgendaLoading() {
  return (
    <div className="space-y-5 w-full">
      <div className="h-9 w-64 rounded-lg bg-white/[0.05] animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-3 space-y-2 min-h-[220px]">
            <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-12 rounded-lg bg-white/[0.06] animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
