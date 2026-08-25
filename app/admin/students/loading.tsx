function Kpi() {
  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 space-y-2">
      <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
      <div className="h-6 w-14 rounded bg-white/10 animate-pulse" />
    </div>
  )
}

export default function StudentsLoading() {
  return (
    <div className="space-y-5 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi /><Kpi /><Kpi /><Kpi /><Kpi />
      </div>
      <div className="h-10 w-full max-w-sm rounded-lg bg-white/[0.05] animate-pulse" />
      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.06] last:border-0">
            <div className="h-9 w-9 rounded-full bg-white/10 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-white/10 animate-pulse" />
              <div className="h-2.5 w-1/4 rounded bg-white/[0.06] animate-pulse" />
            </div>
            <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
