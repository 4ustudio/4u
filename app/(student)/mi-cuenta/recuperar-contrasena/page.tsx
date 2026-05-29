'use client'

import { useActionState } from 'react'
import { resetPasswordAction } from '../../_actions/student'
import StudentNav from '../../_components/StudentNav'

const inputClass =
  'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 transition-all disabled:opacity-50'

export default function RecuperarContrasenaPage() {
  const [state, action, isPending] = useActionState(resetPasswordAction, {})

  if (state.success) {
    return (
      <div className="min-h-screen bg-black text-white">
        <StudentNav />
        <div className="flex items-center justify-center px-4 pt-24 pb-12">
          <div className="w-full max-w-sm text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30 mx-auto">
              <svg className="h-8 w-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white font-poppins">Revisa tu email</h2>
            <p className="text-sm text-white/50 font-roboto leading-relaxed">
              Si tu email está registrado, recibirás un link para restablecer tu contraseña.
            </p>
            <a href="/mi-cuenta/login" className="inline-block text-sm text-white/40 hover:text-white transition-colors font-roboto mt-4">
              ← Volver al login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <StudentNav />
      <div className="flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white font-poppins">Recuperar contraseña</h1>
            <p className="text-sm text-white/40 mt-1 font-roboto">Te enviaremos un link a tu email</p>
          </div>

          <form action={action} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Tu email registrado"
              autoComplete="email"
              required
              disabled={isPending}
              className={inputClass}
            />

            {state.error && (
              <p className="text-red-400 text-sm font-roboto text-center">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-60 font-poppins hover:brightness-110"
              style={{ backgroundColor: '#ff7a00' }}
            >
              {isPending ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>

            <div className="text-center pt-2">
              <a href="/mi-cuenta/login" className="text-xs text-white/40 hover:text-white/70 transition-colors font-roboto">
                ← Volver al login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
