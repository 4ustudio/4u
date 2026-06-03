'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { InstrumentIcon } from './instruments'
import { statusMeta, HISTORY_FILTERS } from './statusMeta'

/* eslint-disable @typescript-eslint/no-explicit-any */

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function HistoryDrawer({ past }: { past: any[] }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const filtered = useMemo(() => {
    const f = HISTORY_FILTERS.find(x => x.id === filter)
    if (!f || !f.keys) return past
    return past.filter(s => f.keys!.includes(statusMeta(s.status).key))
  }, [past, filter])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-[#181818] px-5 py-4 text-sm font-semibold text-white/60 font-poppins hover:bg-white/[0.03] hover:text-white transition-all"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" />
        </svg>
        Ver historial completo
        <span className="text-gray-400 font-normal">({past.length})</span>
      </button>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="h-full w-full max-w-md bg-white border-l border-[#ff7a00]/10 flex flex-col animate-slide-right shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-bold text-gray-900 font-poppins">Historial de clases</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Cerrar">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 shrink-0">
              {HISTORY_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    filter === f.id
                      ? 'border-[#ff7a00]/40 text-[#ff7a00] bg-[#ff7a00]/10'
                      : 'border-gray-200 text-gray-500 bg-stone-100 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10 font-roboto">No hay clases en esta categoría.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filtered.map(s => {
                    const meta = statusMeta(s.status)
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                        <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.hex + '1f', color: meta.hex }}>
                          <InstrumentIcon courseName={s.course?.name} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900 font-poppins font-medium">
                            {s.course?.name ?? '—'} · {s.start_time?.slice(0, 5)}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {fmtDate(s.scheduled_date)} · {s.instructor?.name ?? 'Sin instructor'}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${meta.badgeClass}`}>{meta.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
