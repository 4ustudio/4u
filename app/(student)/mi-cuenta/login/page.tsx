'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { loginAction } from '../../_actions/student'
import StudentNav from '../../_components/StudentNav'

const inputClass =
  'w-full bg-black/45 border border-white/15 rounded-xl px-5 py-4 text-white text-sm placeholder:text-white/45 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60 focus:border-[#ff7a00]/60 transition-all disabled:opacity-50'

function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, {})
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const linkError = searchParams.get('error')
  const nextPath  = searchParams.get('next') ?? ''

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-black text-white"
      style={{
        backgroundImage: "url('/images/hero/Banner-contactanos.jpg.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/78 to-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7a00]/15 blur-3xl" />
      <StudentNav />
      <div className="relative z-10 flex items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md rounded-3xl border border-white/12 bg-black/55 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#ff7a00]/40 bg-[#ff7a00]/15 text-[#ff7a00]">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white font-poppins">Iniciar sesión</h1>
            <p className="text-sm text-white/65 mt-2 font-roboto">Accede a tu cuenta en 4U Studio Academy</p>
            <p className="text-xs text-white/45 mt-3 font-roboto leading-relaxed">
              Login solo para usuarios inscritos en la academia. Solicita tus credenciales de acceso{' '}
              <a
                href="https://api.whatsapp.com/send/?phone=573170192639&text=Hola%2C%20quiero%20solicitar%20mis%20credenciales%20de%20acceso%20a%204U%20Studio%20Academy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-white/65 hover:text-[#ff7a00] transition-colors"
              >
                aquí
              </a>
              .
            </p>
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
              className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-xl shadow-[#ff7a00]/25 transition-all disabled:opacity-60 font-poppins hover:-translate-y-0.5 hover:brightness-110"
              style={{ backgroundColor: '#ff7a00' }}
            >
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </button>

            <div className="text-center pt-2">
              <a href="/mi-cuenta/recuperar-contrasena" className="block text-xs text-white/55 hover:text-white transition-colors font-roboto">
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
