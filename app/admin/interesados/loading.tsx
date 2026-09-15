function CardSkeleton() {
  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 rounded bg-white/10 animate-pulse" />
          <div className="h-3 w-1/4 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded-full bg-white/[0.06] animate-pulse" />
      </div>
      <div className="h-8 w-full rounded-lg bg-white/[0.04] animate-pulse" />
    </div>
  )
}

export default function InteresadosLoading() {
  return (
    <div className="space-y-5 w-full">
      <div className="space-y-2">
        <div className="h-6 w-56 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-40 rounded bg-white/[0.06] animate-pulse" />
      </div>
      <div className="h-10 w-full max-w-sm rounded-lg bg-white/[0.05] animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  )
}
