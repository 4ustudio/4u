'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createInstructorAction } from '../../_actions/instructors'

const initial = { error: undefined as string | undefined, success: undefined as boolean | undefined }

const inputClass = 'w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30'

export default function NewInstructorForm() {
  const router = useRouter()
  const [state, action, isPending] = useActionState(createInstructorAction, initial)

  if (state.success) {
    router.push('/admin/instructors')
    return null
  }

  return (
    <form action={action} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Nombres *</label>
          <input type="text" name="first_name" required disabled={isPending} className={inputClass} placeholder="Carlos" />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Apellidos</label>
          <input type="text" name="last_name" disabled={isPending} className={inputClass} placeholder="Maestro" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Email * <span className="text-white/30">(será el usuario de acceso)</span></label>
          <input type="email" name="email" required disabled={isPending} className={inputClass} placeholder="instructor@4ustudioacademy.com" />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">WhatsApp</label>
          <input type="tel" name="phone" disabled={isPending} className={inputClass} placeholder="3001234567" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1.5">Contraseña * <span className="text-white/30">(mínimo 6 caracteres)</span></label>
        <input type="password" name="password" required minLength={6} disabled={isPending} className={inputClass} placeholder="••••••••" />
      </div>

      <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-3">
        <p className="text-xs text-orange-300">
          Se creará una cuenta de acceso con estas credenciales. El instructor podrá iniciar sesión en <strong>/mi-cuenta</strong> para ver su calendario y clases.
        </p>
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
          {isPending ? 'Creando…' : 'Crear instructor'}
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
