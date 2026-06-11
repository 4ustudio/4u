'use client'

import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { generateAndSaveEnrollment } from './actions'
import type { EnrollmentFormState } from '@/types/enrollment'
import { ACADEMY } from '@/lib/constants'
import PageLayout from '@/components/layout/PageLayout'
import SignatureCanvas, { type SignatureCanvasHandle } from './_components/SignatureCanvas'

const ORANGE = '#ff7a00'

const COURSES = ['Canto', 'Guitarra', 'Piano', 'Batería', 'Bajo', 'Producción Musical']
const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM',  '2:00 PM',  '3:00 PM',
  '4:00 PM',  '5:00 PM',  '6:00 PM',  '7:00 PM',
]
const LEVELS = [
  { value: 'never',        label: 'Nunca he estudiado música' },
  { value: 'beginner',     label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced',     label: 'Avanzado' },
]

const inputClass =
  'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 transition-all disabled:opacity-50'
const labelClass = 'block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 font-roboto'
const errorClass = 'text-red-400 text-xs mt-1 font-roboto'
const radioCardClass =
  'flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold font-roboto transition-colors cursor-pointer'

const initialState: EnrollmentFormState = { status: 'idle' }

// Formulario paso 1: datos personales y académicos
// Formulario paso 2: datos del contrato + firma
// Los datos del paso 1 se guardan en estado local y se incluyen como hidden inputs en el submit del paso 2

type Step = 'form' | 'signature'

interface FormSnapshot {
  student_type:    string
  student_name:    string
  student_age:     string
  guardian_name:   string
  phone:           string
  email:           string
  course_interest: string
  level:           string
  preferred_time:  string
  payment_method:  string
  music_genre:     string
  notes:           string
  terms:           string
  data_consent:    string
  image_consent:   string
}

export default function InscripcionPage() {
  const [state, action, isPending] = useActionState(generateAndSaveEnrollment, initialState)
  const [step, setStep]            = useState<Step>('form')
  const [snapshot, setSnapshot]    = useState<FormSnapshot | null>(null)

  // Step 1 state
  const [studentType,   setStudentType]   = useState<'self' | 'child' | null>(null)
  const [age,           setAge]           = useState<number | ''>('')
  const [ageError,      setAgeError]      = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [dataConsent,   setDataConsent]   = useState(false)
  const [imageConsent,  setImageConsent]  = useState(false)

  // Step 2 state
  const [idDocument,    setIdDocument]    = useState('')
  const [city,          setCity]          = useState('')
  const [sigError,      setSigError]      = useState<string | null>(null)
  const signatureRef = useRef<SignatureCanvasHandle>(null)
  const hiddenFormRef = useRef<HTMLFormElement>(null)

  function handleAgeChange(value: string) {
    const num = value === '' ? '' : Number(value)
    setAge(num)
    if (num !== '' && num < 6) {
      setAgeError('Actualmente nuestros programas están disponibles para estudiantes desde los 6 años.')
    } else {
      setAgeError(null)
    }
  }

  function handleStep1Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    // Capturar todos los campos del paso 1
    const snap: FormSnapshot = {
      student_type:    fd.get('student_type') as string ?? '',
      student_name:    fd.get('student_name') as string ?? '',
      student_age:     fd.get('student_age') as string ?? '',
      guardian_name:   fd.get('guardian_name') as string ?? '',
      phone:           fd.get('phone') as string ?? '',
      email:           fd.get('email') as string ?? '',
      course_interest: fd.get('course_interest') as string ?? '',
      level:           fd.get('level') as string ?? '',
      preferred_time:  fd.get('preferred_time') as string ?? '',
      payment_method:  fd.get('payment_method') as string ?? '',
      music_genre:     fd.get('music_genre') as string ?? '',
      notes:           fd.get('notes') as string ?? '',
      terms:           fd.get('terms') as string ?? '',
      data_consent:    fd.get('data_consent') as string ?? '',
      image_consent:   fd.get('image_consent') as string ?? '',
    }

    setSnapshot(snap)
    setStep('signature')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSignatureSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSigError(null)

    if (!idDocument.trim()) {
      setSigError('El número de documento de identidad es obligatorio')
      return
    }
    if (idDocument.trim().length < 5) {
      setSigError('Ingresa un número de documento válido')
      return
    }
    if (!city.trim()) {
      setSigError('La ciudad es obligatoria')
      return
    }
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setSigError('La firma digital es obligatoria. Por favor firma en el recuadro.')
      return
    }

    const signaturePng = signatureRef.current.toDataURL()
    const fd = new FormData()

    // Incluir datos del paso 1
    if (snapshot) {
      for (const [key, value] of Object.entries(snapshot)) {
        fd.append(key, value)
      }
    }
    // Datos del paso 2
    fd.append('id_document', idDocument.trim())
    fd.append('city', city.trim())
    fd.append('signature_png', signaturePng)

    action(fd)
  }

  // ── Pantalla de éxito ──
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
            <p className="text-white/60 text-sm font-roboto mb-2 leading-relaxed">
              Tu contrato fue firmado digitalmente y guardado de forma segura.
            </p>
            <p className="text-white/40 text-xs font-roboto mb-8 leading-relaxed">
              Recibirás un correo con tu contrato adjunto y un mensaje a WhatsApp para programar tu primera sesión.
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
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/Fondo inscribete.png"
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,122,0,0.07), transparent 70%)" }} aria-hidden="true" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 [&_*]:relative [&_*]:z-auto" style={{ isolation: 'isolate' }}>

          {/* Indicador de pasos */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {(['form', 'signature'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-all ${
                  step === s
                    ? 'text-white ring-2 ring-offset-2 ring-offset-transparent ring-[#ff7a00]'
                    : (i === 0 && step === 'signature')
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white/30'
                }`} style={step === s ? { backgroundColor: ORANGE } : {}}>
                  {i === 0 && step === 'signature' ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs font-roboto font-medium ${step === s ? 'text-white' : 'text-white/30'}`}>
                  {i === 0 ? 'Datos de inscripción' : 'Firma del contrato'}
                </span>
                {i === 0 && <div className="h-px w-6 bg-white/15" />}
              </div>
            ))}
          </div>

          {/* ── PASO 1: FORMULARIO ── */}
          {step === 'form' && (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white font-poppins leading-tight">
                  Inscríbete y programa tu<span style={{ color: ORANGE }}> primera sesión de grabación gratis</span>
                </h1>
                <p className="text-white/50 text-sm mt-3 font-roboto max-w-md mx-auto">
                  Completa el formulario y nuestro equipo te contactará<br />
                  para darte la bienvenida y coordinar tu primera clase.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-lg p-6 sm:p-8">
                <div className="pointer-events-none absolute -inset-20 opacity-50" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,122,0,0.08), transparent 70%)" }} aria-hidden="true" />

                <form onSubmit={handleStep1Submit} noValidate className="space-y-6 relative">
                  <input type="hidden" name="student_type" value={studentType ?? ''} />

                  {/* ── 1. ¿Para quién? ── */}
                  <fieldset>
                    <legend className={labelClass}>¿Para quién son las clases?</legend>
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
                    {state.errors?.student_type && <p className={errorClass}>{state.errors.student_type}</p>}
                  </fieldset>

                  {/* ── Nombre ── */}
                  <div>
                    <label htmlFor="student_name" className={labelClass}>Nombre y apellido completo del principiante</label>
                    <input id="student_name" name="student_name" type="text" placeholder="Ej: Carlos Pérez" autoComplete="name" required className={inputClass} />
                    {state.errors?.student_name && <p className={errorClass}>{state.errors.student_name}</p>}
                  </div>

                  {/* ── Edad ── */}
                  <div>
                    <label htmlFor="student_age" className={labelClass}>Edad del estudiante</label>
                    <input
                      id="student_age" name="student_age" type="number" min={6} max={100}
                      placeholder="Ej: 25" required value={age}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      className={inputClass}
                    />
                    {(state.errors?.student_age || ageError) && (
                      <p className={errorClass}>{state.errors?.student_age ?? ageError}</p>
                    )}
                  </div>

                  {/* ── Acudiente ── */}
                  <div style={{ opacity: studentType === 'child' ? 1 : 0.35, transition: 'opacity 0.2s ease' }}>
                    <label htmlFor="guardian_name" className={labelClass}>Nombre del acudiente</label>
                    <input
                      id="guardian_name" name="guardian_name" type="text"
                      placeholder="Ej: María García"
                      required={studentType === 'child'}
                      disabled={studentType !== 'child'}
                      tabIndex={studentType === 'child' ? 0 : -1}
                      className={inputClass}
                    />
                    {state.errors?.guardian_name && <p className={errorClass}>{state.errors.guardian_name}</p>}
                  </div>

                  {/* ── WhatsApp ── */}
                  <div>
                    <label htmlFor="phone" className={labelClass}>WhatsApp <span className="text-white/20 font-normal normal-case ml-1">(obligatorio)</span></label>
                    <input id="phone" name="phone" type="tel" placeholder="Ej: +57 317 019 2639" autoComplete="tel" required className={inputClass} />
                    {state.errors?.phone && <p className={errorClass}>{state.errors.phone}</p>}
                  </div>

                  {/* ── Email ── */}
                  <div>
                    <label htmlFor="email" className={labelClass}>Correo electrónico <span className="text-white/20 font-normal normal-case ml-1">(obligatorio)</span></label>
                    <input id="email" name="email" type="email" placeholder="ejemplo@correo.com" autoComplete="email" required className={inputClass} />
                    {state.errors?.email && <p className={errorClass}>{state.errors.email}</p>}
                  </div>

                  {/* ── Curso ── */}
                  <fieldset>
                    <legend className={labelClass}>Curso de interés</legend>
                    <div className="flex flex-wrap gap-2">
                      {COURSES.map((c) => (
                        <label key={c} className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold font-roboto transition-all cursor-pointer has-[:checked]:text-white has-[:checked]:shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <input type="radio" name="course_interest" value={c} className="sr-only peer" />
                          <span className="peer-checked:hidden w-2 h-2 rounded-full border border-white/30" />
                          <span className="hidden peer-checked:block w-2 h-2 rounded-full" style={{ backgroundColor: ORANGE }} />
                          {c}
                        </label>
                      ))}
                    </div>
                    {state.errors?.course_interest && <p className={errorClass}>{state.errors.course_interest}</p>}
                  </fieldset>

                  {/* ── Nivel ── */}
                  <fieldset>
                    <legend className={labelClass}>Nivel actual</legend>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {LEVELS.map((l) => (
                        <label key={l.value} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 text-sm font-roboto transition-all cursor-pointer has-[:checked]:border-[#ff7a00] has-[:checked]:bg-[#ff7a00]/10 has-[:checked]:text-white text-white/50 hover:border-white/25">
                          <input type="radio" name="level" value={l.value} className="sr-only peer" />
                          <span className="w-4 h-4 rounded-full border-2 border-white/20 peer-checked:border-[#ff7a00] peer-checked:bg-[#ff7a00] flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white hidden peer-checked:block" />
                          </span>
                          {l.label}
                        </label>
                      ))}
                    </div>
                    {state.errors?.level && <p className={errorClass}>{state.errors.level}</p>}
                  </fieldset>

                  {/* ── Hora preferida ── */}
                  <fieldset>
                    <legend className={labelClass}>Hora preferida <span className="text-white/20 font-normal normal-case ml-1">(lunes a sábado, 10am–7pm)</span></legend>
                    <div className="flex flex-wrap gap-2">
                      {TIME_SLOTS.map((t) => (
                        <label key={t} className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold font-roboto transition-all cursor-pointer has-[:checked]:text-white has-[:checked]:shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <input type="radio" name="preferred_time" value={t} className="sr-only peer" />
                          <span className="peer-checked:hidden w-2 h-2 rounded-full border border-white/30" />
                          <span className="hidden peer-checked:block w-2 h-2 rounded-full" style={{ backgroundColor: ORANGE }} />
                          {t}
                        </label>
                      ))}
                    </div>
                    {state.errors?.preferred_time && <p className={errorClass}>{state.errors.preferred_time}</p>}
                  </fieldset>

                  {/* ── Forma de pago ── */}
                  <div>
                    <label htmlFor="payment_method" className={labelClass}>Forma de pago <span className="text-white/20 font-normal normal-case ml-1">(opcional)</span></label>
                    <select id="payment_method" name="payment_method" className={inputClass + ' appearance-none'}>
                      <option value="">Seleccionar…</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia bancaria">Transferencia bancaria</option>
                      <option value="Nequi">Nequi</option>
                      <option value="Daviplata">Daviplata</option>
                      <option value="Tarjeta de crédito">Tarjeta de crédito</option>
                      <option value="Tarjeta de débito">Tarjeta de débito</option>
                      <option value="PSE">PSE</option>
                    </select>
                  </div>

                  {/* ── Género musical ── */}
                  <div>
                    <label htmlFor="music_genre" className={labelClass}>Género musical favorito <span className="text-white/20 font-normal normal-case ml-1">(opcional)</span></label>
                    <select id="music_genre" name="music_genre" className={inputClass + ' appearance-none'}>
                      <option value="">Seleccionar…</option>
                      <option value="Rock">Rock</option>
                      <option value="Pop">Pop</option>
                      <option value="Romántico">Romántico</option>
                      <option value="Tropical">Tropical</option>
                      <option value="Clásica">Clásica</option>
                      <option value="Regional colombiano">Regional colombiano</option>
                      <option value="Regional mexicano">Regional mexicano</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  {/* ── Comentarios ── */}
                  <div>
                    <label htmlFor="notes" className={labelClass}>Comentarios <span className="text-white/20 font-normal normal-case ml-1">(opcional)</span></label>
                    <textarea id="notes" name="notes" rows={3} placeholder="Cuéntanos sobre tus intereses musicales, horarios preferidos, o cualquier otra información..." className={inputClass + ' resize-none'} />
                  </div>

                  {/* ── Consentimientos ── */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3">
                      <input id="terms" name="terms" type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border border-white/20 bg-white/[0.06] accent-[#ff7a00] cursor-pointer" />
                      <label htmlFor="terms" className="text-xs text-white/50 font-roboto leading-relaxed cursor-pointer">
                        He leído y acepto los{' '}
                        <Link href="/terminos" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-white/70 hover:text-white transition-colors">
                          términos y condiciones
                        </Link>
                        <span className="text-red-400 ml-0.5">*</span>
                      </label>
                    </div>
                    {state.errors?.terms && <p className={errorClass}>{state.errors.terms}</p>}

                    <div className="flex items-start gap-3">
                      <input id="data_consent" name="data_consent" type="checkbox" checked={dataConsent} onChange={(e) => setDataConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border border-white/20 bg-white/[0.06] accent-[#ff7a00] cursor-pointer" />
                      <label htmlFor="data_consent" className="text-xs text-white/50 font-roboto leading-relaxed cursor-pointer">
                        Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012
                        <span className="text-red-400 ml-0.5">*</span>
                      </label>
                    </div>
                    {state.errors?.data_consent && <p className={errorClass}>{state.errors.data_consent}</p>}

                    <div className="flex items-start gap-3">
                      <input id="image_consent" name="image_consent" type="checkbox" checked={imageConsent} onChange={(e) => setImageConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border border-white/20 bg-white/[0.06] accent-[#ff7a00] cursor-pointer" />
                      <label htmlFor="image_consent" className="text-xs text-white/50 font-roboto leading-relaxed cursor-pointer">
                        Autorizo el uso de mi imagen, voz y nombre con fines institucionales y promocionales
                        <span className="text-white/25 ml-1">(opcional)</span>
                      </label>
                    </div>
                  </div>

                  {/* Submit paso 1 */}
                  <button
                    type="submit"
                    disabled={!termsAccepted || !dataConsent}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold text-white font-poppins transition-all duration-300 h-14 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                    style={{ backgroundColor: ORANGE, boxShadow: '0 0 32px rgba(255,122,0,0.3)' }}
                  >
                    Continuar al contrato
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ── PASO 2: FIRMA ── */}
          {step === 'signature' && (
            <>
              <div className="text-center mb-10">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white font-poppins leading-tight mb-2">
                  Firma tu <span style={{ color: ORANGE }}>contrato digital</span>
                </h1>
                <p className="text-white/50 text-sm font-roboto max-w-md mx-auto">
                  Este documento tiene validez legal según la Ley 527 de 1999 (Comercio Electrónico, Colombia).
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-lg p-6 sm:p-8">
                <form onSubmit={handleSignatureSubmit} noValidate className="space-y-6">

                  {/* Datos del firmante */}
                  <div>
                    <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 font-roboto">
                      Datos del firmante
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="id_document" className={labelClass}>
                          Documento de identidad <span className="text-red-400 ml-0.5">*</span>
                        </label>
                        <input
                          id="id_document"
                          type="text"
                          placeholder="Ej: 1234567890"
                          value={idDocument}
                          onChange={(e) => setIdDocument(e.target.value)}
                          disabled={isPending}
                          className={inputClass}
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className={labelClass}>
                          Ciudad <span className="text-red-400 ml-0.5">*</span>
                        </label>
                        <input
                          id="city"
                          type="text"
                          placeholder="Ej: Bogotá"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={isPending}
                          className={inputClass}
                          autoComplete="address-level2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumen del contrato */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-white/40 font-roboto leading-relaxed">
                      Al firmar confirmas que has leído y aceptas los{' '}
                      <Link href="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#ff7a00] underline underline-offset-2">
                        Términos y Condiciones
                      </Link>{' '}
                      de 4U Studio Academy, autorizas el tratamiento de tus datos personales (Ley 1581 de 2012),
                      y que el contrato firmado digitalmente será guardado de forma segura y te será enviado por correo.
                    </p>
                  </div>

                  {/* Canvas de firma */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelClass}>
                        Firma digital <span className="text-red-400 ml-0.5">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { signatureRef.current?.clear(); setSigError(null) }}
                        disabled={isPending}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors font-roboto"
                      >
                        Limpiar
                      </button>
                    </div>
                    <SignatureCanvas ref={signatureRef} disabled={isPending} />
                    <p className="text-[11px] text-white/25 font-roboto mt-2">
                      Usa el mouse o el dedo para firmar en el recuadro de arriba.
                    </p>
                  </div>

                  {/* Error */}
                  {(sigError || (state.status === 'error' && state.message)) && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-roboto text-center">
                      {sigError ?? state.message}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => { setStep('form'); setSigError(null) }}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white/50 border border-white/10 hover:border-white/25 hover:text-white/70 transition-all font-roboto disabled:opacity-40"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-2 flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-8 text-sm font-bold text-white font-poppins transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                      style={{ backgroundColor: ORANGE, boxShadow: '0 0 32px rgba(255,122,0,0.3)', flex: 2 }}
                    >
                      {isPending ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                          </svg>
                          Guardando contrato…
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <path d="M9 12l2 2 4-4" />
                            <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z" />
                          </svg>
                          Firmar y completar inscripción
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            </>
          )}

          {/* Info adicional */}
          {step === 'form' && (
            <div className="mt-8 text-center">
              <p className="text-white/30 text-xs font-roboto">
                ¿Tienes dudas? Escríbenos por{' '}
                <a href={ACADEMY.waUrl} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors underline underline-offset-2">
                  WhatsApp
                </a>
                {' '}o llama al{' '}
                <span className="text-white/50">{ACADEMY.phoneDisplay}</span>
              </p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
