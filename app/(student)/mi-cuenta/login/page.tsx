'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { loginAction } from '../../_actions/student'
import StudentNav from '../../_components/StudentNav'

const inputClass =
  'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 transition-all disabled:opacity-50'

function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, {})
  const searchParams = useSearchParams()
  const linkError = searchParams.get('error')

  return (
    <div className="min-h-screen bg-black text-white">
      <StudentNav />
      <div className="flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white font-poppins">Portal Estudiante</h1>
            <p className="text-sm text-white/40 mt-1 font-roboto">Accede a tus clases y reservas</p>
          </div>

          {linkError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-roboto text-center">
              El link de acceso expiró. Solicita uno nuevo al equipo de 4U Studio.
            </div>
          )}

          <form action={action} className="space-y-4">
            <input type="email" name="email" placeholder="Email" autoComplete="email" required disabled={isPending} className={inputClass} />
            <input type="password" name="password" placeholder="Contraseña" autoComplete="current-password" required disabled={isPending} className={inputClass} />

            {state.error && (
              <p className="text-red-400 text-sm font-roboto text-center">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-60 font-poppins hover:brightness-110"
              style={{ backgroundColor: '#ff7a00' }}
            >
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </button>

            <div className="text-center pt-2 space-y-2">
              <div>
                <span className="text-xs text-white/40 font-roboto">¿No tienes cuenta? </span>
                <a href="/mi-cuenta/registro" className="text-xs text-[#ff7a00] hover:brightness-110 transition-all font-roboto font-medium">
                  Crear cuenta
                </a>
              </div>
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
