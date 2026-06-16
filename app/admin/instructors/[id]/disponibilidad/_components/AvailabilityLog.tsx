'use client'

import { useState } from 'react'
import type { AvailabilityLog as LogEntry } from '../../../../_actions/instructor-availability'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const ACTION_META: Record<string, { label: string; icon: string; cls: string }> = {
  created:   { label: 'Agregado',    icon: 'plus',   cls: 'bg-green-900/30 text-green-400' },
  updated:   { label: 'Modificado',  icon: 'edit',   cls: 'bg-blue-900/30 text-blue-400' },
  deleted:   { label: 'Eliminado',   icon: 'trash',  cls: 'bg-red-900/30 text-red-400' },
  blocked:   { label: 'Bloqueado',   icon: 'lock',   cls: 'bg-yellow-900/30 text-yellow-400' },
  unblocked: { label: 'Desbloqueado', icon: 'unlock', cls: 'bg-gray-700/30 text-gray-400' },
  extended:  { label: 'Ampliado',    icon: 'expand', cls: 'bg-purple-900/30 text-purple-400' },
}

export default function AvailabilityLog({ log }: { log: LogEntry[] }) {
  const [view, setView] = useState<'list' | 'timeline'>('timeline')

  if (log.length === 0) return null

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white">Historial de cambios</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setView('timeline')}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              view === 'timeline' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setView('list')}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              view === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {view === 'timeline' ? (
        <TimelineView log={log} />
      ) : (
        <ListView log={log} />
      )}
    </div>
  )
}

/* ── Timeline ───────────────────────────────────────────────────── */
function TimelineView({ log }: { log: LogEntry[] }) {
  return (
    <div className="relative px-5 py-4">
      <div className="absolute left-8 top-0 bottom-0 w-px bg-white/10" />
      <div className="space-y-0">
        {log.map((entry, i) => {
          const meta = ACTION_META[entry.action] ?? { label: entry.action, icon: 'circle', cls: 'bg-white/10 text-white/50' }
          const isFirst = i === 0

          return (
            <div key={entry.id} className="relative pl-10 pb-5 last:pb-0">
              <div className={`absolute left-6 top-1.5 w-3 h-3 rounded-full ring-4 ring-[#0f0f0f] ${
                isFirst ? 'bg-[#ff7a00]' : 'bg-white/20'
              }`} />
              <div className={`rounded-lg border p-3 ${isFirst ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${meta.cls}`}>
                    {meta.label}
                  </span>
                  <time className="text-xs text-white/30">
                    {new Date(entry.changed_at).toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </time>
                  {entry.changed_by && entry.changed_by !== 'admin' && (
                    <span className="text-xs text-white/40">{entry.changed_by}</span>
                  )}
                </div>
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
                </p>
                {entry.notes && <p className="text-xs text-white/30 mt-0.5">{entry.notes}</p>}
                {entry.blocked_date && (
                  <p className="text-xs text-white/30 mt-0.5">
                    Fecha: {new Date(entry.blocked_date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    {entry.block_reason && <span className="ml-1 text-yellow-400">· {entry.block_reason}</span>}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Lista simple ───────────────────────────────────────────────── */
function ListView({ log }: { log: LogEntry[] }) {
  return (
    <div className="divide-y divide-white/5">
      {log.map((entry) => {
        const meta = ACTION_META[entry.action] ?? { label: entry.action, icon: 'circle', cls: 'bg-white/10 text-white/50' }
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
              {entry.changed_by && entry.changed_by !== 'admin' && (
                <p className="text-xs text-white/20 mt-0.5">{entry.changed_by}</p>
              )}
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
  )
}
