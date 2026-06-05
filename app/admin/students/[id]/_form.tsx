'use client'

import { useActionState } from 'react'
import { updateStudentAction } from '../../_actions/students'
import type { Student } from '@/types/admin'

const initial = { error: undefined as string | undefined, success: undefined as boolean | undefined }

const inputClass = 'w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30'

export default function StudentEditForm({ student }: { student: Student & { plain_password?: string | null } }) {
  const [state, action, isPending] = useActionState(updateStudentAction, initial)

  return (
    <form action={action} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white">Datos del estudiante</h2>
      <input type="hidden" name="id" value={student.id} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Nombres *</label>
          <input type="text" name="first_name" required disabled={isPending} defaultValue={student.first_name ?? ''} className={inputClass} placeholder="Juan" />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Apellidos *</label>
          <input type="text" name="last_name" required disabled={isPending} defaultValue={student.last_name ?? ''} className={inputClass} placeholder="Pérez" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">WhatsApp *</label>
          <input type="tel" name="phone" required disabled={isPending} defaultValue={student.phone} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Email</label>
          <input type="email" name="email" disabled={isPending} defaultValue={student.email ?? ''} className={inputClass} placeholder="opcional" />
        </div>
      </div>

      {/* Contraseña actual (solo lectura) */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">Contraseña del portal</label>
        {student.plain_password ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={student.plain_password}
              className={inputClass + ' font-mono select-all cursor-text'}
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(student.plain_password!)}
              className="shrink-0 text-white/30 hover:text-white/70 transition-colors"
              title="Copiar contraseña"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/8 bg-white/[0.02]">
            <svg className="h-3.5 w-3.5 text-white/25 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span className="text-xs text-white/35 italic">Usuario sin contraseña asignada</span>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Dirección</label>
          <input type="text" name="address" disabled={isPending} defaultValue={student.address ?? ''} className={inputClass} placeholder="opcional" />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Ciudad</label>
          <input type="text" name="city" disabled={isPending} defaultValue={student.city ?? ''} className={inputClass} placeholder="opcional" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Fecha de nacimiento</label>
          <input type="date" name="birth_date" disabled={isPending} defaultValue={student.birth_date ?? ''} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Profesión / Ocupación</label>
          <input type="text" name="profession" disabled={isPending} defaultValue={student.profession ?? ''} className={inputClass} placeholder="opcional" />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Género musical favorito</label>
          <input type="text" name="music_genre" disabled={isPending} defaultValue={student.music_genre ?? ''} className={inputClass} placeholder="opcional" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Tipo de documento</label>
          <select name="document_type" disabled={isPending} defaultValue={student.document_type ?? ''} className={inputClass + ' appearance-none'}>
            <option value="">Seleccionar…</option>
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="TI">Tarjeta de Identidad</option>
            <option value="NIT">NIT</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Número de documento</label>
          <input type="text" name="document_number" disabled={isPending} defaultValue={student.document_number ?? ''} className={inputClass} placeholder="opcional" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Estado operativo</label>
          <select name="status" disabled={isPending} defaultValue={student.status} className={inputClass + ' appearance-none'}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Tipo</label>
          <select name="student_type" disabled={isPending} defaultValue={student.student_type} className={inputClass + ' appearance-none'}>
            <option value="new">Nuevo (solo 5PM–10PM)</option>
            <option value="regular">Regular (10AM–10PM)</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Estado de retención</label>
          <select name="student_status" disabled={isPending} defaultValue={student.student_status ?? 'activo'} className={inputClass + ' appearance-none'}>
            <option value="lead">Lead</option>
            <option value="matriculado">Matriculado</option>
            <option value="activo">Activo</option>
            <option value="riesgo">Riesgo</option>
            <option value="inactivo">Inactivo</option>
            <option value="exalumno">Exalumno</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Alumno desde</label>
          <input type="date" name="student_since" disabled={isPending} defaultValue={(student.student_since ?? student.enrolled_at ?? '').slice(0, 10)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Próximo pago</label>
          <input type="date" name="next_payment_due_at" disabled={isPending} defaultValue={(student.next_payment_due_at ?? '').slice(0, 10)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Score retención</label>
          <input type="number" name="retention_score" min={0} max={100} disabled={isPending} defaultValue={student.retention_score ?? 100} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1.5">Notas internas</label>
        <textarea name="notes" rows={3} disabled={isPending} defaultValue={student.notes ?? ''} className={inputClass + ' resize-none'} />
      </div>

      {state.error   && <p className="text-red-400 text-xs">{state.error}</p>}
      {state.success && <p className="text-green-400 text-xs">Cambios guardados.</p>}

      <button
        type="submit" disabled={isPending}
        className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
        style={{ backgroundColor: '#ff7a00' }}
      >
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
