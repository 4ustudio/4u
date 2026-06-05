'use client'

import { useState, useTransition } from 'react'
import { runRetentionPreviewAction, type RetentionPreview } from '../../_actions/retention'

export default function RetentionPreviewPanel() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<RetentionPreview | null>(null)

  return (
    <section className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Simulación del job diario</h2>
          <p className="mt-1 text-xs text-white/45">
            Preview sin modificar datos: muestra estados, alertas, tareas y campañas preparadas.
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => {
            setError(null)
            const result = await runRetentionPreviewAction()
            if (result.error) setError(result.error)
            setPreview(result.preview ?? null)
          })}
          className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {pending ? 'Simulando...' : 'Ejecutar dry run'}
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

      {preview && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <PreviewKpi label="Revisados" value={preview.studentsReviewed} />
            <PreviewKpi label="Cambios" value={preview.summary.statusChanges} />
            <PreviewKpi label="Alertas" value={preview.summary.alerts} />
            <PreviewKpi label="Tareas" value={preview.summary.tasks} />
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white/45">Cambios previstos</p>
            </div>
            <div className="max-h-72 overflow-auto divide-y divide-white/5">
              {preview.statusChanges.length === 0 ? (
                <p className="px-4 py-4 text-xs text-white/35">No hay cambios de estado en esta simulación.</p>
              ) : preview.statusChanges.slice(0, 12).map((change) => (
                <div key={`${change.student_id}-${change.to}`} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[1fr_120px_90px_80px]">
                  <span className="font-semibold text-white">{change.name}</span>
                  <span className="text-white/45">{change.from ?? 'sin estado'} → <b className="text-orange-300">{change.to}</b></span>
                  <span className="text-white/45">{change.daysSinceActivity} dias</span>
                  <span className="text-green-300">{change.retentionScore}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function PreviewKpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  )
}
