'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { submitEnrollment } from './actions'
import type { EnrollmentFormState } from '@/types/enrollment'
import { ACADEMY } from '@/lib/constants'
import PageLayout from '@/components/layout/PageLayout'

const ORANGE = '#ff7a00'

const COURSES = ['Canto', 'Guitarra', 'Piano', 'Batería', 'Bajo', 'Producción Musical']
const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM',  '2:00 PM',  '3:00 PM',
  '4:00 PM',  '5:00 PM',  '6:00 PM',  '7:00 PM',
]
const LEVELS = [
  { value: 'never',     label: 'Nunca he estudiado música' },
  { value: 'beginner',  label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced',  label: 'Avanzado' },
]

const inputClass =
  'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 transition-all disabled:opacity-50'
const labelClass = 'block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 font-roboto'
const errorClass = 'text-red-400 text-xs mt-1 font-roboto'
const radioCardClass =
  'flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold font-roboto transition-all cursor-pointer'

const initialState: EnrollmentFormState = { status: 'idle' }

export default function InscripcionPage() {
  const [state, action, isPending] = useActionState(submitEnrollment, initialState)
  const [studentType, setStudentType] = useState<'self' | 'child' | null>(null)
  const [age, setAge] = useState<number | ''>('')
  const [ageError, setAgeError] = useState<string | null>(null)

  function handleAgeChange(value: string) {
    const num = value === '' ? '' : Number(value)
    setAge(num)
    if (num !== '' && num < 6) {
      setAgeError('Actualmente nuestros programas están disponibles para estudiantes desde los 6 años.')
    } else {
      setAgeError(null)
    }
  }

  if (state.status === 'success') {
    return (
      <PageLayout>
        <section className="relative min-h-screen flex items-center justify-center px-4">
          <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,122,0,0.08), transparent 70%)" }} aria-hidden="true" />
          <div className="relative z-10 max-w-lg w-full text-center py-20">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-green-500/15 ring-1 ring-green-500/30 flex items-center justify-center">
                <svg className="h-10 w-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-poppins mb-3">¡Inscripción recibida!</h1>
            <p className="text-white/60 text-sm font-roboto mb-8 leading-relaxed">
              Gracias por confiar en 4U Studio Academy. Nuestro equipo se pondrá en contacto contigo muy pronto para coordinar los siguientes pasos.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white transition-all hover:brightness-110"
              style={{ backgroundColor: ORANGE }}
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <section className="relative w-full min-h-screen overflow-hidden">
        <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,122,0,0.08), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(255,122,0,0.05), transparent 60%)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/6 blur-3xl rounded-full" aria-hidden="true" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          {/* Encabezado */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white font-poppins leading-tight">
              Comienza tu<span style={{ color: ORANGE }}> viaje musical</span>
            </h1>
            <p className="text-white/50 text-sm mt-3 font-roboto max-w-md mx-auto">
              Completa el formulario y nuestro equipo te contactará para darte la bienvenida y coordinar tu primera clase.
            </p>
          </div>

          {/* Formulario */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-lg p-6 sm:p-8">
            <div className="pointer-events-none absolute -inset-20 opacity-50" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,122,0,0.08), transparent 70%)" }} aria-hidden="true" />

            <form action={action} noValidate className="space-y-6 relative">
              {/* ── 1. ¿Para quién? ── */}
              <fieldset>
                <legend className={labelClass}>¿Para quién son las clases?</legend>
                <input type="hidden" name="student_type" value={studentType ?? ''} />
                <div className="flex gap-3">
                  {(['self', 'child'] as const).map((type) => (
                    <label
                      key={type}
                      className={`${radioCardClass} ${
                        studentType === type
                          ? 'border-[#ff7a00] bg-[#ff7a00]/10 text-white'
                          : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="student_type_radio"
                        value={type}
                        checked={studentType === type}
                        onChange={() => setStudentType(type)}
                        className="sr-only"
                      />
                      {type === 'self' ? (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      )}
                      {type === 'self' ? 'Para mí' : 'Para mi hijo o hija'}
                    </label>
                  ))}
                </div>
                {state.errors?.student_type && (
                  <p className={errorClass}>{state.errors.student_type}</p>
                )}
              </fieldset>

              {/* ── 2. Nombre del estudiante ── */}
              <div>
                <label htmlFor="student_name" className={labelClass}>Nombre completo del estudiante</label>
                <input id="student_name" name="student_name" type="text" placeholder="Ej: Carlos Pérez" autoComplete="name" required disabled={isPending} className={inputClass} />
                {state.errors?.student_name && <p className={errorClass}>{state.errors.student_name}</p>}
              </div>

              {/* ── 3. Edad ── */}
              <div>
                <label htmlFor="student_age" className={labelClass}>Edad del estudiante</label>
                <input
                  id="student_age"
                  name="student_age"
                  type="number"
                  min={6}
                  max={100}
                  placeholder="Ej: 25"
                  required
                  disabled={isPending}
                  value={age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className={inputClass}
                />
                {(state.errors?.student_age || ageError) && (
                  <p className={errorClass}>{state.errors?.student_age ?? ageError}</p>
                )}
              </div>

              {/* ── 4. Acudiente ── */}
              {studentType === 'child' && (
                <div>
                  <label htmlFor="guardian_name" className={labelClass}>Nombre del acudiente</label>
                  <input id="guardian_name" name="guardian_name" type="text" placeholder="Ej: María García" required disabled={isPending} className={inputClass} />
                  {state.errors?.guardian_name && <p className={errorClass}>{state.errors.guardian_name}</p>}
                </div>
              )}

              {/* ── 5. WhatsApp ── */}
              <div>
                <label htmlFor="phone" className={labelClass}>
                  WhatsApp
                  <span className="text-white/20 font-normal normal-case ml-1">(obligatorio)</span>
                </label>
                <input id="phone" name="phone" type="tel" placeholder="Ej: +57 317 019 2639" autoComplete="tel" required disabled={isPending} className={inputClass} />
                {state.errors?.phone && <p className={errorClass}>{state.errors.phone}</p>}
              </div>

              {/* ── 6. Email ── */}
              <div>
                <label htmlFor="email" className={labelClass}>
                  Correo electrónico
                  <span className="text-white/20 font-normal normal-case ml-1">(obligatorio)</span>
                </label>
                <input id="email" name="email" type="email" placeholder="ejemplo@correo.com" autoComplete="email" required disabled={isPending} className={inputClass} />
                {state.errors?.email && <p className={errorClass}>{state.errors.email}</p>}
              </div>

              {/* ── 7. Curso ── */}
              <fieldset>
                <legend className={labelClass}>Curso de interés</legend>
                <div className="flex flex-wrap gap-2">
                  {COURSES.map((c) => (
                    <label
                      key={c}
                      className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold font-roboto transition-all cursor-pointer has-[:checked]:text-white has-[:checked]:shadow-lg"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <input type="radio" name="course_interest" value={c} className="sr-only peer" disabled={isPending} />
                      <span className="peer-checked:hidden w-2 h-2 rounded-full border border-white/30" />
                      <span className="hidden peer-checked:block w-2 h-2 rounded-full" style={{ backgroundColor: ORANGE }} />
                      {c}
                    </label>
                  ))}
                </div>
                {state.errors?.course_interest && <p className={errorClass}>{state.errors.course_interest}</p>}
              </fieldset>

              {/* ── 8. Nivel ── */}
              <fieldset>
                <legend className={labelClass}>Nivel actual</legend>
                <div className="grid sm:grid-cols-2 gap-2">
                  {LEVELS.map((l) => (
                    <label
                      key={l.value}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 text-sm font-roboto transition-all cursor-pointer has-[:checked]:border-[#ff7a00] has-[:checked]:bg-[#ff7a00]/10 has-[:checked]:text-white text-white/50 hover:border-white/25"
                    >
                      <input type="radio" name="level" value={l.value} className="sr-only peer" disabled={isPending} />
                      <span className="w-4 h-4 rounded-full border-2 border-white/20 peer-checked:border-[#ff7a00] peer-checked:bg-[#ff7a00] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white hidden peer-checked:block" />
                      </span>
                      {l.label}
                    </label>
                  ))}
                </div>
                {state.errors?.level && <p className={errorClass}>{state.errors.level}</p>}
              </fieldset>

              {/* ── 9. Hora preferida ── */}
              <fieldset>
                <legend className={labelClass}>
                  Hora preferida
                  <span className="text-white/20 font-normal normal-case ml-1">(lunes a sábado, 10am–7pm)</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((t) => (
                    <label
                      key={t}
                      className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold font-roboto transition-all cursor-pointer has-[:checked]:text-white has-[:checked]:shadow-lg"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <input type="radio" name="preferred_time" value={t} className="sr-only peer" disabled={isPending} />
                      <span className="peer-checked:hidden w-2 h-2 rounded-full border border-white/30" />
                      <span className="hidden peer-checked:block w-2 h-2 rounded-full" style={{ backgroundColor: ORANGE }} />
                      {t}
                    </label>
                  ))}
                </div>
                {state.errors?.preferred_time && <p className={errorClass}>{state.errors.preferred_time}</p>}
              </fieldset>

              {/* ── 10. Comentarios ── */}
              <div>
                <label htmlFor="notes" className={labelClass}>
                  Comentarios
                  <span className="text-white/20 font-normal normal-case ml-1">(opcional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Cuéntanos sobre tus intereses musicales, horarios preferidos, o cualquier otra información..."
                  disabled={isPending}
                  className={inputClass + ' resize-none'}
                />
              </div>

              {/* Mensaje de error general */}
              {state.status === 'error' && state.message && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-roboto text-center">
                  {state.message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold text-white font-poppins transition-all duration-300 h-14 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                style={{ backgroundColor: ORANGE, boxShadow: '0 0 32px rgba(255,122,0,0.3)' }}
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
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M22 2L11 13" />
                      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                    Enviar inscripción
                  </>
                )}
              </button>

              {/* Trust strip */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-white/30 font-roboto">
                <span className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Sin compromiso
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-3 w-3" style={{ color: ORANGE }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Tus datos están seguros
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Respuesta rápida
                </span>
              </div>
            </form>
          </div>

          {/* Info adicional */}
          <div className="mt-8 text-center">
            <p className="text-white/30 text-xs font-roboto">
              ¿Tienes dudas? Escríbenos por{' '}
              <a
                href={ACADEMY.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors underline underline-offset-2"
              >
                WhatsApp
              </a>
              {' '}o llama al{' '}
              <span className="text-white/50">{ACADEMY.phoneDisplay}</span>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
