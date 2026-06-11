'use client'

import { useState, useTransition, useEffect } from 'react'
import { getStudentPaymentDefaults, registerPayment } from '../_actions'
import type { StudentOption, PaymentMethod, StudentPaymentDefaults } from '../_actions'
import { getBirthdayBenefitStatus } from '@/lib/students/birthday'

const ORANGE = '#ff7a00'

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

const PLAN_OPTIONS = [
  'Plan New Talent',
  'Plan Fast Talent',
  'Plan Bandas',
  'Plan Artista',
  'Plan Artista Premium',
  'Plan Profesional',
  'Plan Corporativo',
  'Plan Kids & Teens',
  'Plan Premium Kids & Teens',
]

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'nequi',         label: 'Nequi' },
  { value: 'daviplata',     label: 'Daviplata' },
  { value: 'tarjeta',       label: 'Tarjeta' },
  { value: 'otro',          label: 'Otro' },
]

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

interface Props {
  /** Si viene del perfil del estudiante ya sabemos el student_id */
  preselectedStudentId?: string
  students: StudentOption[]
  onClose: () => void
  onSuccess: () => void
}

export default function GeneratePaymentModal({ preselectedStudentId, students, onClose, onSuccess }: Props) {
  const [pending, startTransition]       = useTransition()
  const [loading, setLoading]            = useState(false)
  const [error, setError]                = useState<string | null>(null)
  const [defaults, setDefaults]          = useState<StudentPaymentDefaults | null>(null)
  const [studentId, setStudentId]        = useState(preselectedStudentId ?? '')

  // Campos editables
  const [originalAmt,    setOriginalAmt]    = useState('')
  const [discountAmt,    setDiscountAmt]    = useState('0')
  const [discountPct,    setDiscountPct]    = useState('0')
  const [discountReason, setDiscountReason] = useState('')
  const [method,         setMethod]         = useState<PaymentMethod>('efectivo')
  const [notes,          setNotes]          = useState('')
  const [applyBirthday,  setApplyBirthday]  = useState(false)
  const [periodMonth,    setPeriodMonth]    = useState(new Date().getMonth() + 1)
  const [periodYear,     setPeriodYear]     = useState(new Date().getFullYear())
  const [dueDate,        setDueDate]        = useState('')
  const [planName,       setPlanName]       = useState('')

  // Cargar defaults cuando cambia el estudiante
  useEffect(() => {
    if (!studentId) { setDefaults(null); return }
    setLoading(true)
    getStudentPaymentDefaults(studentId).then(d => {
      setDefaults(d)
      if (d) {
        setPlanName(d.plan_name ?? '')
        setPeriodMonth(d.period_month)
        setPeriodYear(d.period_year)
        setDueDate(d.due_date)
      }
      setLoading(false)
    })
  }, [studentId])

  const birthdayStatus = defaults ? getBirthdayBenefitStatus(defaults) : 'expired'
  const birthdayPct    = defaults?.birthday_discount_percent ?? 10
  const showBirthday   = birthdayStatus === 'eligible' || birthdayStatus === 'granted'

  useEffect(() => {
    if (applyBirthday && originalAmt) {
      const orig = parseFloat(originalAmt) || 0
      const disc = Math.round(orig * birthdayPct / 100)
      setDiscountAmt(String(disc))
      setDiscountPct(String(birthdayPct))
      setDiscountReason('cumpleaños')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyBirthday, originalAmt])

  function handleDiscountAmt(val: string) {
    setDiscountAmt(val)
    const orig = parseFloat(originalAmt) || 0
    const disc = parseFloat(val) || 0
    if (orig > 0) setDiscountPct(String(Math.round(disc / orig * 100)))
    if (applyBirthday) setApplyBirthday(false)
  }

  const orig  = parseFloat(originalAmt) || 0
  const disc  = parseFloat(discountAmt) || 0
  const final = orig - disc

  const noPlan = defaults && !defaults.plan_name

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId) { setError('Selecciona un estudiante.'); return }
    if (orig <= 0)  { setError('Ingresa el valor original.'); return }
    if (disc > orig){ setError('El descuento supera el valor original.'); return }

    setError(null)
    startTransition(async () => {
      const res = await registerPayment({
        student_id:       studentId,
        period_year:      periodYear,
        period_month:     periodMonth,
        payment_type:     'monthly_fee',
        original_amount:  orig,
        discount_amount:  disc,
        discount_percent: parseFloat(discountPct) || 0,
        discount_reason:  discountReason || undefined,
        due_date:         dueDate,
        payment_method:   method,
        plan_name:        planName || undefined,
        notes:            notes || undefined,
        apply_birthday_benefit: applyBirthday,
      })
      if (res.error) setError(res.error)
      else { onSuccess(); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-[#0f0f0f] border border-white/12 rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Generar pago del mes</h2>
            <p className="text-xs text-white/35 mt-0.5">Prellenado desde el plan del estudiante</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Estudiante (solo si no viene preseleccionado) */}
          {!preselectedStudentId && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Estudiante</label>
              <select
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                required
              >
                <option value="">Seleccionar…</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Nombre del estudiante si viene preseleccionado */}
          {preselectedStudentId && defaults && (
            <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/8">
              <p className="text-xs text-white/40">Estudiante</p>
              <p className="text-sm font-semibold text-white mt-0.5">{defaults.student_name}</p>
            </div>
          )}

          {loading && (
            <p className="text-xs text-white/30 text-center py-2">Cargando datos del plan…</p>
          )}

          {/* Warning sin plan */}
          {noPlan && (
            <div className="px-3 py-2.5 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
              <p className="text-xs text-yellow-300">⚠ Este estudiante no tiene plan configurado. Puedes ingresarlo manualmente.</p>
            </div>
          )}

          {/* Beneficio cumpleaños */}
          {showBirthday && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-pink-500/8 border border-pink-500/20">
              <div className="text-xs">
                <span className="text-pink-300 font-medium">🎂 Beneficio cumpleaños disponible</span>
                <span className="text-white/40 ml-1.5">({birthdayPct}% descuento)</span>
              </div>
              <button
                type="button"
                onClick={() => setApplyBirthday(!applyBirthday)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                  applyBirthday ? 'bg-pink-600 text-white' : 'bg-white/8 text-white/60 hover:text-white'
                }`}
              >
                {applyBirthday ? 'Aplicado' : 'Aplicar'}
              </button>
            </div>
          )}

          {/* Plan + Periodo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Plan</label>
              <select
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              >
                <option value="">Seleccionar…</option>
                {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Mes</label>
              <select
                value={periodMonth}
                onChange={e => setPeriodMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              >
                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Valor original (COP)</label>
            <input
              type="number" min="0" step="1000"
              value={originalAmt}
              onChange={e => setOriginalAmt(e.target.value)}
              placeholder="200000"
              className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Descuento ($)</label>
              <input
                type="number" min="0" step="1000"
                value={discountAmt}
                onChange={e => handleDiscountAmt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Método</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              >
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
            <span className="text-xs text-white/40 font-medium">Total a registrar</span>
            <span className="text-base font-bold text-white">{orig > 0 ? formatCOP(final) : '—'}</span>
          </div>

          {/* Fecha vencimiento */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Fecha límite de pago</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/40 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-white/50 bg-white/5 hover:bg-white/8 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || loading}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
              style={{ backgroundColor: ORANGE }}
            >
              {pending ? 'Guardando…' : 'Confirmar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
