'use client'

import { useState, useMemo, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  MdSearch, MdEvent, MdEditNote, MdClose, MdPersonSearch, MdPersonAdd,
  MdAdd, MdEventAvailable, MdHighlightOff,
} from 'react-icons/md'
import {
  scheduleTrialClassAction,
  saveInternalNotes,
  saveTrialNotesAction,
  updateEnrollmentStatusAction,
  convertEnrollmentToStudent,
  createQuickLeadAction,
} from '../_actions/enrollments'
import type { EnrollmentRow } from '@/types/enrollment'
import WhatsAppButton from '@/components/admin/WhatsAppButton'
import PopupSelect from '../_components/PopupSelect'
import TrialClassModal from '../_components/TrialClassModal'
import { ConfirmModal } from '../_components/LeadUI'
import { SOURCES, PILL, statusLabel, timeAgo, inputClass } from '../_components/leadConstants'

type Group = 'hoy' | 'proximas' | 'sin_agendar' | 'pasadas'

const GROUP_META: Record<Group, { title: string; hint: string; accent: string }> = {
  hoy:         { title: 'Clase de prueba hoy',   hint: 'Ocurre hoy',                     accent: '#4ade80' },
  proximas:    { title: 'Próximas clases',       hint: 'Ya tienen fecha agendada',       accent: '#facc15' },
  sin_agendar: { title: 'Sin clase de prueba',   hint: 'Falta agendarles la primera sesión', accent: '#ff7a00' },
  pasadas:     { title: 'Ya tomaron la clase',   hint: 'Pendientes de decisión',         accent: '#a78bfa' },
}

const GROUP_ORDER: Group[] = ['hoy', 'proximas', 'sin_agendar', 'pasadas']

function groupOf(lead: EnrollmentRow, today: string): Group {
  if (!lead.trial_date) return 'sin_agendar'
  if (lead.trial_date === today) return 'hoy'
  return lead.trial_date > today ? 'proximas' : 'pasadas'
}

function formatTrial(date: string, time?: string | null): string {
  const label = new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  return time ? `${label} · ${time.slice(0, 5)}` : label
}

export default function InterestedClient({
  leads, instructors, today,
}: {
  leads: EnrollmentRow[]
  instructors: { id: string; name: string }[]
  today: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [search, setSearch]           = useState('')
  const [trialFor, setTrialFor]       = useState<EnrollmentRow | null>(null)
  const [notesFor, setNotesFor]       = useState<EnrollmentRow | null>(null)
  const [newOpen, setNewOpen]         = useState(false)
  const [lostFor, setLostFor]         = useState<EnrollmentRow | null>(null)
  const [flash, setFlash]             = useState<string | null>(null)

  function showFlash(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2500)
  }

  function refresh() {
    startTransition(() => router.refresh())
  }

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? leads.filter(l =>
          l.student_name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.course_interest.toLowerCase().includes(q))
      : leads

    const out: Record<Group, EnrollmentRow[]> = { hoy: [], proximas: [], sin_agendar: [], pasadas: [] }
    for (const l of filtered) out[groupOf(l, today)].push(l)
    return out
  }, [leads, search, today])

  const total = leads.length

  async function handleSchedule(date: string, time: string, instructorId: string): Promise<string | void> {
    if (!trialFor) return
    const fd = new FormData()
    fd.set('id', trialFor.id)
    fd.set('trial_date', date)
    fd.set('trial_time', time)
    fd.set('instructor_id', instructorId)
    const r = await scheduleTrialClassAction({}, fd)
    if (r.error) return r.error
    setTrialFor(null)
    showFlash('Clase de prueba agendada')
    refresh()
  }

  async function handleMarkLost() {
    if (!lostFor) return
    const fd = new FormData()
    fd.set('id', lostFor.id)
    fd.set('status', 'perdido')
    await updateEnrollmentStatusAction({}, fd)
    setLostFor(null)
    showFlash('Marcado como perdido')
    refresh()
  }

  return (
    <div className="space-y-5 w-full page-animate">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Estudiantes Interesados</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {total === 0 ? 'Nadie en seguimiento' : `${total} ${total === 1 ? 'persona' : 'personas'} en seguimiento`}
          </p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors"
          style={{ background: '#ff7a00' }}
        >
          <MdAdd className="h-4 w-4" aria-hidden="true" />
          Nuevo interesado
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o interés…"
          aria-label="Buscar interesado"
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30"
        />
      </div>

      {/* Vacío global */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-[#0f0f0f] border border-white/10 rounded-2xl">
          <MdPersonSearch className="h-10 w-10 text-white/15" aria-hidden="true" />
          <p className="text-white/70 font-semibold mt-3">Aún no hay estudiantes interesados</p>
          <p className="text-sm text-white/35 mt-1 max-w-sm">
            Registra a quien pregunte por clases para agendarle su clase de prueba y no perderle el rastro.
          </p>
          <button
            onClick={() => setNewOpen(true)}
            className="mt-5 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#ff7a00' }}
          >
            <MdAdd className="h-4 w-4" aria-hidden="true" />
            Registrar el primero
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.map(g => {
            const items = grouped[g]
            if (items.length === 0) return null
            const meta = GROUP_META[g]
            return (
              <section key={g}>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: meta.accent }} />
                  <h2 className="text-sm font-bold text-white">{meta.title}</h2>
                  <span className="text-xs text-white/30">{items.length} · {meta.hint}</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {items.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      instructors={instructors}
                      onSchedule={() => setTrialFor(lead)}
                      onNotes={() => setNotesFor(lead)}
                      onLost={() => setLostFor(lead)}
                      onConverted={(msg) => { showFlash(msg); refresh() }}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {/* Sin resultados de búsqueda */}
          {GROUP_ORDER.every(g => grouped[g].length === 0) && (
            <p className="text-sm text-white/35 text-center py-10">
              Nadie coincide con «{search}».
            </p>
          )}
        </div>
      )}

      {trialFor && (
        <TrialClassModal
          studentName={trialFor.student_name}
          instructors={instructors}
          initial={{ date: trialFor.trial_date, time: trialFor.trial_time, instructorId: trialFor.trial_instructor_id }}
          onCancel={() => setTrialFor(null)}
          onSchedule={handleSchedule}
        />
      )}

      {notesFor && (
        <NotesPanel
          lead={notesFor}
          onClose={() => setNotesFor(null)}
          onSaved={(msg) => { showFlash(msg); refresh() }}
        />
      )}

      {newOpen && (
        <QuickLeadModal
          onCancel={() => setNewOpen(false)}
          onCreated={() => { setNewOpen(false); showFlash('Interesado registrado'); refresh() }}
        />
      )}

      <ConfirmModal
        open={Boolean(lostFor)}
        title="Marcar como perdido"
        message={`${lostFor?.student_name ?? ''} saldrá de esta lista. Podrás encontrarle en el Pipeline.`}
        confirmLabel="Marcar perdido"
        onConfirm={handleMarkLost}
        onCancel={() => setLostFor(null)}
      />

      {flash && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-xl bg-[#141414] border border-white/15 text-sm text-white shadow-2xl">
          {flash}
        </div>
      )}
    </div>
  )
}

// ── Tarjeta ───────────────────────────────────────────────────

function LeadCard({
  lead, instructors, onSchedule, onNotes, onLost, onConverted,
}: {
  lead: EnrollmentRow
  instructors: { id: string; name: string }[]
  onSchedule: () => void
  onNotes: () => void
  onLost: () => void
  onConverted: (msg: string) => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [converting, setConverting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const instructorName = lead.trial_instructor_id
    ? instructors.find(i => i.id === lead.trial_instructor_id)?.name
    : null

  async function doConvert() {
    setConverting(true); setError(null)
    const r = await convertEnrollmentToStudent(lead.id)
    setConverting(false)
    setConfirmOpen(false)
    if (r.error) { setError(r.error); return }
    onConverted('Convertido a estudiante')
  }

  return (
    <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-xl p-4 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">{lead.student_name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${PILL[lead.status]}`}>
              {statusLabel(lead.status)}
            </span>
          </div>
          <p className="text-xs text-white/35 mt-0.5 truncate">
            {lead.course_interest} · {timeAgo(lead.created_at)}
          </p>
        </div>
        <WhatsAppButton
          phone={lead.phone}
          template="lead_follow_up"
          vars={{ name: lead.student_name, course: lead.course_interest }}
          entityType="lead"
          entityId={lead.id}
          variant="pill"
        />
      </div>

      {/* Clase de prueba */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        {lead.trial_date ? (
          <span className="flex items-center gap-1.5 text-green-400/90">
            <MdEventAvailable className="h-4 w-4 shrink-0" aria-hidden="true" />
            {formatTrial(lead.trial_date, lead.trial_time)}
            {instructorName && <span className="text-white/35">· {instructorName}</span>}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-white/30">
            <MdEvent className="h-4 w-4 shrink-0" aria-hidden="true" />
            Sin clase de prueba
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={onSchedule}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
          style={{ background: lead.trial_date ? 'rgba(255,255,255,0.06)' : '#ff7a00' }}
        >
          <MdEvent className="h-3.5 w-3.5" aria-hidden="true" />
          {lead.trial_date ? 'Reagendar' : 'Agendar clase'}
        </button>
        <button
          onClick={onNotes}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white/70 border border-white/10 hover:border-white/25 hover:text-white transition-colors"
        >
          <MdEditNote className="h-4 w-4" aria-hidden="true" />
          Observaciones
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={converting}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#ff9a3b] hover:text-[#ffb066] transition-colors disabled:opacity-50"
        >
          <MdPersonAdd className="h-3.5 w-3.5" aria-hidden="true" />
          {converting ? 'Convirtiendo…' : 'Convertir a estudiante'}
        </button>
        <button
          onClick={onLost}
          className="flex items-center gap-1 text-[11px] text-white/25 hover:text-red-400 transition-colors"
        >
          <MdHighlightOff className="h-3.5 w-3.5" aria-hidden="true" />
          Perdido
        </button>
      </div>

      {error && <p className="text-red-400 text-[11px] mt-2">{error}</p>}

      <ConfirmModal
        open={confirmOpen}
        title="Convertir a estudiante"
        message={`Se creará la ficha de estudiante de ${lead.student_name} y saldrá de esta lista.`}
        confirmLabel="Convertir"
        onConfirm={doConvert}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

// ── Panel de observaciones ────────────────────────────────────

function NotesPanel({
  lead, onClose, onSaved,
}: {
  lead: EnrollmentRow
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [general, setGeneral] = useState(lead.internal_notes ?? '')
  const [trial, setTrial]     = useState(lead.trial_notes ?? '')
  const [saving, setSaving]   = useState(false)

  const hasTrial = Boolean(lead.trial_date)

  async function handleSave() {
    setSaving(true)
    const results = await Promise.all([
      saveInternalNotes(lead.id, general),
      hasTrial ? saveTrialNotesAction(lead.id, trial) : Promise.resolve({ error: undefined }),
    ])
    setSaving(false)
    const err = results.find(r => r?.error)
    if (err?.error) { onSaved('No se pudo guardar'); return }
    onClose()
    onSaved('Observaciones guardadas')
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Observaciones de ${lead.student_name}`}
        onClick={ev => ev.stopPropagation()}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-[#141414] border border-white/10 p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Observaciones</h3>
            <p className="text-xs text-white/40 mt-0.5">{lead.student_name}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-white/30 hover:text-white/70 p-1 rounded-lg hover:bg-white/5 transition-colors">
            <MdClose className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div>
          <label htmlFor="notas-generales" className="block text-xs text-white/50 mb-1.5">
            Observaciones generales
          </label>
          <textarea
            id="notas-generales"
            value={general}
            onChange={e => setGeneral(e.target.value)}
            rows={4}
            placeholder="Qué instrumento le interesa, disponibilidad, quién lo refirió…"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30 resize-none leading-relaxed"
          />
          <p className="text-[11px] text-white/20 mt-1">Solo visible para el equipo</p>
        </div>

        <div>
          <label htmlFor="notas-clase" className="block text-xs text-white/50 mb-1.5">
            Cómo le fue en la clase de prueba
          </label>
          <textarea
            id="notas-clase"
            value={trial}
            onChange={e => setTrial(e.target.value)}
            rows={4}
            disabled={!hasTrial}
            aria-describedby="notas-clase-hint"
            placeholder={hasTrial ? 'Nivel, actitud, qué instrumento se le dio mejor…' : ''}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30 resize-none leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <p id="notas-clase-hint" className="text-[11px] text-white/20 mt-1">
            {hasTrial ? 'También editable por el instructor' : 'Agenda primero la clase de prueba para poder anotar cómo le fue'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-xs px-4 py-2 rounded-lg font-semibold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: '#ff7a00' }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Alta rápida ───────────────────────────────────────────────

function QuickLeadModal({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [course, setCourse]   = useState('')
  const [age, setAge]         = useState('')
  const [source, setSource]   = useState('presencial')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!name.trim() || !phone.trim()) { setError('Nombre y WhatsApp son obligatorios.'); return }
    setSaving(true); setError(null)
    const fd = new FormData()
    fd.set('student_name', name)
    fd.set('phone', phone)
    fd.set('course_interest', course)
    fd.set('student_age', age)
    fd.set('source', source)
    const r = await createQuickLeadAction({}, fd)
    setSaving(false)
    if (r.error) { setError(r.error); return }
    onCreated()
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6" onClick={onCancel}>
      <form
        onClick={ev => ev.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl bg-[#141414] border border-white/10 p-5 shadow-2xl space-y-3"
      >
        <div>
          <h3 className="text-sm font-bold text-white">Nuevo interesado</h3>
          <p className="text-xs text-white/40 mt-0.5">Lo mínimo para no perderle el rastro</p>
        </div>

        <div>
          <label htmlFor="ql-name" className="block text-xs text-white/50 mb-1.5">Nombre *</label>
          <input id="ql-name" value={name} onChange={e => setName(e.target.value)} disabled={saving} required placeholder="Juan Pérez" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ql-phone" className="block text-xs text-white/50 mb-1.5">WhatsApp *</label>
            <input id="ql-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={saving} required placeholder="3001234567" className={inputClass} />
          </div>
          <div>
            <label htmlFor="ql-age" className="block text-xs text-white/50 mb-1.5">Edad</label>
            <input id="ql-age" type="number" min={6} max={119} value={age} onChange={e => setAge(e.target.value)} disabled={saving} placeholder="opcional" className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="ql-course" className="block text-xs text-white/50 mb-1.5">¿Qué le interesa?</label>
          <input id="ql-course" value={course} onChange={e => setCourse(e.target.value)} disabled={saving} placeholder="Guitarra, canto, batería…" className={inputClass} />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">¿Por dónde llegó?</label>
          <PopupSelect value={source} onChange={setSource} options={SOURCES} placeholder="Sin fuente" />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} disabled={saving} className="text-xs px-4 py-2 rounded-lg font-semibold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="text-xs px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50" style={{ background: '#ff7a00' }}>
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}
