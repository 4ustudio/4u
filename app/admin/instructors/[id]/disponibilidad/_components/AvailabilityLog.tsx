import type { AvailabilityLog as LogEntry } from '../../../../_actions/instructor-availability'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  created: { label: 'Agregado',    cls: 'bg-green-900/30 text-green-400' },
  updated: { label: 'Modificado',  cls: 'bg-blue-900/30 text-blue-400' },
  deleted: { label: 'Eliminado',   cls: 'bg-red-900/30 text-red-400' },
  blocked: { label: 'Bloqueado',   cls: 'bg-yellow-900/30 text-yellow-400' },
}

export default function AvailabilityLog({ log }: { log: LogEntry[] }) {
  if (log.length === 0) return null

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white">Historial de cambios</h2>
      </div>
      <div className="divide-y divide-white/5">
        {log.map((entry) => {
          const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, cls: 'bg-white/10 text-white/50' }
          return (
            <div key={entry.id} className="px-5 py-3 flex items-start gap-4">
              <span className={`mt-0.5 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${meta.cls}`}>
                {meta.label}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/70">
                  {entry.day_of_week != null ? DAYS[entry.day_of_week] : '—'}
                  {entry.start_time && entry.end_time && (
                    <span className="ml-2 font-mono text-xs text-white/40">
                      {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                    </span>
                  )}
                  {entry.status && (
                    <span className="ml-2 text-xs text-white/30">
                      ({entry.status === 'available' ? 'disponible' : 'bloqueado'})
                    </span>
                  )}
                  {entry.valid_from && (
                    <span className="ml-2 text-xs text-white/25">desde {entry.valid_from}</span>
                  )}
                </p>
                {entry.notes && <p className="text-xs text-white/30 mt-0.5">{entry.notes}</p>}
              </div>
              <time className="shrink-0 text-xs text-white/25">
                {new Date(entry.changed_at).toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </time>
            </div>
          )
        })}
      </div>
    </div>
  )
}
