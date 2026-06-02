'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { loginAction } from '../../_actions/student'
import StudentNav from '../../_components/StudentNav'

const inputClass =
  'w-full bg-white/[0.06] border border-white/10 rounded-xl px-5 py-4 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 transition-all disabled:opacity-50'

function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, {})
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const linkError = searchParams.get('error')
  const nextPath  = searchParams.get('next') ?? ''

  return (
    <div className="min-h-screen bg-black text-white">
      <StudentNav />
      <div className="flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white font-poppins">Iniciar sesión</h1>
            <p className="text-sm text-white/40 mt-1 font-roboto">Accede a tu cuenta en 4U Studio Academy</p>
          </div>

          {linkError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-roboto text-center">
              El link de acceso expiró. Solicita uno nuevo al equipo de 4U Studio.
            </div>
          )}

          <form action={action} className="space-y-4">
            {nextPath && <input type="hidden" name="next" value={nextPath} />}
            <input type="email" name="email" placeholder="Email" autoComplete="email" required disabled={isPending} className={inputClass} />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Contraseña"
                autoComplete="current-password"
                required
                disabled={isPending}
                className={inputClass + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {state.error && (
              <p className="text-red-400 text-sm font-roboto text-center">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all disabled:opacity-60 font-poppins hover:brightness-110"
              style={{ backgroundColor: '#ff7a00' }}
            >
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </button>

            <div className="text-center pt-2">
              <a href="/mi-cuenta/recuperar-contrasena" className="block text-xs text-white/30 hover:text-white/60 transition-colors font-roboto">
                Olvidé mi contraseña
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
