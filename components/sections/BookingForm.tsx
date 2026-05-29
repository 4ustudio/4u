'use client'

import { useActionState } from 'react'
import { createAppointment } from '@/app/agendar/actions'
import { validateBooking } from '@/lib/validations/booking'
import type { BookingFormState } from '@/types/booking'

const WA_PHONE = '573107639163'

const COURSES = [
  { value: '', label: 'Selecciona un curso' },
  { value: 'Guitarra', label: 'Guitarra' },
  { value: 'Piano', label: 'Piano' },
  { value: 'Canto', label: 'Canto' },
  { value: 'Batería', label: 'Batería' },
  { value: 'Bajo', label: 'Bajo' },
  { value: 'Producción Musical', label: 'Producción Musical' },
  { value: 'Kids & Teens', label: 'Kids & Teens' },
  { value: 'Otro', label: 'Otro' },
]

const initialState: BookingFormState = { status: 'idle' }

function buildWALink(name: string, course: string) {
  const msg = `Hola! Acabo de solicitar una clase de ${course} en 4U Studio Academy. Mi nombre es ${name}. Me gustaría hablar con alguien del equipo.`
  return `https://api.whatsapp.com/send/?phone=${WA_PHONE}&text=${encodeURIComponent(msg)}`
}

export default function BookingForm() {
  const [state, formAction, isPending] = useActionState(createAppointment, initialState)

  if (state.status === 'success') {
    const waLink = buildWALink(state.submittedName ?? '', state.submittedCourse ?? '')
    return (
      <div className="flex flex-col items-center text-center py-8 px-4 gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#10b981]/15 ring-1 ring-[#10b981]/30">
          <svg className="h-10 w-10 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-white font-poppins">
            ¡Solicitud recibida!
          </h3>
          <p className="text-white/65 text-base leading-relaxed font-roboto max-w-sm">
            Guardamos tu solicitud. Nuestro equipo te contactará pronto.<br />
            Para respuesta inmediata, escríbenos ahora por WhatsApp.
          </p>
        </div>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-full bg-[#25D366] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-[#25D366]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#25D366]/40 font-poppins"
        >
          <svg className="h-5 w-5 fill-white flex-shrink-0" viewBox="0 0 448 512" aria-hidden="true">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
          </svg>
          Continuar por WhatsApp
        </a>

        <p className="text-white/30 text-xs font-roboto">
          También puedes cerrar esta ventana. Te escribiremos al número que dejaste.
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 focus:border-[#ff7a00]/30 transition-all duration-200 disabled:opacity-50'

  const fieldError = (field: 'name' | 'phone' | 'course') =>
    state.status === 'error' && state.errors?.[field]

  return (
    <form action={formAction} className="space-y-4" noValidate>

      {/* Nombre */}
      <div className="space-y-1.5">
        <input
          type="text"
          name="name"
          placeholder="Nombre completo *"
          autoComplete="name"
          disabled={isPending}
          className={inputClass + (fieldError('name') ? ' border-red-500/60 focus:ring-red-500/40' : '')}
          aria-describedby={fieldError('name') ? 'error-name' : undefined}
        />
        {fieldError('name') && (
          <p id="error-name" className="text-red-400 text-xs pl-1 font-roboto">{state.errors!.name}</p>
        )}
      </div>

      {/* WhatsApp */}
      <div className="space-y-1.5">
        <input
          type="tel"
          name="phone"
          placeholder="WhatsApp *  Ej: 3001234567"
          autoComplete="tel"
          disabled={isPending}
          className={inputClass + (fieldError('phone') ? ' border-red-500/60 focus:ring-red-500/40' : '')}
          aria-describedby={fieldError('phone') ? 'error-phone' : undefined}
        />
        {fieldError('phone') && (
          <p id="error-phone" className="text-red-400 text-xs pl-1 font-roboto">{state.errors!.phone}</p>
        )}
      </div>

      {/* Curso */}
      <div className="space-y-1.5">
        <div className="relative">
          <select
            name="course"
            defaultValue=""
            disabled={isPending}
            className={inputClass + ' appearance-none pr-10' + (fieldError('course') ? ' border-red-500/60 focus:ring-red-500/40' : '')}
            aria-describedby={fieldError('course') ? 'error-course' : undefined}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff40'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
            }}
          >
            {COURSES.map((c) => (
              <option key={c.value} value={c.value} className="bg-stone-900 text-white">
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {fieldError('course') && (
          <p id="error-course" className="text-red-400 text-xs pl-1 font-roboto">{state.errors!.course}</p>
        )}
      </div>

      {/* Email + Edad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email (opcional)"
          autoComplete="email"
          disabled={isPending}
          className={inputClass}
        />
        <input
          type="number"
          name="age"
          placeholder="Edad (opcional)"
          min={5}
          max={99}
          disabled={isPending}
          className={inputClass}
        />
      </div>

      {/* Modalidad */}
      <fieldset>
        <legend className="text-white/50 text-xs uppercase tracking-widest font-roboto mb-2.5">
          Modalidad
        </legend>
        <div className="flex gap-4">
          {(['presencial', 'virtual'] as const).map((m) => (
            <label key={m} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="modality"
                value={m}
                defaultChecked={m === 'presencial'}
                disabled={isPending}
                className="accent-[#ff7a00] w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-white/70 capitalize font-roboto group-hover:text-white transition-colors">
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Comentarios */}
      <textarea
        name="notes"
        placeholder="Comentarios opcionales — ¿tienes experiencia previa? ¿algún objetivo particular?"
        rows={3}
        disabled={isPending}
        className={inputClass + ' resize-none min-h-[88px]'}
      />

      {/* Error general */}
      {state.status === 'error' && state.message && (
        <p className="text-red-400 text-sm font-roboto text-center">{state.message}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2.5 rounded-full bg-[#ff7a00] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#ff7a00]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#ff7a00]/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 font-poppins"
      >
        {isPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
            Enviando...
          </>
        ) : (
          <>
            Agendar mi clase
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </>
        )}
      </button>

      <p className="text-center text-white/30 text-[11px] font-roboto">
        Tus datos son confidenciales y solo se usan para contactarte.
      </p>
    </form>
  )
}
