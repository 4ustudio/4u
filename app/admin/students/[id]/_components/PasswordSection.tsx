'use client'

import { useActionState, useState } from 'react'
import { setStudentPasswordAction } from '../../../_actions/students'

const inputClass = 'w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30 pr-10'

interface Props {
  studentId: string
  hasAccount: boolean
  email: string | null
}

export default function PasswordSection({ studentId, hasAccount, email }: Props) {
  const [state, action, isPending] = useActionState(setStudentPasswordAction, {})
  const [showPwd, setShowPwd] = useState(false)

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )

  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Acceso al portal</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${hasAccount
          ? 'bg-green-500/10 text-green-400 border-green-500/20'
          : 'bg-white/5 text-white/40 border-white/10'}`}>
          {hasAccount ? 'Cuenta activa' : 'Sin cuenta'}
        </span>
      </div>

      {!email && (
        <p className="text-xs text-amber-400 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
          El estudiante no tiene email. Agrégalo en los datos para crear su acceso.
        </p>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="student_id" value={studentId} />

        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            {hasAccount ? 'Nueva contraseña' : 'Crear contraseña'}
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              name="password"
              required
              minLength={6}
              disabled={isPending || !email}
              className={inputClass}
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label={showPwd ? 'Ocultar' : 'Ver'}
            >
              <EyeIcon open={showPwd} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Confirmar contraseña</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              name="confirm"
              required
              minLength={6}
              disabled={isPending || !email}
              className={inputClass}
              placeholder="Repite la contraseña"
            />
          </div>
        </div>

        {state.error   && <p className="text-red-400 text-xs">{state.error}</p>}
        {state.success && (
          <p className="text-green-400 text-xs">
            {hasAccount ? 'Contraseña actualizada correctamente.' : 'Cuenta creada. El estudiante ya puede iniciar sesión.'}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !email}
          className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#ff7a00' }}
        >
          {isPending ? 'Guardando…' : hasAccount ? 'Cambiar contraseña' : 'Crear acceso'}
        </button>
      </form>
    </div>
  )
}
