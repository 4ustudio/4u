'use client'

import { useActionState, useState, useEffect, useRef } from 'react'
import { setStudentPasswordAction } from '../../../_actions/students'

const inputClass = 'w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30'

interface Props {
  studentId: string
  hasAccount: boolean
  email: string | null
}

export default function PasswordSection({ studentId, hasAccount, email }: Props) {
  const [state, action, isPending] = useActionState(setStudentPasswordAction, {})
  const [showPwd, setShowPwd]       = useState(false)
  const [pwdValue, setPwdValue]     = useState('')
  const [confirmValue, setConfirmValue] = useState('')
  const [lastSetPwd, setLastSetPwd] = useState<string | null>(null)
  // Ref evita stale-closure: siempre tiene el valor más reciente
  const capturedPwd = useRef('')
  const prevSuccess = useRef(false)

  const handlePwdChange = (v: string) => {
    setPwdValue(v)
    capturedPwd.current = v
  }

  useEffect(() => {
    if (state.success && !prevSuccess.current) {
      setLastSetPwd(capturedPwd.current)
      setPwdValue('')
      setConfirmValue('')
      capturedPwd.current = ''
    }
    prevSuccess.current = !!state.success
  }, [state.success])

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

      {/* Estado: sin credenciales asignadas */}
      {!hasAccount && !state.success && (
        <div className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
          <svg className="h-4 w-4 mt-0.5 shrink-0 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <p className="text-xs text-white/50 font-medium">Credenciales de acceso no asignadas</p>
            <p className="text-xs text-white/30 mt-0.5">
              {email
                ? 'Crea una contraseña para que el estudiante pueda ingresar al portal.'
                : 'Agrega un email al estudiante para poder crear su acceso.'}
            </p>
          </div>
        </div>
      )}

      {/* Contraseña asignada exitosamente */}
      {lastSetPwd && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 space-y-2">
          <p className="text-xs text-green-400 font-medium">
            {hasAccount ? 'Contraseña actualizada.' : 'Acceso creado. Comparte estas credenciales con el estudiante:'}
          </p>
          <div className="space-y-1 text-xs font-mono">
            {email && (
              <div className="flex items-center gap-2">
                <span className="text-white/30 w-16 shrink-0">Email:</span>
                <span className="text-white/70">{email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-white/30 w-16 shrink-0">Contraseña:</span>
              <span className="text-white select-all bg-white/5 px-2 py-0.5 rounded">{lastSetPwd}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(lastSetPwd)}
                className="text-white/30 hover:text-white/60 transition-colors"
                title="Copiar"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastSetPwd(null)}
            className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
          >
            Ocultar credenciales
          </button>
        </div>
      )}

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
              value={pwdValue}
              onChange={e => handlePwdChange(e.target.value)}
              required
              minLength={6}
              disabled={isPending || !email}
              className={inputClass + ' pr-10'}
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
          <input
            type={showPwd ? 'text' : 'password'}
            name="confirm"
            value={confirmValue}
            onChange={e => setConfirmValue(e.target.value)}
            required
            minLength={6}
            disabled={isPending || !email}
            className={inputClass}
            placeholder="Repite la contraseña"
          />
        </div>

        {state.error && <p className="text-red-400 text-xs">{state.error}</p>}

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
