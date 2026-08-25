function Card({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-3">
      <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 w-full rounded bg-white/[0.06] animate-pulse" />
      ))}
    </div>
  )
}

export default function StudentDetailLoading() {
  return (
    <div className="space-y-5 w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-white/10 animate-pulse" />
          <div className="h-3 w-32 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <Card lines={4} />
          <Card lines={3} />
          <Card lines={5} />
        </div>
        <div className="space-y-4">
          <Card lines={2} />
          <Card lines={4} />
          <Card lines={2} />
        </div>
      </div>
    </div>
  )
}
