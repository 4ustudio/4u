'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MdAdd, MdEdit, MdClose } from 'react-icons/md'
import { createPlan, updatePlan, type PlanInput } from './_actions'
import type { PlanOption } from '@/lib/students/plans'

const BORDER = 'var(--adm-panel-border)'
const SURFACE = 'var(--adm-surface)'
const SURFACE_2 = 'var(--adm-surface-3)'
const TEXT = 'var(--adm-title)'
const TEXT_MUTED = 'var(--adm-text-muted)'
const TEXT_FAINT = 'var(--adm-text-faint)'

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

const EMPTY: PlanInput = { name: '', price: null, duration_months: null, description: null, active: true, sort_order: 0 }

function PlanModal({ plan, nextOrder, onClose, onSaved }: {
  plan: PlanOption | null
  nextOrder: number
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<PlanInput>(plan
    ? { name: plan.name, price: plan.price, duration_months: plan.duration_months, description: plan.description, active: plan.active, sort_order: plan.sort_order }
    : { ...EMPTY, sort_order: nextOrder })
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const set = <K extends keyof PlanInput>(k: K, v: PlanInput[K]) => setForm(f => ({ ...f, [k]: v }))
  const num = (v: string) => (v.trim() === '' ? null : Number(v))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = plan ? await updatePlan(plan.id, form) : await createPlan(form)
      if (res.error) { setError(res.error); return }
      onSaved()
    })
  }

  const input = 'w-full rounded-xl px-3 py-2 text-sm outline-none'
  const inputStyle = { background: SURFACE_2, border: `1px solid ${BORDER}`, color: TEXT }
  const label = 'block text-[11px] font-semibold uppercase tracking-wider mb-1.5'

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: 'var(--adm-elevated-shadow)' }}
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-bold" style={{ color: TEXT }}>{plan ? 'Editar plan' : 'Nuevo plan'}</p>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: TEXT_FAINT }}><MdClose className="h-5 w-5" /></button>
        </div>

        <div>
          <label className={label} style={{ color: TEXT_FAINT }} htmlFor="plan-name">Nombre</label>
          <input id="plan-name" required value={form.name} onChange={e => set('name', e.target.value)} className={input} style={inputStyle} placeholder="Plan 4 Clases" />
          {plan && form.name.trim() !== plan.name && (
            <p className="mt-1 text-[11px]" style={{ color: TEXT_FAINT }}>Los estudiantes con este plan pasarán al nuevo nombre.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} style={{ color: TEXT_FAINT }} htmlFor="plan-price">Precio mensual (COP)</label>
            <input id="plan-price" type="number" min={0} step={1000} value={form.price ?? ''} onChange={e => set('price', num(e.target.value))} className={input} style={inputStyle} placeholder="Vacío = cotización" />
          </div>
          <div>
            <label className={label} style={{ color: TEXT_FAINT }} htmlFor="plan-months">Duración (meses)</label>
            <input id="plan-months" type="number" min={1} value={form.duration_months ?? ''} onChange={e => set('duration_months', num(e.target.value))} className={input} style={inputStyle} placeholder="Vacío = sin fin" />
          </div>
        </div>

        <div>
          <label className={label} style={{ color: TEXT_FAINT }} htmlFor="plan-desc">Descripción (opcional)</label>
          <textarea id="plan-desc" rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value || null)} className={input} style={inputStyle} placeholder="Una clase semanal, presentación en tarima…" />
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className={label} style={{ color: TEXT_FAINT }} htmlFor="plan-order">Orden</label>
            <input id="plan-order" type="number" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value) || 0)} className={input} style={inputStyle} />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm cursor-pointer" style={{ color: TEXT_MUTED }}>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="h-4 w-4 accent-orange-500" />
            Activo (se puede elegir)
          </label>
        </div>

        {error && <p className="text-xs" style={{ color: 'var(--adm-danger)' }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium" style={{ background: SURFACE_2, color: TEXT_MUTED }}>Cancelar</button>
          <button type="submit" disabled={pending} className="adm-button-primary flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-50">
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>,
    // Dentro del wrapper del tema para heredar las variables --adm-*
    document.querySelector('[data-admin-theme]') ?? document.body
  )
}

export default function PlanesClient({ plans }: { plans: PlanOption[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<PlanOption | null | 'new'>(null)
  const nextOrder = plans.reduce((m, p) => Math.max(m, p.sort_order), 0) + 10

  return (
    <div className="w-full space-y-7 page-animate">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="adm-section-heading text-[2rem] font-extrabold tracking-tight">Planes</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>Planes y precios que se pueden asignar a estudiantes y cobros</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="adm-button-primary flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all hover:brightness-110"
        >
          <MdAdd className="h-4 w-4" />
          Nuevo plan
        </button>
      </div>

      {plans.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: TEXT_FAINT }}>Sin planes.</p>
      ) : (
        <div className="adm-panel overflow-hidden rounded-[28px]">
          <div className="space-y-2 px-3 py-3">
            {plans.map(p => (
              <div key={p.id} className="adm-row flex items-center gap-4 rounded-[22px] px-5 py-4" style={{ opacity: p.active ? 1 : 0.55 }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: TEXT }}>{p.name}</span>
                    {!p.active && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: SURFACE_2, color: TEXT_FAINT }}>Inactivo</span>
                    )}
                  </div>
                  {p.description && <p className="mt-0.5 truncate text-xs" style={{ color: TEXT_FAINT }}>{p.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: TEXT }}>{p.price != null ? `${formatCOP(p.price)}/mes` : 'Cotización'}</p>
                  {p.duration_months && p.price != null && (
                    <p className="text-[11px]" style={{ color: TEXT_FAINT }}>{p.duration_months} meses · {formatCOP(p.price * p.duration_months)} total</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  aria-label={`Editar ${p.name}`}
                  className="rounded-xl p-2 shrink-0"
                  style={{ color: TEXT_FAINT }}
                >
                  <MdEdit className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <PlanModal
          plan={editing === 'new' ? null : editing}
          nextOrder={nextOrder}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh() }}
        />
      )}
    </div>
  )
}
