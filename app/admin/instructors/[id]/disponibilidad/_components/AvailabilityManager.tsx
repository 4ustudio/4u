'use client'

import { useActionState, useState } from 'react'
import { createAvailabilityAction, updateAvailabilityAction, deleteAvailabilityAction } from '../../../../_actions/instructor-availability'
import type { InstructorAvailability } from '../../../../_actions/instructor-availability'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const inputClass = 'w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30'

type EditingRow = InstructorAvailability | null

interface Props {
  instructorId: string
  availability: InstructorAvailability[]
}

function DeleteButton({ id, instructorId }: { id: string; instructorId: string }) {
  const [state, action, isPending] = useActionState(deleteAvailabilityAction, {})
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="instructor_id" value={instructorId} />
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 transition-colors disabled:opacity-40"
      >
        {isPending ? '…' : 'Eliminar'}
      </button>
      {state.error && <p className="text-red-400 text-xs mt-1">{state.error}</p>}
    </form>
  )
}

function AvailabilityForm({
  instructorId,
  editing,
  onCancel,
}: {
  instructorId: string
  editing: EditingRow
  onCancel?: () => void
}) {
  const action = editing ? updateAvailabilityAction : createAvailabilityAction
  const [state, formAction, isPending] = useActionState(action, {})
  const today = new Date().toISOString().slice(0, 10)

  if (state.success && !editing) {
    // reset handled by revalidate
  }

  return (
    <form action={formAction} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">
        {editing ? 'Editar horario' : 'Agregar horario'}
      </h3>

      {editing && <input type="hidden" name="id" value={editing.id} />}
      <input type="hidden" name="instructor_id" value={instructorId} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Día de la semana *</label>
          <select name="day_of_week" required disabled={isPending} defaultValue={editing?.day_of_week ?? 1} className={inputClass + ' appearance-none'}>
            {DAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Estado *</label>
          <select name="status" disabled={isPending} defaultValue={editing?.status ?? 'available'} className={inputClass + ' appearance-none'}>
            <option value="available">Disponible</option>
            <option value="blocked">Bloqueado</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Hora inicio *</label>
          <input type="time" name="start_time" required disabled={isPending} defaultValue={editing?.start_time?.slice(0, 5) ?? '08:00'} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Hora fin *</label>
          <input type="time" name="end_time" required disabled={isPending} defaultValue={editing?.end_time?.slice(0, 5) ?? '10:00'} className={inputClass} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Válido desde *</label>
          <input type="date" name="valid_from" required disabled={isPending} defaultValue={editing?.valid_from ?? today} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Válido hasta <span className="text-white/25">(opcional)</span></label>
          <input type="date" name="valid_until" disabled={isPending} defaultValue={editing?.valid_until ?? ''} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1.5">Notas <span className="text-white/25">(opcional)</span></label>
        <input type="text" name="notes" disabled={isPending} defaultValue={editing?.notes ?? ''} className={inputClass} placeholder="Ej: vacaciones, disponibilidad temporal…" />
      </div>

      {state.error && <p className="text-red-400 text-xs">{state.error}</p>}
      {state.success && !editing && <p className="text-green-400 text-xs">Horario guardado.</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: '#ff7a00' }}
        >
          {isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar horario'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default function AvailabilityManager({ instructorId, availability }: Props) {
  const [editing, setEditing] = useState<EditingRow>(null)
  const [showForm, setShowForm] = useState(false)

  const statusLabel = (s: string) =>
    s === 'available' ? (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-900/40 text-green-400">Disponible</span>
    ) : (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-900/30 text-red-400">Bloqueado</span>
    )

  return (
    <div className="space-y-4">
      {/* Lista actual */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Horarios actuales</h2>
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: '#ff7a00' }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Agregar
          </button>
        </div>

        {availability.length === 0 ? (
          <p className="text-white/35 text-sm px-5 py-8 text-center">Sin horarios registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-5 py-2.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Día</th>
                <th className="text-left px-5 py-2.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Horario</th>
                <th className="text-left px-5 py-2.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-2.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Vigencia</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {availability.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-medium text-white">{DAYS[row.day_of_week]}</td>
                  <td className="px-5 py-3 text-white/60 font-mono text-xs">
                    {row.start_time.slice(0, 5)} – {row.end_time.slice(0, 5)}
                  </td>
                  <td className="px-5 py-3">{statusLabel(row.status)}</td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {row.valid_from}
                    {row.valid_until ? ` → ${row.valid_until}` : ' →'}
                    {row.notes && <span className="ml-2 text-white/25">({row.notes})</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditing(row); setShowForm(true) }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                      >
                        Editar
                      </button>
                      <DeleteButton id={row.id} instructorId={instructorId} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <AvailabilityForm
          instructorId={instructorId}
          editing={editing}
          onCancel={() => { setEditing(null); setShowForm(false) }}
        />
      )}
    </div>
  )
}
