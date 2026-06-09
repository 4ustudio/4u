'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInstructorAction } from '../../../_actions/instructors'

const inputClass = 'w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30'
const initial = { error: undefined as string | undefined, success: undefined as boolean | undefined }

interface Props {
  instructor: { id: string; name: string; email: string; phone: string | null; status: string }
}

export default function EditInstructorForm({ instructor }: Props) {
  const router = useRouter()
  const [state, action, isPending] = useActionState(updateInstructorAction, initial)

  if (state.success) {
    router.push('/admin/instructors')
    return null
  }

  const [firstName, ...rest] = instructor.name.split(' ')
  const lastName = rest.join(' ')

  return (
    <form action={action} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
      <input type="hidden" name="id" value={instructor.id} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Nombres *</label>
          <input type="text" name="first_name" required disabled={isPending} defaultValue={firstName} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Apellidos</label>
          <input type="text" name="last_name" disabled={isPending} defaultValue={lastName} className={inputClass} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Email</label>
          <input type="email" disabled value={instructor.email} className={`${inputClass} opacity-50 cursor-not-allowed`} />
          <p className="text-xs text-white/30 mt-1">El email no se puede cambiar.</p>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">WhatsApp</label>
          <input type="tel" name="phone" disabled={isPending} defaultValue={instructor.phone ?? ''} className={inputClass} placeholder="3001234567" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Estado</label>
          <select name="status" disabled={isPending} defaultValue={instructor.status} className={inputClass}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Nueva contraseña <span className="text-white/30">(dejar vacío para no cambiar)</span></label>
          <input type="password" name="password" minLength={6} disabled={isPending} className={inputClass} placeholder="••••••••" />
        </div>
      </div>

      {state.error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit" disabled={isPending}
          className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: '#ff7a00' }}
        >
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <a
          href="/admin/instructors"
          className="px-5 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
