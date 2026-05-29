'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { registerAction } from '../../_actions/student'

const inputClass =
  'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 transition-all disabled:opacity-50'

export default function RegistroPage() {
  const [state, action, isPending] = useActionState(registerAction, {})

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Image
              src="/images/icons/Recurso 1.png"
              alt="4U Studio Academy"
              width={120}
              height={42}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white font-poppins">Crear cuenta</h1>
          <p className="text-sm text-white/40 mt-1 font-roboto">Accede a tus clases y reservas</p>
        </div>

        <form action={action} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="first_name"
              placeholder="Nombre *"
              autoComplete="given-name"
              required
              disabled={isPending}
              className={inputClass}
            />
            <input
              type="text"
              name="last_name"
              placeholder="Apellido"
              autoComplete="family-name"
              disabled={isPending}
              className={inputClass}
            />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email *"
            autoComplete="email"
            required
            disabled={isPending}
            className={inputClass}
          />
          <input
            type="tel"
            name="phone"
            placeholder="WhatsApp * Ej: 3001234567"
            autoComplete="tel"
            required
            disabled={isPending}
            className={inputClass}
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña * (mínimo 6 caracteres)"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={isPending}
            className={inputClass}
          />

          {state.error && (
            <p className="text-red-400 text-sm font-roboto text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-60 font-poppins hover:brightness-110 mt-1"
            style={{ backgroundColor: '#ff7a00' }}
          >
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-white/40 font-roboto">¿Ya tienes cuenta? </span>
            <a
              href="/mi-cuenta/login"
              className="text-xs text-[#ff7a00] hover:brightness-110 transition-all font-roboto font-medium"
            >
              Inicia sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
