'use client'

import { useActionState } from 'react'
import { signInAction } from '../_actions/auth'

const initial = { error: undefined as string | undefined }

export default function AdminLoginPage() {
  const [state, action, isPending] = useActionState(signInAction, initial)

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-2xl font-extrabold text-white font-poppins">
            <span style={{ color: '#ff7a00' }}>4U</span> STUDIO
          </p>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40 mt-1">Panel Admin</p>
        </div>

        <div className="bg-gray-900 border border-white/10 rounded-2xl p-8">
          <h1 className="text-lg font-bold text-white mb-6">Iniciar sesión</h1>

          <form action={action} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                disabled={isPending}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 disabled:opacity-50"
                placeholder="admin@4ustudioacademy.com"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">Contraseña</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                disabled={isPending}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            {state.error && (
              <p className="text-red-400 text-xs">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ff7a00' }}
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar al panel'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
