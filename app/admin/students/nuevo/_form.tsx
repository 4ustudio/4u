'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStudentAction } from '../../_actions/students'
import type { Lead } from '@/types/admin'

const initial = { error: undefined as string | undefined, success: undefined as boolean | undefined }

const inputClass = 'w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30'

export default function NewStudentForm({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const [state, action, isPending] = useActionState(createStudentAction, initial)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  if (state.success) {
    router.push('/admin/students')
    return null
  }

  const handleLeadSelect = (id: string) => {
    const lead = leads.find((l) => l.id === id) ?? null
    setSelectedLead(lead)
  }

  return (
    <div className="space-y-5">
      {/* Selector de lead */}
      {leads.length > 0 && (
        <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Convertir desde lead</h2>
          <select
            className={inputClass + ' appearance-none'}
            onChange={(e) => handleLeadSelect(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Selecciona un lead para prellenar…</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} — {l.phone} ({l.course})
              </option>
            ))}
          </select>
          {selectedLead && (
            <p className="text-xs text-white/40 mt-2">
              Lead seleccionado: <span className="text-white/70">{selectedLead.name}</span> · {selectedLead.course} · {new Date(selectedLead.created_at).toLocaleDateString('es-CO')}
            </p>
          )}
        </div>
      )}

      {/* Formulario */}
      <form action={action} className="bg-gray-900 border border-white/10 rounded-xl p-5 space-y-4">
        {selectedLead && (
          <input type="hidden" name="lead_id" value={selectedLead.id} />
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Nombre completo *</label>
            <input
              type="text" name="name" required disabled={isPending}
              defaultValue={selectedLead?.name ?? ''}
              className={inputClass}
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">WhatsApp *</label>
            <input
              type="tel" name="phone" required disabled={isPending}
              defaultValue={selectedLead?.phone ?? ''}
              className={inputClass}
              placeholder="3001234567"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Email</label>
          <input
            type="email" name="email" disabled={isPending}
            className={inputClass}
            placeholder="opcional"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Tipo de estudiante</label>
          <select name="student_type" disabled={isPending} className={inputClass + ' appearance-none'}>
            <option value="new">Nuevo (solo 5PM–10PM de L-V)</option>
            <option value="regular">Regular (10AM–10PM de L-V)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Notas internas</label>
          <textarea
            name="notes" rows={3} disabled={isPending}
            defaultValue={selectedLead?.notes ?? ''}
            className={inputClass + ' resize-none'}
            placeholder="Observaciones, instrumento de interés, etc."
          />
        </div>

        {state.error && (
          <p className="text-red-400 text-xs">{state.error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit" disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: '#ff7a00' }}
          >
            {isPending ? 'Guardando…' : 'Crear estudiante'}
          </button>
          <a
            href="/admin/students"
            className="px-5 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}
