'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPendingPayment, getStudentPaymentDefaults } from '../_actions'
import type { StudentOption, StudentPaymentDefaults } from '../_actions'

const ORANGE = '#ff7a00'

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

const PLAN_OPTIONS: { name: string; price: number | null; label: string }[] = [
  { name: 'Plan New Talent',          price: 1100000, label: 'Plan New Talent — $1.100.000/mes' },
  { name: 'Plan Fast Talent',         price: 1900000, label: 'Plan Fast Talent — $1.900.000/mes' },
  { name: 'Plan Bandas',              price: 2500000, label: 'Plan Bandas — $2.500.000/mes' },
  { name: 'Plan Artista',             price: 3500000, label: 'Plan Artista — $3.500.000/mes' },
  { name: 'Plan Artista Premium',     price: 4500000, label: 'Plan Artista Premium — $4.500.000/mes' },
  { name: 'Plan Profesional',         price: null,    label: 'Plan Profesional — Cotización personalizada' },
  { name: 'Plan Corporativo',         price: null,    label: 'Plan Corporativo — Cotización personalizada' },
  { name: 'Plan Kids & Teens',        price: 1100000, label: 'Plan Kids & Teens — $1.100.000/mes' },
  { name: 'Plan Premium Kids & Teens',price: 1600000, label: 'Plan Premium Kids & Teens — $1.600.000/mes' },
]

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

interface Props {
  preselectedStudentId?: string
  students: StudentOption[]
  onClose: () => void
  onSuccess: () => void
}

export default function CreateCobroModal({ preselectedStudentId, students, onClose, onSuccess }: Props) {
  const [pending, startTransition] = useTransition()
  const [loading, setLoading]      = useState(false)
  const [error, setError]          = useState<string | null>(null)
  const [defaults, setDefaults]    = useState<StudentPaymentDefaults | null>(null)
  const [studentId, setStudentId]  = useState(preselectedStudentId ?? '')

  const [originalAmt,    setOriginalAmt]    = useState('')
  const [discountAmt,    setDiscountAmt]    = useState('0')
  const [discountPct,    setDiscountPct]    = useState('0')
  const [discountReason, setDiscountReason] = useState('')
  const [periodMonth,    setPeriodMonth]    = useState(new Date().getMonth() + 1)
  const [periodYear,     setPeriodYear]     = useState(new Date().getFullYear())
  const [dueDate,        setDueDate]        = useState('')
  const [planName,       setPlanName]       = useState('')
  const [notes,          setNotes]          = useState('')

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

  function handlePlanChange(name: string) {
    setPlanName(name)
    const plan = PLAN_OPTIONS.find(p => p.name === name)
    if (plan?.price) setOriginalAmt(String(plan.price))
  }

  function handleDiscountAmt(val: string) {
    setDiscountAmt(val)
    const orig = parseFloat(originalAmt) || 0
    const disc = parseFloat(val) || 0
    if (orig > 0) setDiscountPct(String(Math.round(disc / orig * 100)))
  }

  const orig  = parseFloat(originalAmt) || 0
  const disc  = parseFloat(discountAmt) || 0
  const final = orig - disc

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId) { setError('Selecciona un estudiante.'); return }
    if (orig <= 0)  { setError('Ingresa el valor del cobro.'); return }
    if (disc > orig){ setError('El descuento supera el valor original.'); return }
    if (!dueDate)   { setError('Indica la fecha de vencimiento.'); return }

    setError(null)
    startTransition(async () => {
      const res = await createPendingPayment({
        student_id:       studentId,
        period_year:      periodYear,
        period_month:     periodMonth,
        original_amount:  orig,
        discount_amount:  disc,
        discount_percent: parseFloat(discountPct) || 0,
        discount_reason:  discountReason || undefined,
        due_date:         dueDate,
        plan_name:        planName || undefined,
        notes:            notes || undefined,
      })
      if (res.error) setError(res.error)
      else { onSuccess(); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-[#0f0f0f] border border-white/12 rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-base font-bold text-white">Crear cobro</h2>
            <p className="text-xs text-white/35 mt-0.5">Queda pendiente — el estudiante paga vía link Bold</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Indicador de flujo */}
        <div className="flex items-center gap-2 mb-5 mt-3 px-3 py-2 rounded-xl bg-orange-500/8 border border-orange-500/20">
          <svg className="h-3.5 w-3.5 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <p className="text-[11px] text-orange-300/80">Crear cobro → Generar link Bold → Estudiante paga → Webhook confirma</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Estudiante */}
          {!preselectedStudentId ? (
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Estudiante</label>
              <select
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                required
              >
                <option value="">Seleccionar…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          ) : defaults && (
            <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/8">
              <p className="text-xs text-white/40">Estudiante</p>
              <p className="text-sm font-semibold text-white mt-0.5">{defaults.student_name}</p>
            </div>
          )}

          {loading && <p className="text-xs text-white/30 text-center py-2">Cargando datos del plan…</p>}

          {/* Plan + Periodo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Plan</label>
              <select
                value={planName}
                onChange={e => handlePlanChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              >
                <option value="">Seleccionar…</option>
                {PLAN_OPTIONS.map(p => <option key={p.name} value={p.name}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Mes</label>
              <select
                value={periodMonth}
                onChange={e => setPeriodMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              >
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Valor del cobro (COP)</label>
            <input
              type="number" min="0" step="1000"
              value={originalAmt}
              onChange={e => setOriginalAmt(e.target.value)}
              placeholder="200000"
              className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              required
            />
          </div>

          {/* Descuento */}
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
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Fecha vencimiento</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                required
              />
            </div>
          </div>

          {disc > 0 && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Motivo del descuento</label>
              <select
                value={discountReason}
                onChange={e => setDiscountReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              >
                <option value="">Seleccionar…</option>
                <option value="cumpleaños">Cumpleaños</option>
                <option value="beca">Beca</option>
                <option value="cortesía">Cortesía comercial</option>
                <option value="corrección">Corrección</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
            <span className="text-xs text-white/40 font-medium">Total a cobrar</span>
            <span className="text-base font-bold text-white">{orig > 0 ? formatCOP(final) : '—'}</span>
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
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: ORANGE }}
            >
              {pending
                ? 'Creando…'
                : <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    Crear cobro pendiente
                  </>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
