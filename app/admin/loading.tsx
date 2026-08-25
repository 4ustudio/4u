function Kpi() {
  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 space-y-2">
      <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
      <div className="h-6 w-14 rounded bg-white/10 animate-pulse" />
    </div>
  )
}

export default function AdminLoading() {
  return (
    <div className="space-y-5 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi /><Kpi /><Kpi /><Kpi />
      </div>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-white/[0.05] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
