'use client'

import { useActionState } from 'react'
import { generateMonthlyClassesAction } from '../../../_actions/students'

const initial = { error: undefined as string | undefined, generated: undefined as number | undefined, skipped: undefined as number | undefined, errors: undefined as string[] | undefined }

const inputClass = 'w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30 disabled:opacity-50'

interface Props {
  studentId: string
}

export default function GenerateClassesButton({ studentId }: Props) {
  const [state, action, isPending] = useActionState(generateMonthlyClassesAction, initial)
  const now = new Date()

  const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ]

  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white">Generar clases del mes</h2>

      <form action={action} className="space-y-3">
        <input type="hidden" name="student_id" value={studentId} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Mes</label>
            <select name="month" disabled={isPending} className={inputClass + ' appearance-none'} defaultValue={now.getMonth() + 1}>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Año</label>
            <input
              type="number"
              name="year"
              required
              disabled={isPending}
              className={inputClass}
              defaultValue={now.getFullYear()}
              min={2024}
              max={2035}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: '#ff7a00' }}
        >
          {isPending ? 'Generando…' : 'Generar clases'}
        </button>
      </form>

      {state.error && (
        <p className="text-red-400 text-xs">{state.error}</p>
      )}

      {state.generated !== undefined && (
        <div className="space-y-2 pt-1 border-t border-white/10">
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-white/70">Generadas:</span>
              <span className="text-white font-bold">{state.generated}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-white/70">Omitidas:</span>
              <span className="text-white font-bold">{state.skipped}</span>
            </span>
          </div>
          {state.errors && state.errors.length > 0 && (
            <div>
              <p className="text-xs text-red-400/70 mb-1">Errores:</p>
              <ul className="space-y-0.5">
                {state.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-400/50 font-mono">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
