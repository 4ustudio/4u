'use client'

import React, { useState, useTransition } from 'react'
import type { AutomationJob, AutomationJobStatus, AutomationCategory } from '@/app/admin/_actions/automations'
import { getAutomationJobs } from '@/app/admin/_actions/automations'
import { JOB_CATEGORY } from './constants'

const STATUS_LABEL: Record<AutomationJobStatus, string> = {
  pending:    'Pendiente',
  processing: 'Procesando',
  completed:  'Completado',
  failed:     'Fallido',
}

const STATUS_COLOR: Record<AutomationJobStatus, string> = {
  pending:    'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed:  'bg-green-500/15 text-green-400 border-green-500/30',
  failed:     'bg-red-500/15 text-red-400 border-red-500/30',
}

const CATEGORY_LABEL: Record<AutomationCategory | 'all', string> = {
  all:       'Todos',
  clases:    'Clases',
  pagos:     'Pagos',
  retencion: 'Retención',
  sistema:   'Sistema',
}

const TYPE_LABEL: Record<string, string> = {
  class_reminder_24h:   'Recordatorio 24h',
  class_reminder_2h:    'Recordatorio 2h',
  payment_due_tomorrow: 'Pago vence mañana',
  payment_overdue_3d:   'Pago vencido 3d',
  payment_overdue_7d:   'Pago vencido 7d',
  attendance_risk:      'Riesgo asistencia',
  low_attendance_risk:  'Asistencia baja',
  high_risk_student:    'Estudiante alto riesgo',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function MetricCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-5">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
    </div>
  )
}

interface Props {
  initialJobs: AutomationJob[]
  metrics: {
    pending: number
    processing: number
    completed: number
    failed: number
    total: number
    avg_processing_ms: number | null
  }
}

export default function AutomatizacionesClient({ initialJobs, metrics }: Props) {
  const [jobs, setJobs] = useState(initialJobs)
  const [statusFilter, setStatusFilter] = useState<AutomationJobStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<AutomationCategory | 'all'>('all')
  const [isPending, startTransition] = useTransition()
  const [selectedJob, setSelectedJob] = useState<AutomationJob | null>(null)

  function applyFilter(status: AutomationJobStatus | 'all', category: AutomationCategory | 'all') {
    setStatusFilter(status)
    setCategoryFilter(category)
    startTransition(async () => {
      const result = await getAutomationJobs(status, category, 200)
      setJobs(result)
    })
  }

  const filtered = jobs

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Automatizaciones</h1>
          <p className="text-sm text-white/50 mt-0.5">Motor de automatizaciones operativas v1.7</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Pendientes"  value={metrics.pending}   />
        <MetricCard label="Ejecutados"  value={metrics.completed} />
        <MetricCard label="Fallidos"    value={metrics.failed}    />
        <MetricCard
          label="Tiempo promedio"
          value={metrics.avg_processing_ms ? `${(metrics.avg_processing_ms / 1000).toFixed(1)}s` : '—'}
          sub="hoy"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {/* Status */}
        {(['all', 'pending', 'completed', 'failed'] as const).map(s => (
          <button
            key={s}
            onClick={() => applyFilter(s, categoryFilter)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {s === 'all' ? 'Todos estados' : STATUS_LABEL[s]}
          </button>
        ))}

        <span className="w-px h-5 bg-white/10 self-center mx-1" />

        {/* Categoría */}
        {(['all', 'clases', 'pagos', 'retencion'] as const).map(c => (
          <button
            key={c}
            onClick={() => applyFilter(statusFilter, c)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              categoryFilter === c
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        {isPending && (
          <div className="px-5 py-2 bg-orange-500/10 border-b border-orange-500/20 text-xs text-orange-400">
            Actualizando...
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-14 text-center text-white/30 text-sm">
            Sin automatizaciones con los filtros seleccionados
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium hidden sm:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium hidden md:table-cell">Creado</th>
                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium hidden lg:table-cell">Procesado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(job => (
                <tr
                  key={job.id}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-white/90 font-medium">
                      {TYPE_LABEL[job.type] ?? job.type}
                    </span>
                    {job.error && (
                      <p className="text-xs text-red-400 mt-0.5 truncate max-w-[180px]">{job.error}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-white/50 capitalize">
                      {CATEGORY_LABEL[JOB_CATEGORY[job.type]] ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${STATUS_COLOR[job.status]}`}>
                      {STATUS_LABEL[job.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-white/40 text-xs">
                    {formatDate(job.created_at)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-white/40 text-xs">
                    {job.processed_at ? formatDate(job.processed_at) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                      className="text-xs text-white/30 hover:text-white/70 transition-colors"
                    >
                      {selectedJob?.id === job.id ? 'Cerrar' : 'Ver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payload drawer */}
      {selectedJob && (
        <div className="rounded-xl border border-white/8 bg-white/3 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">
              Payload — {TYPE_LABEL[selectedJob.type] ?? selectedJob.type}
            </h3>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-white/30 hover:text-white/70 text-xs"
            >
              Cerrar
            </button>
          </div>
          <pre className="text-xs text-white/60 overflow-auto max-h-60 bg-black/30 rounded-lg p-4">
            {JSON.stringify(selectedJob.payload, null, 2)}
          </pre>
          {selectedJob.error && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{selectedJob.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Conteo */}
      <p className="text-xs text-white/30 text-right">
        {filtered.length} automatizaciones · Total: {metrics.total}
      </p>
    </div>
  )
}
