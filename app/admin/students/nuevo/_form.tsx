'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createStudentAction } from '../../_actions/students'

const initial = { error: undefined as string | undefined, success: undefined as boolean | undefined }

const inputClass = 'w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30'

export default function NewStudentForm() {
  const router = useRouter()
  const [state, action, isPending] = useActionState(createStudentAction, initial)

  if (state.success) {
    router.push('/admin/students')
    return null
  }

  return (
    <div className="space-y-5">
      {/* Formulario */}
      <form action={action} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Nombres *</label>
            <input
              type="text" name="first_name" required disabled={isPending}
              className={inputClass}
              placeholder="Juan"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Apellidos *</label>
            <input
              type="text" name="last_name" required disabled={isPending}
              className={inputClass}
              placeholder="Pérez"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">WhatsApp *</label>
            <input
              type="tel" name="phone" required disabled={isPending}
              className={inputClass}
              placeholder="3001234567"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email</label>
            <input
              type="email" name="email" disabled={isPending}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Dirección</label>
            <input
              type="text" name="address" disabled={isPending}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Ciudad</label>
            <input
              type="text" name="city" disabled={isPending}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Fecha de nacimiento</label>
            <input
              type="date" name="birth_date" disabled={isPending}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Profesión / Ocupación</label>
            <input
              type="text" name="profession" disabled={isPending}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Género musical favorito</label>
            <select name="music_genre" disabled={isPending} className={inputClass + ' appearance-none'}>
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
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Tipo de documento</label>
            <select name="document_type" disabled={isPending} className={inputClass + ' appearance-none'}>
              <option value="">Seleccionar…</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="NIT">NIT</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Número de documento</label>
            <input
              type="text" name="document_number" disabled={isPending}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Tipo de estudiante</label>
          <select name="student_type" disabled={isPending} className={inputClass + ' appearance-none'}>
            <option value="new">Prospecto</option>
            <option value="regular">Estudiante Activo</option>
          </select>
          <p className="text-xs text-white/30 mt-1.5 leading-snug">
            <span className="text-white/45">Prospecto:</span> persona interesada que aún no ha iniciado clases.{' '}
            <span className="text-white/45">Estudiante Activo:</span> matriculado con clases asignadas o en curso.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Plan escogido</label>
            <select name="plan_name" disabled={isPending} className={inputClass + ' appearance-none'}>
              <option value="">Seleccionar…</option>
              <optgroup label="Jóvenes y Adultos">
                <option value="Plan New Talent">Plan New Talent — $1.100.000/mes</option>
                <option value="Plan Fast Talent">Plan Fast Talent — $1.900.000/mes</option>
                <option value="Plan Bandas">Plan Bandas — $2.500.000/mes</option>
                <option value="Plan Artista">Plan Artista — $3.500.000/mes</option>
                <option value="Plan Artista Premium">Plan Artista Premium — $4.500.000/mes</option>
                <option value="Plan Profesional">Plan Profesional — Cotización</option>
                <option value="Plan Corporativo">Plan Corporativo — Cotización</option>
              </optgroup>
              <optgroup label="Kids &amp; Teens">
                <option value="Plan Kids &amp; Teens">Plan Kids &amp; Teens</option>
                <option value="Plan Premium Kids &amp; Teens">Plan Premium Kids &amp; Teens</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Forma de pago</label>
            <select name="payment_method" disabled={isPending} className={inputClass + ' appearance-none'}>
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
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">EPS</label>
            <input type="text" name="eps" disabled={isPending} className={inputClass} placeholder="Sura, Nueva EPS…" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Contacto emergencia</label>
            <input type="text" name="emergency_contact_name" disabled={isPending} className={inputClass} placeholder="Nombre" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Tel. emergencia</label>
            <input type="tel" name="emergency_contact_phone" disabled={isPending} className={inputClass} placeholder="3001234567" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Notas internas</label>
          <textarea
            name="notes" rows={3} disabled={isPending}
            className={inputClass + ' resize-none'}
            placeholder="Observaciones, instrumento de interés, etc."
          />
        </div>

        {state.error && (
          <p className="text-red-400 text-xs">{state.error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit" disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: '#ff7a00' }}
          >
            {isPending ? 'Guardando…' : 'Crear estudiante'}
          </button>
          <a
            href="/admin/students"
            className="px-5 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}
