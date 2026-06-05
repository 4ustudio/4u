'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import {
  getEnrollments,
  getEnrollmentEvents,
  updateEnrollmentStatusAction,
  addEnrollmentEvent,
  saveInternalNotes,
  convertEnrollmentToStudent,
  updateEnrollmentFieldsAction,
} from '../_actions/enrollments'
import type { EnrollmentRow, EnrollmentEvent, EnrollmentSource } from '@/types/enrollment'

// ── Constantes ────────────────────────────────────────────────

const SOURCES: { value: EnrollmentSource; label: string }[] = [
  { value: 'inscripcion', label: 'Formulario web' },
  { value: 'whatsapp',    label: 'WhatsApp' },
  { value: 'instagram',   label: 'Instagram' },
  { value: 'facebook',    label: 'Facebook' },
  { value: 'google',      label: 'Google' },
  { value: 'referido',    label: 'Referido' },
  { value: 'web',         label: 'Web' },
  { value: 'presencial',  label: 'Presencial' },
  { value: 'otro',        label: 'Otro' },
]

const LOST_REASONS = [
  'Precio muy alto',
  'Horario no disponible',
  'Eligió otra academia',
  'No respondió',
  'Sin interés definitivo',
  'Aplazó la decisión',
  'Otro',
]

type KanbanStatus = 'pending' | 'contacted' | 'clase_prueba' | 'converted' | 'perdido'

const COLUMNS: { status: KanbanStatus; label: string; dot: string; header: string; border: string }[] = [
  { status: 'pending',      label: 'Nuevo',        dot: 'bg-yellow-400', header: 'border-yellow-500/30 text-yellow-400', border: 'border-yellow-500/10' },
  { status: 'contacted',    label: 'Contactado',   dot: 'bg-white/40',   header: 'border-violet-500/30 text-white/55',    border: 'border-white/10' },
  { status: 'clase_prueba', label: 'Clase Prueba', dot: 'bg-green-400',  header: 'border-green-500/30 text-green-400',  border: 'border-green-500/10' },
  { status: 'converted',    label: 'Matriculado',  dot: 'bg-[#ff7a00]', header: 'border-purple-500/30 text-[#ff9a3b]',border: 'border-purple-500/10' },
  { status: 'perdido',      label: 'Perdido',      dot: 'bg-red-500',    header: 'border-red-500/30 text-red-400',      border: 'border-red-500/10' },
]

const PILL: Record<string, string> = {
  pending:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  contacted:    'bg-white/8 text-white/55 border-white/12',
  clase_prueba: 'bg-green-500/10 text-green-400 border-green-500/20',
  scheduled:    'bg-green-500/10 text-green-400 border-green-500/20',
  perdido:      'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled:    'bg-red-500/10 text-red-400 border-red-500/20',
  converted:    'bg-[#ff7a00]/12 text-[#ff9a3b] border-[#ff7a00]/25',
}

const SOURCE_COLORS: Record<string, string> = {
  inscripcion: 'text-orange-400',
  whatsapp:    'text-green-400',
  instagram:   'text-pink-400',
  facebook:    'text-white/55',
  google:      'text-yellow-400',
  referido:    'text-orange-400',
  web:         'text-white/55',
  presencial:  'text-white/50',
  otro:        'text-white/30',
}

// ── Utils ─────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora mismo'
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Ayer' : `Hace ${d}d`
}

function isToday(iso: string): boolean {
  const d = new Date(iso), n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

function cleanPhone(p: string) { return p.replace(/[^0-9]/g, '') }

function canonicalStatus(s: string): KanbanStatus {
  if (s === 'scheduled')  return 'clase_prueba'
  if (s === 'cancelled')  return 'perdido'
  return s as KanbanStatus
}

// ── Card ──────────────────────────────────────────────────────

function LeadCard({
  enrollment: e,
  onOpen,
  onMove,
}: {
  enrollment: EnrollmentRow
  onOpen: () => void
  onMove: (status: KanbanStatus) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const canonical = canonicalStatus(e.status)
  const nextSteps = COLUMNS.filter(c => c.status !== canonical && c.status !== 'converted')

  return (
    <div className="relative bg-[#0f0f0f] border border-white/[0.08] rounded-xl p-4 hover:border-white/15 transition-all group">

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <button
            onClick={onOpen}
            className="text-sm font-semibold text-white hover:text-orange-300 transition-colors text-left block truncate w-full"
          >
            {e.student_name}
          </button>
          <p className="text-xs text-white/35 mt-0.5 truncate">{e.course_interest}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isToday(e.created_at) && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold uppercase tracking-wider">HOY</span>
          )}
          {/* Mover a */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="text-white/20 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5"
              title="Mover a…"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-[#141414] border border-white/10 rounded-xl py-1 min-w-[130px] shadow-2xl">
                  {nextSteps.map(col => (
                    <button
                      key={col.status}
                      onClick={() => { onMove(col.status); setMenuOpen(false) }}
                      className="w-full text-left px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.dot}`} />
                      {col.label}
                    </button>
                  ))}
                  {canonical !== 'converted' && (
                    <button
                      onClick={() => { onMove('converted'); setMenuOpen(false) }}
                      className="w-full text-left px-3 py-2 text-xs text-[#ff9a3b] hover:bg-purple-500/10 transition-colors flex items-center gap-2 border-t border-white/[0.06] mt-1 pt-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#ff7a00]" />
                      Matricular
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 text-xs text-white/35">
        <a
          href={`https://wa.me/${cleanPhone(e.phone)}`}
          target="_blank" rel="noopener noreferrer"
          className="text-green-500/70 hover:text-green-400 transition-colors font-mono"
          onClick={ev => ev.stopPropagation()}
        >
          {e.phone}
        </a>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          {e.source && (
            <span className={`text-[10px] font-medium ${SOURCE_COLORS[e.source] ?? 'text-white/30'}`}>
              {SOURCES.find(s => s.value === e.source)?.label ?? e.source}
            </span>
          )}
          {!e.source && (
            <span className="text-[10px] text-white/20">sin fuente</span>
          )}
        </div>
        <span className="text-[10px] text-white/25">{timeAgo(e.created_at)}</span>
      </div>

      {e.next_followup_at && (
        <div className="mt-2 text-[10px] text-orange-400/70 flex items-center gap-1">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          Seguimiento: {new Date(e.next_followup_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
        </div>
      )}
    </div>
  )
}

// ── Drawer de detalle ─────────────────────────────────────────

function LeadDrawer({
  enrollment: e,
  open,
  events,
  loadingEvents,
  notesText,
  savingNotes,
  notesSaved,
  converting,
  convertedStudentId,
  convertError,
  onClose,
  onStatusChange,
  onQuickAction,
  onNotesChange,
  onSaveNotes,
  onConvert,
  onUpdateSource,
  onUpdateFollowup,
  onUpdateLostReason,
}: {
  enrollment: EnrollmentRow | null
  open: boolean
  events: EnrollmentEvent[]
  loadingEvents: boolean
  notesText: string
  savingNotes: boolean
  notesSaved: boolean
  converting: boolean
  convertedStudentId: string | null
  convertError: string | null
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
  onQuickAction: (type: 'whatsapp_sent' | 'called' | 'email_sent', desc: string, href: string) => void
  onNotesChange: (v: string) => void
  onSaveNotes: () => void
  onConvert: () => void
  onUpdateSource: (source: string) => void
  onUpdateFollowup: (date: string) => void
  onUpdateLostReason: (reason: string) => void
}) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[50] bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 right-0 h-screen z-[60] flex flex-col
          w-full sm:w-[520px] lg:w-[44vw] xl:w-[42vw] max-w-[680px]
          bg-[#0f0f0f] border-l border-white/[0.08]
          transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {e && (
          <>
            {/* Header */}
            <div className="shrink-0 flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/[0.07]">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-bold text-white leading-tight">{e.student_name}</h2>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${PILL[e.status]}`}>
                    {COLUMNS.find(c => c.status === canonicalStatus(e.status))?.label ?? e.status}
                  </span>
                </div>
                <p className="text-xs text-white/35 mt-1">{timeAgo(e.created_at)}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="mt-0.5 shrink-0 text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* Datos */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Prospecto</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <InfoRow label="Edad"    value={`${e.student_age} años`} />
                    <InfoRow label="Curso"   value={e.course_interest} />
                    <InfoRow label="Nivel"   value={{ never: 'Sin experiencia', beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }[e.level] ?? e.level} />
                    <InfoRow label="Hora"    value={e.preferred_time} />
                    {e.guardian_name && <InfoRow label="Acudiente" value={e.guardian_name} />}
                  </div>
                </section>

                {/* Contacto */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Contacto</p>
                  <div className="space-y-2">
                    <a href={`https://wa.me/${cleanPhone(e.phone)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group">
                      <svg className="h-4 w-4 text-green-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      <span className="text-sm text-white/70 font-mono group-hover:text-white transition-colors">{e.phone}</span>
                    </a>
                    {e.email && (
                      <a href={`mailto:${e.email}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group">
                        <svg className="h-4 w-4 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <span className="text-sm text-white/60 truncate group-hover:text-white transition-colors">{e.email}</span>
                      </a>
                    )}
                  </div>
                </section>

                {/* Canal + seguimiento */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Canal y seguimiento</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-white/30 mb-1.5">Fuente</label>
                      <select
                        value={e.source ?? ''}
                        onChange={ev => onUpdateSource(ev.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30"
                      >
                        <option value="">Sin fuente</option>
                        {SOURCES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/30 mb-1.5">Próximo seguimiento</label>
                      <input
                        type="date"
                        value={e.next_followup_at ? e.next_followup_at.split('T')[0] : ''}
                        onChange={ev => onUpdateFollowup(ev.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30"
                      />
                    </div>
                  </div>
                </section>

                {/* Razón de pérdida */}
                {(canonicalStatus(e.status) === 'perdido') && (
                  <section>
                    <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Razón de pérdida</p>
                    <select
                      value={e.lost_reason ?? ''}
                      onChange={ev => onUpdateLostReason(ev.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30"
                    >
                      <option value="">Seleccionar razón…</option>
                      {LOST_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </section>
                )}

                {/* Acciones rápidas */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Acciones rápidas</p>
                  <div className="grid grid-cols-3 gap-2">
                    <QuickBtn
                      icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>}
                      label="WhatsApp"
                      hover="hover:border-green-500/30 hover:bg-green-500/8 hover:text-green-400"
                      onClick={() => onQuickAction('whatsapp_sent', 'WhatsApp enviado', `https://wa.me/${cleanPhone(e.phone)}`)}
                    />
                    <QuickBtn
                      icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17z"/></svg>}
                      label="Llamar"
                      hover="hover:border-yellow-500/30 hover:bg-yellow-500/8 hover:text-yellow-400"
                      onClick={() => onQuickAction('called', 'Llamada realizada', `tel:${cleanPhone(e.phone)}`)}
                    />
                    <QuickBtn
                      icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                      label="Email"
                      hover="hover:border-orange-500/30 hover:bg-orange-500/8 hover:text-orange-400"
                      onClick={() => onQuickAction('email_sent', 'Email enviado', `mailto:${e.email}`)}
                    />
                  </div>

                  {/* Convertir */}
                  <div className="mt-2">
                    {e.status !== 'converted' ? (
                      <>
                        <button
                          onClick={onConvert}
                          disabled={converting}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 mt-2"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff' }}
                        >
                          {converting
                            ? <><SpinIcon />Convirtiendo…</>
                            : <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>Convertir a estudiante</>
                          }
                        </button>
                        {convertError && <p className="text-red-400 text-xs text-center mt-1.5">{convertError}</p>}
                      </>
                    ) : (
                      <a
                        href={convertedStudentId ? `/admin/students/${convertedStudentId}` : '/admin/students'}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[#ff9a3b] border border-[#ff7a00]/25 bg-[#ff7a00]/8 hover:bg-[#ff7a00]/15 transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                        Ver perfil del estudiante
                      </a>
                    )}
                  </div>
                </section>

                {/* Cambiar estado */}
                {e.status !== 'converted' && (
                  <section>
                    <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Mover a etapa</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COLUMNS.filter(c => c.status !== 'converted').map(col => (
                        <button
                          key={col.status}
                          onClick={() => onStatusChange(e.id, col.status)}
                          disabled={canonicalStatus(e.status) === col.status}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                            canonicalStatus(e.status) === col.status
                              ? `${PILL[col.status]} cursor-default`
                              : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Notas internas */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Notas internas</p>
                  <textarea
                    value={notesText}
                    onChange={ev => onNotesChange(ev.target.value)}
                    rows={3}
                    placeholder="Interesado en guitarra eléctrica, disponible tardes…"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30 resize-none transition-all leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-white/20">Solo visible para el equipo</span>
                    <button
                      onClick={onSaveNotes}
                      disabled={savingNotes}
                      className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                        notesSaved
                          ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                          : 'text-white/70 border border-white/15 hover:border-white/30 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {savingNotes ? 'Guardando…' : notesSaved ? '✓ Guardado' : 'Guardar'}
                    </button>
                  </div>
                </section>

                {/* Timeline */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-4">Historial</p>
                  {loadingEvents ? (
                    <p className="text-xs text-white/30 text-center py-4">Cargando…</p>
                  ) : events.length === 0 ? (
                    <p className="text-xs text-white/25 text-center py-4">Sin eventos registrados.</p>
                  ) : (
                    <ol className="space-y-0">
                      {events.map((ev, i) => (
                        <li key={ev.id} className="flex gap-4 pb-4 last:pb-0">
                          <div className="flex flex-col items-center">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/40 text-[10px]">•</span>
                            {i < events.length - 1 && <div className="w-px flex-1 bg-white/[0.07] mt-1" />}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm text-white/70">{ev.description}</p>
                            <p className="text-xs text-white/30 mt-0.5">
                              {new Date(ev.created_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── Micro-componentes ─────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/30 mb-0.5">{label}</p>
      <p className="text-sm text-white/75 font-medium">{value}</p>
    </div>
  )
}

function QuickBtn({ icon, label, hover, onClick }: { icon: React.ReactNode; label: string; hover: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 py-3 rounded-xl border border-white/[0.08] text-white/40 transition-all ${hover}`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  )
}

function SpinIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
    </svg>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function LeadsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[] | null>(null)
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<EnrollmentRow | null>(null)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [events, setEvents]           = useState<EnrollmentEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [notesText, setNotesText]     = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved]   = useState(false)
  const [converting, setConverting]   = useState(false)
  const [convertedStudentId, setConvertedStudentId] = useState<string | null>(null)
  const [convertError, setConvertError] = useState<string | null>(null)
  const [flash, setFlash]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await getEnrollments()
    setEnrollments(data as EnrollmentRow[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime
  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const ch = sb.channel('leads-pipeline')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enrollments' },
        ({ new: row }) => setEnrollments(prev => [row as EnrollmentRow, ...(prev ?? [])])
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'enrollments' },
        ({ new: row }) => {
          const updated = row as EnrollmentRow
          setEnrollments(prev => prev?.map(e => e.id === updated.id ? updated : e) ?? null)
          setSelected(prev => prev?.id === updated.id ? updated : prev)
        }
      )
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [])

  useEffect(() => {
    if (!selected) { setEvents([]); return }
    setLoadingEvents(true)
    getEnrollmentEvents(selected.id).then(setEvents).finally(() => setLoadingEvents(false))
  }, [selected?.id])

  useEffect(() => {
    setNotesText(selected?.internal_notes ?? '')
    setNotesSaved(false)
    setConvertError(null)
    setConvertedStudentId(selected?.converted_student_id ?? null)
  }, [selected?.id])

  // Columnas filtradas
  const columns = useMemo(() => {
    const all = enrollments ?? []
    const q   = search.trim().toLowerCase()
    const filtered = q
      ? all.filter(e =>
          e.student_name.toLowerCase().includes(q) ||
          e.phone.includes(q) ||
          e.course_interest.toLowerCase().includes(q)
        )
      : all

    return COLUMNS.map(col => ({
      ...col,
      items: filtered.filter(e => canonicalStatus(e.status) === col.status),
    }))
  }, [enrollments, search])

  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(null), 2500) }

  function openDrawer(e: EnrollmentRow) {
    setSelected(e)
    setConvertedStudentId(e.converted_student_id ?? null)
    setConvertError(null)
    setDrawerOpen(true)
  }

  async function reloadEvents() {
    if (!selected) return
    setEvents(await getEnrollmentEvents(selected.id))
  }

  async function handleStatusChange(id: string, status: string) {
    const fd = new FormData(); fd.set('id', id); fd.set('status', status)
    const r = await updateEnrollmentStatusAction({}, fd)
    if (r.success) {
      const upd = (prev: EnrollmentRow[] | null) =>
        prev?.map(e => e.id === id ? { ...e, status: status as EnrollmentRow['status'] } : e) ?? null
      setEnrollments(upd)
      if (selected?.id === id) {
        setSelected(prev => prev ? { ...prev, status: status as EnrollmentRow['status'] } : null)
        reloadEvents()
      }
      showFlash('Estado actualizado')
    }
  }

  async function handleQuickAction(type: 'whatsapp_sent' | 'called' | 'email_sent', desc: string, href: string) {
    window.open(href, '_blank')
    if (!selected) return
    await addEnrollmentEvent(selected.id, type, desc)
    reloadEvents()
  }

  async function handleSaveNotes() {
    if (!selected) return
    setSavingNotes(true)
    const { error } = await saveInternalNotes(selected.id, notesText)
    setSavingNotes(false)
    if (error) { showFlash('Error al guardar'); return }
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  async function handleConvert() {
    if (!selected) return
    if (!window.confirm(`¿Convertir a ${selected.student_name} en estudiante activo?`)) return
    setConverting(true); setConvertError(null)
    const r = await convertEnrollmentToStudent(selected.id)
    setConverting(false)
    if (r.error) { setConvertError(r.error); return }
    const now = new Date().toISOString()
    setConvertedStudentId(r.studentId ?? null)
    setSelected(prev => prev ? { ...prev, status: 'converted', converted_at: now, converted_student_id: r.studentId } : null)
    setEnrollments(prev =>
      prev?.map(e => e.id === selected.id
        ? { ...e, status: 'converted', converted_at: now, converted_student_id: r.studentId }
        : e
      ) ?? null
    )
    reloadEvents()
    showFlash('¡Estudiante creado!')
  }

  async function handleUpdateSource(source: string) {
    if (!selected) return
    const value = source || null
    await updateEnrollmentFieldsAction(selected.id, { source: value })
    setSelected(prev => prev ? { ...prev, source: value } : null)
    setEnrollments(prev => prev?.map(e => e.id === selected.id ? { ...e, source: value } : e) ?? null)
  }

  async function handleUpdateFollowup(date: string) {
    if (!selected) return
    const value = date ? `${date}T00:00:00Z` : null
    await updateEnrollmentFieldsAction(selected.id, { next_followup_at: value })
    setSelected(prev => prev ? { ...prev, next_followup_at: value } : null)
    setEnrollments(prev => prev?.map(e => e.id === selected.id ? { ...e, next_followup_at: value } : e) ?? null)
  }

  async function handleUpdateLostReason(reason: string) {
    if (!selected) return
    const value = reason || null
    await updateEnrollmentFieldsAction(selected.id, { lost_reason: value })
    setSelected(prev => prev ? { ...prev, lost_reason: value } : null)
    setEnrollments(prev => prev?.map(e => e.id === selected.id ? { ...e, lost_reason: value } : e) ?? null)
  }

  const total = enrollments?.length ?? 0

  return (
    <div className="space-y-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Pipeline Comercial</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {loading ? 'Cargando…' : `${total} leads en total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/enrollments"
            className="text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
          >
            Vista lista
          </Link>
          <button
            onClick={load}
            className="text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25"
          >
            Recargar
          </button>
        </div>
      </div>

      {flash && (
        <div className="px-4 py-2 rounded-lg bg-green-900/30 text-green-400 text-sm border border-green-500/20">{flash}</div>
      )}

      {/* Buscador */}
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar lead…"
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-white/30 text-sm">Cargando pipeline…</div>
      ) : (
        /* Kanban — scroll horizontal en mobile */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[900px]">
            {columns.map(col => (
              <div key={col.status} className="flex-1 min-w-[200px]">
                {/* Cabecera columna */}
                <div className={`flex items-center gap-2 mb-3 pb-2.5 border-b ${col.border}`}>
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.header.split(' ').find(c => c.startsWith('text-'))}`}>
                    {col.label}
                  </span>
                  <span className="ml-auto text-xs text-white/30 font-semibold">{col.items.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {col.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/[0.06] px-4 py-8 text-center">
                      <p className="text-xs text-white/20">Sin leads</p>
                    </div>
                  ) : (
                    col.items.map(e => (
                      <LeadCard
                        key={e.id}
                        enrollment={e}
                        onOpen={() => openDrawer(e)}
                        onMove={status => handleStatusChange(e.id, status)}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drawer */}
      <LeadDrawer
        enrollment={selected}
        open={drawerOpen}
        events={events}
        loadingEvents={loadingEvents}
        notesText={notesText}
        savingNotes={savingNotes}
        notesSaved={notesSaved}
        converting={converting}
        convertedStudentId={convertedStudentId}
        convertError={convertError}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
        onQuickAction={handleQuickAction}
        onNotesChange={v => { setNotesText(v); setNotesSaved(false) }}
        onSaveNotes={handleSaveNotes}
        onConvert={handleConvert}
        onUpdateSource={handleUpdateSource}
        onUpdateFollowup={handleUpdateFollowup}
        onUpdateLostReason={handleUpdateLostReason}
      />
    </div>
  )
}
