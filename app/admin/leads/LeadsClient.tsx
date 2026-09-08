'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  MdArrowForward, MdEvent, MdClose, MdEmail, MdCall, MdPersonAdd, MdRefresh, MdSearch,
  MdViewKanban, MdViewList, MdExpandMore,
} from 'react-icons/md'
import {
  getEnrollments,
  getEnrollmentEvents,
  updateEnrollmentStatusAction,
  addEnrollmentEvent,
  saveInternalNotes,
  convertEnrollmentToStudent,
  updateEnrollmentFieldsAction,
  scheduleTrialClassAction,
} from '../_actions/enrollments'
import type { EnrollmentRow, EnrollmentEvent, EnrollmentSource } from '@/types/enrollment'
import WhatsAppButton from '@/components/admin/WhatsAppButton'

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

const FILTERS = ['all', 'pending', 'contacted', 'clase_prueba', 'converted', 'perdido'] as const
const FILTER_LABEL: Record<string, string> = {
  all: 'Todos', pending: 'Nuevos', contacted: 'Contactados',
  clase_prueba: 'Clase Prueba', converted: 'Matriculados', perdido: 'Perdidos',
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
  onDragStart,
  onDragEnd,
  dragging,
}: {
  enrollment: EnrollmentRow
  onOpen: () => void
  onMove: (status: KanbanStatus) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  dragging: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const canonical = canonicalStatus(e.status)
  const nextSteps = COLUMNS.filter(c => c.status !== canonical && c.status !== 'converted')

  return (
    <div
      draggable
      onDragStart={ev => { ev.dataTransfer.setData('text/plain', e.id); ev.dataTransfer.effectAllowed = 'move'; onDragStart(e.id) }}
      onDragEnd={onDragEnd}
      className={`relative bg-[#0f0f0f] border border-white/[0.08] rounded-xl p-4 hover:border-white/15 transition-all group cursor-grab active:cursor-grabbing ${dragging ? 'opacity-40' : ''}`}
    >

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
              <MdArrowForward className="h-3.5 w-3.5" aria-hidden="true" />
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
      <div className="flex items-center gap-2 text-xs text-white/35">
        <span className="text-white/40 font-mono">{e.phone}</span>
        <span onClick={ev => ev.stopPropagation()}>
          <WhatsAppButton
            phone={e.phone}
            template="lead_follow_up"
            vars={{ name: e.student_name, course: e.course_interest }}
            entityType="lead"
            entityId={e.id}
            variant="icon"
          />
        </span>
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
          <MdEvent className="h-3 w-3" aria-hidden="true" />
          Seguimiento: {new Date(e.next_followup_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
        </div>
      )}

      {e.trial_date && e.trial_time && (
        <div className="mt-2 text-[10px] text-green-400/70 flex items-center gap-1">
          <MdEvent className="h-3 w-3" aria-hidden="true" />
          Clase prueba: {new Date(e.trial_date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {e.trial_time.slice(0, 5)}
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
  instructors,
}: {
  enrollment: EnrollmentRow | null
  instructors: { id: string; name: string }[]
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

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return createPortal(
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
          ${open ? 'translate-x-0' : 'translate-x-[105%] pointer-events-none'}
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
                {e.trial_date && e.trial_time && (
                  <p className="text-xs text-green-400/80 mt-1 flex items-center gap-1">
                    <MdEvent className="h-3.5 w-3.5" aria-hidden="true" />
                    Clase prueba: {new Date(e.trial_date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })} · {e.trial_time.slice(0, 5)}
                    {e.trial_instructor_id && ` · ${instructors.find(i => i.id === e.trial_instructor_id)?.name ?? ''}`}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="mt-0.5 shrink-0 text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5"
              >
                <MdClose className="h-5 w-5" aria-hidden="true" />
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
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-sm text-white/70 font-mono">{e.phone}</span>
                      <WhatsAppButton
                        phone={e.phone}
                        template="lead_follow_up"
                        vars={{ name: e.student_name, course: e.course_interest }}
                        entityType="lead"
                        entityId={e.id}
                        variant="pill"
                      />
                    </div>
                    {e.email && (
                      <a href={`mailto:${e.email}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group">
                        <MdEmail className="h-4 w-4 text-white/30 shrink-0" aria-hidden="true" />
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
                      <PopupSelect
                        value={e.source ?? ''}
                        onChange={onUpdateSource}
                        options={SOURCES}
                        placeholder="Sin fuente"
                      />
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
                    <PopupSelect
                      value={e.lost_reason ?? ''}
                      onChange={onUpdateLostReason}
                      options={LOST_REASONS.map(r => ({ value: r, label: r }))}
                      placeholder="Seleccionar razón…"
                    />
                  </section>
                )}

                {/* Acciones rápidas */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Acciones rápidas</p>
                  <div className="grid grid-cols-3 gap-2">
                    <WhatsAppButton
                      phone={e.phone}
                      template="lead_follow_up"
                      vars={{ name: e.student_name, course: e.course_interest }}
                      entityType="lead"
                      entityId={e.id}
                      variant="pill"
                    />
                    <QuickBtn
                      icon={<MdCall className="h-4 w-4" aria-hidden="true" />}
                      label="Llamar"
                      hover="hover:border-yellow-500/30 hover:bg-yellow-500/8 hover:text-yellow-400"
                      onClick={() => onQuickAction('called', 'Llamada realizada', `tel:${cleanPhone(e.phone)}`)}
                    />
                    <QuickBtn
                      icon={<MdEmail className="h-4 w-4" aria-hidden="true" />}
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
                            : <><MdPersonAdd className="h-4 w-4" aria-hidden="true" />Convertir a estudiante</>
                          }
                        </button>
                        {convertError && <p className="text-red-400 text-xs text-center mt-1.5">{convertError}</p>}
                      </>
                    ) : (
                      <a
                        href={convertedStudentId ? `/admin/students/${convertedStudentId}` : '/admin/students'}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[#ff9a3b] border border-[#ff7a00]/25 bg-[#ff7a00]/8 hover:bg-[#ff7a00]/15 transition-colors"
                      >
                        <MdPersonAdd className="h-4 w-4" aria-hidden="true" />
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
    </>,
    document.body
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
    <MdRefresh className="h-4 w-4 animate-spin" aria-hidden="true" />
  )
}

function PopupSelect({
  value, onChange, options, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30 text-left"
      >
        <span className={`truncate ${selected ? '' : 'text-white/30'}`}>{selected?.label ?? placeholder}</span>
        <MdExpandMore className="h-4 w-4 text-white/30 shrink-0" aria-hidden="true" />
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={ev => ev.stopPropagation()}
            className="w-full max-w-xs max-h-[70vh] overflow-y-auto rounded-2xl bg-[#141414] border border-white/10 py-2 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              {placeholder}
            </button>
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  o.value === value ? 'text-orange-400 bg-orange-500/10' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function ConfirmModal({
  open, title, message, confirmLabel = 'Aceptar', onConfirm, onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={ev => ev.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[#141414] border border-white/10 p-5 shadow-2xl"
      >
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-sm text-white/60 mt-2">{message}</p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs px-4 py-2 rounded-lg font-semibold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="text-xs px-4 py-2 rounded-lg font-semibold text-white transition-colors"
            style={{ background: '#ff7a00' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${color}`}>{children}</span>
}

const inputClass = 'w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30 disabled:opacity-50'

function TrialClassModal({
  studentName, instructors, onCancel, onSchedule,
}: {
  studentName: string
  instructors: { id: string; name: string }[]
  onCancel: () => void
  onSchedule: (date: string, time: string, instructorId: string) => Promise<string | void>
}) {
  const [mounted, setMounted]         = useState(false)
  const [date, setDate]               = useState('')
  const [time, setTime]               = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!date || !time || !instructorId) return
    setSubmitting(true); setError(null)
    const err = await onSchedule(date, time, instructorId)
    setSubmitting(false)
    if (err) setError(err)
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6" onClick={onCancel}>
      <form
        onClick={ev => ev.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-[#141414] border border-white/10 p-5 shadow-2xl space-y-3"
      >
        <div>
          <h3 className="text-sm font-bold text-white">Agendar clase de prueba</h3>
          <p className="text-xs text-white/40 mt-0.5">{studentName} · primera sesión de reconocimiento</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Fecha *</label>
            <input type="date" required disabled={submitting} value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Hora *</label>
            <input type="time" required disabled={submitting} value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Instructor *</label>
          <select required disabled={submitting} value={instructorId} onChange={e => setInstructorId(e.target.value)} className={inputClass + ' appearance-none'}>
            <option value="" disabled>Selecciona un instructor</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} disabled={submitting} className="text-xs px-4 py-2 rounded-lg font-semibold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="text-xs px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50" style={{ background: '#ff7a00' }}>
            {submitting ? 'Agendando…' : 'Agendar'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}

function ViewToggle({ view, onChange }: { view: 'kanban' | 'lista'; onChange: (v: 'kanban' | 'lista') => void }) {
  const options = [
    { value: 'kanban' as const, label: 'Kanban', icon: <MdViewKanban className="h-3.5 w-3.5" aria-hidden="true" /> },
    { value: 'lista' as const, label: 'Lista', icon: <MdViewList className="h-3.5 w-3.5" aria-hidden="true" /> },
  ]
  return (
    <div className="flex items-center p-[3px] rounded-[10px] bg-white/[0.04] border border-white/[0.08]">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            view === opt.value ? 'bg-[#ff7a00] text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SummaryCards({ enrollments }: { enrollments: EnrollmentRow[] | null }) {
  const s = useMemo(() => {
    if (!enrollments) return { pending: 0, contacted: 0, clasePrueba: 0, converted: 0, perdido: 0 }
    return {
      pending:     enrollments.filter(e => e.status === 'pending').length,
      contacted:   enrollments.filter(e => e.status === 'contacted').length,
      clasePrueba: enrollments.filter(e => e.status === 'clase_prueba' || e.status === 'scheduled').length,
      converted:   enrollments.filter(e => e.status === 'converted').length,
      perdido:     enrollments.filter(e => e.status === 'perdido' || e.status === 'cancelled').length,
    }
  }, [enrollments])
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {([
        { label: 'Nuevos',       val: s.pending,      c: 'text-yellow-400', bg: 'bg-yellow-400/8 border-yellow-400/10' },
        { label: 'Contactados',  val: s.contacted,    c: 'text-white/55',   bg: 'bg-white/6 border-white/10' },
        { label: 'Clase Prueba', val: s.clasePrueba,  c: 'text-green-400',  bg: 'bg-green-400/8 border-green-400/10' },
        { label: 'Matriculados', val: s.converted,    c: 'text-[#ff9a3b]',  bg: 'bg-[#ff7a00]/8 border-[#ff7a00]/12' },
        { label: 'Perdidos',     val: s.perdido,      c: 'text-red-400',    bg: 'bg-red-400/8 border-red-400/10' },
      ] as const).map(card => (
        <div key={card.label} className={`rounded-xl border px-4 py-3 ${card.bg}`}>
          <p className={`text-2xl font-extrabold ${card.c}`}>{enrollments === null ? '—' : card.val}</p>
          <p className="text-xs text-white/40 mt-0.5 font-medium">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function LeadsClient({ initialEnrollments, instructors }: { initialEnrollments: EnrollmentRow[]; instructors: { id: string; name: string }[] }) {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[] | null>(initialEnrollments)
  const [reloading, setReloading]     = useState(false)
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
  const [draggingId, setDraggingId]   = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<KanbanStatus | null>(null)
  const searchParams = useSearchParams()
  const urlView = searchParams.get('view')
  const urlEstado = searchParams.get('estado') as typeof FILTERS[number] | null
  const [view, setView]               = useState<'kanban' | 'lista'>(urlView === 'lista' ? 'lista' : 'kanban')
  const [statusFilter, setStatusFilter] = useState<typeof FILTERS[number]>(
    urlEstado && FILTERS.includes(urlEstado) ? urlEstado : 'all'
  )
  const [confirmConvertOpen, setConfirmConvertOpen] = useState(false)
  const [trialModalId, setTrialModalId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await getEnrollments()
    setEnrollments(data as EnrollmentRow[])
  }, [])

  const reload = useCallback(async () => {
    setReloading(true)
    await load()
    setReloading(false)
  }, [load])

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

  // Lista filtrada (vista tabla)
  const listaFiltered = useMemo(() => {
    if (!enrollments) return []
    let list = statusFilter === 'all' ? enrollments : enrollments.filter(e => canonicalStatus(e.status) === statusFilter)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(e =>
        e.student_name.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        e.course_interest.toLowerCase().includes(q)
      )
    }
    return list
  }, [enrollments, statusFilter, search])

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
    if (status === 'clase_prueba') { setTrialModalId(id); return }
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

  async function handleScheduleTrial(date: string, time: string, instructorId: string): Promise<string | void> {
    if (!trialModalId) return
    const fd = new FormData()
    fd.set('id', trialModalId); fd.set('trial_date', date); fd.set('trial_time', time); fd.set('instructor_id', instructorId)
    const r = await scheduleTrialClassAction({}, fd)
    if (r.error) return r.error
    const patch = { status: 'clase_prueba' as const, trial_date: date, trial_time: time, trial_instructor_id: instructorId }
    setEnrollments(prev => prev?.map(e => e.id === trialModalId ? { ...e, ...patch } : e) ?? null)
    if (selected?.id === trialModalId) {
      setSelected(prev => prev ? { ...prev, ...patch } : prev)
      reloadEvents()
    }
    setTrialModalId(null)
    showFlash('Clase de prueba agendada')
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

  function handleConvert() {
    if (!selected) return
    setConfirmConvertOpen(true)
  }

  async function doConvert() {
    if (!selected) return
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
    <div className="space-y-5 w-full overflow-x-hidden">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Leads &amp; Matrículas</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {total} leads en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <button
            onClick={reload}
            disabled={reloading}
            className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25 disabled:opacity-60"
          >
            {reloading && <SpinIcon />}
            {reloading ? 'Recargando…' : 'Recargar'}
          </button>
        </div>
      </div>

      {flash && (
        <div className="px-4 py-2 rounded-lg bg-green-900/30 text-green-400 text-sm border border-green-500/20">{flash}</div>
      )}

      {view === 'lista' && <SummaryCards enrollments={enrollments} />}

      {/* Buscador (+ filtros en vista lista) */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative max-w-xs w-full">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" aria-hidden="true" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={view === 'kanban' ? 'Buscar lead…' : 'Buscar por nombre, teléfono…'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
          />
        </div>
        {view === 'lista' && (
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${statusFilter === s ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                style={statusFilter === s ? { backgroundColor: '#ff7a00' } : { backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                {FILTER_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === 'kanban' ? (
        <>
          {/* Barra de estados */}
          <div className="flex items-center gap-x-6 gap-y-2 flex-wrap pb-2.5 border-b border-white/[0.08]">
            {COLUMNS.map(col => (
              <div key={col.status} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${col.header.split(' ').find(c => c.startsWith('text-'))}`}>
                  {col.label}
                </span>
                <span className="text-xs text-white/30 font-semibold">
                  {columns.find(c => c.status === col.status)?.items.length ?? 0}
                </span>
              </div>
            ))}
          </div>

          {/* Kanban — scroll horizontal en mobile */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[900px]">
              {columns.map(col => (
                <div
                  key={col.status}
                  className="flex-1 min-w-[200px]"
                  onDragOver={ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; setDragOverCol(col.status) }}
                  onDragLeave={() => setDragOverCol(prev => (prev === col.status ? null : prev))}
                  onDrop={ev => {
                    ev.preventDefault()
                    const id = ev.dataTransfer.getData('text/plain')
                    setDragOverCol(null)
                    setDraggingId(null)
                    if (id) handleStatusChange(id, col.status)
                  }}
                >
                  {/* Cards */}
                  <div className={`space-y-3 min-h-[80px] rounded-xl transition-colors ${dragOverCol === col.status ? 'ring-2 ring-orange-500/40 bg-orange-500/[0.04]' : ''}`}>
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
                          onDragStart={setDraggingId}
                          onDragEnd={() => { setDraggingId(null); setDragOverCol(null) }}
                          dragging={draggingId === e.id}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Vista lista */
        listaFiltered.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">No hay inscripciones.</div>
        ) : (
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[auto_1fr_140px_140px_120px_100px] gap-4 px-4 py-2.5 border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-white/25 font-semibold">
              <span className="w-2" />
              <span>Prospecto</span>
              <span>Curso</span>
              <span>Contacto</span>
              <span>Recibido</span>
              <span className="text-right">Estado</span>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {listaFiltered.map(e => {
                const isNew = isToday(e.created_at)
                const isKid = e.student_age < 18
                const canonical = canonicalStatus(e.status)
                return (
                  <button
                    key={e.id}
                    onClick={() => openDrawer(e)}
                    className="w-full text-left px-4 py-3.5 hover:bg-white/[0.025] transition-all group"
                  >
                    {/* Mobile */}
                    <div className="sm:hidden flex items-start gap-3">
                      <span className={`mt-1.5 block w-2 h-2 shrink-0 rounded-full ${COLUMNS.find(c => c.status === canonical)?.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-white">{e.student_name}</span>
                          {isNew && <Badge color="bg-orange-500/15 text-orange-400">Nuevo</Badge>}
                          {isKid ? <Badge color="bg-white/8 text-white/55">Niño</Badge> : <Badge color="bg-white/5 text-white/30">Adulto</Badge>}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{e.student_age} años · {e.course_interest}</p>
                        <p className="text-xs text-white/50 font-mono mt-0.5">{e.phone}</p>
                      </div>
                      <span className="text-[11px] text-white/30 shrink-0 whitespace-nowrap">{timeAgo(e.created_at)}</span>
                    </div>

                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-[auto_1fr_140px_140px_120px_100px] gap-4 items-center">
                      <span className={`block w-2 h-2 shrink-0 rounded-full ${COLUMNS.find(c => c.status === canonical)?.dot}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors truncate">{e.student_name}</span>
                          {isNew && <Badge color="bg-orange-500/15 text-orange-400">Nuevo</Badge>}
                          {isKid ? <Badge color="bg-white/8 text-white/55">Niño</Badge> : <Badge color="bg-white/5 text-white/30">Adulto</Badge>}
                        </div>
                        <p className="text-xs text-white/35 mt-0.5">{e.student_age} años</p>
                      </div>
                      <span className="text-xs text-white/55 truncate">{e.course_interest}</span>
                      <span className="text-xs text-white/50 font-mono truncate">{e.phone}</span>
                      <span className="text-xs text-white/30">{timeAgo(e.created_at)}</span>
                      <span className="text-right">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${PILL[e.status]}`}>
                          {COLUMNS.find(c => c.status === canonical)?.label ?? e.status}
                        </span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      )}

      {/* Drawer */}
      <LeadDrawer
        enrollment={selected}
        instructors={instructors}
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

      {trialModalId && (
        <TrialClassModal
          studentName={enrollments?.find(e => e.id === trialModalId)?.student_name ?? ''}
          instructors={instructors}
          onCancel={() => setTrialModalId(null)}
          onSchedule={handleScheduleTrial}
        />
      )}

      <ConfirmModal
        open={confirmConvertOpen}
        title="Convertir a estudiante"
        message={`¿Convertir a ${selected?.student_name ?? ''} en estudiante activo?`}
        confirmLabel="Convertir"
        onCancel={() => setConfirmConvertOpen(false)}
        onConfirm={() => { setConfirmConvertOpen(false); doConvert() }}
      />
    </div>
  )
}
