'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  getEnrollments,
  getEnrollmentEvents,
  updateEnrollmentStatusAction,
  addEnrollmentEvent,
  saveInternalNotes,
  convertEnrollmentToStudent,
} from '../_actions/enrollments'
import type { EnrollmentRow, EnrollmentEvent } from '@/types/enrollment'

const ORANGE = '#ff7a00'

// ── Utilidades ───────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora mismo'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Ayer'
  if (d < 7)  return `Hace ${d} días`
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function isToday(iso: string): boolean {
  const d = new Date(iso), n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function cleanPhone(p: string) { return p.replace(/[^0-9]/g, '') }

// ── Labels & colores ─────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:      'Nuevo',
  contacted:    'Contactado',
  clase_prueba: 'Clase Prueba',
  scheduled:    'Clase Prueba',
  perdido:      'Perdido',
  cancelled:    'Perdido',
  converted:    'Matriculado',
}
const STATUS_DOT: Record<string, string> = {
  pending:      'bg-yellow-400',
  contacted:    'bg-blue-400',
  clase_prueba: 'bg-green-400',
  scheduled:    'bg-green-400',
  perdido:      'bg-red-500',
  cancelled:    'bg-red-500',
  converted:    'bg-purple-400',
}
const STATUS_PILL: Record<string, string> = {
  pending:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  contacted:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  clase_prueba: 'bg-green-500/10 text-green-400 border-green-500/20',
  scheduled:    'bg-green-500/10 text-green-400 border-green-500/20',
  perdido:      'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled:    'bg-red-500/10 text-red-400 border-red-500/20',
  converted:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
}
const LEVEL_LABEL: Record<string, string> = {
  never: 'Sin experiencia', beginner: 'Principiante',
  intermediate: 'Intermedio', advanced: 'Avanzado',
}
const EVENT_ICONS: Record<string, React.ReactNode> = {
  form_received:  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  status_changed: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  whatsapp_sent:  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  called:         <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17z"/></svg>,
  email_sent:     <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  note_added:     <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  converted:      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
}
const EVENT_COLORS: Record<string, string> = {
  form_received: 'text-white/40 bg-white/5',  status_changed: 'text-blue-400 bg-blue-400/10',
  whatsapp_sent: 'text-green-400 bg-green-400/10', called: 'text-yellow-400 bg-yellow-400/10',
  email_sent:    'text-orange-400 bg-orange-400/10', note_added: 'text-white/50 bg-white/5',
  converted:     'text-purple-400 bg-purple-400/10',
}

// ── Summary cards ────────────────────────────────────────────

function SummaryCards({ enrollments }: { enrollments: EnrollmentRow[] | null }) {
  const s = useMemo(() => {
    if (!enrollments) return { pending: 0, contacted: 0, clasePrueba: 0, converted: 0, perdido: 0 }
    return {
      pending:    enrollments.filter(e => e.status === 'pending').length,
      contacted:  enrollments.filter(e => e.status === 'contacted').length,
      clasePrueba: enrollments.filter(e => e.status === 'clase_prueba' || e.status === 'scheduled').length,
      converted:  enrollments.filter(e => e.status === 'converted').length,
      perdido:    enrollments.filter(e => e.status === 'perdido' || e.status === 'cancelled').length,
    }
  }, [enrollments])
  const decided = s.converted + s.perdido
  const convRate = decided > 0 ? Math.round((s.converted / decided) * 100) : null
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {([
        { label: 'Nuevos',       val: s.pending,     c: 'text-yellow-400', bg: 'bg-yellow-400/8 border-yellow-400/10' },
        { label: 'Contactados',  val: s.contacted,   c: 'text-blue-400',   bg: 'bg-blue-400/8 border-blue-400/10' },
        { label: 'Clase Prueba', val: s.clasePrueba, c: 'text-green-400',  bg: 'bg-green-400/8 border-green-400/10' },
        { label: 'Matriculados', val: s.converted,   c: 'text-purple-400', bg: 'bg-purple-400/8 border-purple-400/10' },
        { label: 'Perdidos',     val: s.perdido,     c: 'text-red-400',    bg: 'bg-red-400/8 border-red-400/10' },
      ] as const).map(card => (
        <div key={card.label} className={`rounded-xl border px-4 py-3 ${card.bg}`}>
          <p className={`text-2xl font-extrabold ${card.c}`}>{enrollments === null ? '—' : card.val}</p>
          <p className="text-xs text-white/40 mt-0.5 font-medium">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Drawer ───────────────────────────────────────────────────

interface DrawerProps {
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
  onNotesChange: (val: string) => void
  onSaveNotes: () => void
  onConvert: () => void
}

function Drawer({
  enrollment: e, open, events, loadingEvents,
  notesText, savingNotes, notesSaved, converting, convertedStudentId, convertError,
  onClose, onStatusChange, onQuickAction, onNotesChange, onSaveNotes, onConvert,
}: DrawerProps) {
  // Bloquear scroll del body y escuchar Escape
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
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[50] bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 right-0 h-screen z-[60] flex flex-col
          w-full sm:w-[520px] lg:w-[44vw] xl:w-[42vw] max-w-[680px]
          bg-[#0f0f0f] border-l border-white/[0.08]
          shadow-[−24px_0_80px_rgba(0,0,0,0.6)]
          transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {e && (
          <>
            {/* ── Header ── */}
            <div className="shrink-0 flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/[0.07]">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-bold text-white leading-tight">{e.student_name}</h2>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_PILL[e.status]}`}>
                    {STATUS_LABEL[e.status]}
                  </span>
                  {isToday(e.created_at) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-semibold">Nuevo hoy</span>
                  )}
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

            {/* ── Body scrollable ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* Info del prospecto */}
                <section>
                  <p className="section-label text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Prospecto</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <InfoRow label="Edad"      value={`${e.student_age} años`} />
                    <InfoRow label="Modalidad" value={e.student_type === 'self' ? 'Para sí mismo' : 'Para su hijo/a'} />
                    <InfoRow label="Curso"     value={e.course_interest} />
                    <InfoRow label="Nivel"     value={LEVEL_LABEL[e.level] ?? e.level} />
                    <InfoRow label="Hora pref." value={e.preferred_time} />
                    {e.guardian_name && <InfoRow label="Acudiente" value={e.guardian_name} />}
                  </div>
                </section>

                {/* Contacto */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Contacto</p>
                  <div className="space-y-2">
                    <a
                      href={`https://wa.me/${cleanPhone(e.phone)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group"
                    >
                      <svg className="h-4 w-4 text-green-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      <span className="text-sm text-white/70 font-mono group-hover:text-white transition-colors">{e.phone}</span>
                    </a>
                    <a
                      href={`mailto:${e.email}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group"
                    >
                      <svg className="h-4 w-4 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <span className="text-sm text-white/60 truncate group-hover:text-white transition-colors">{e.email}</span>
                    </a>
                  </div>
                </section>

                {e.notes && (
                  <section>
                    <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-2">Comentarios del formulario</p>
                    <p className="text-sm text-white/50 leading-relaxed bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.06] italic">{e.notes}</p>
                  </section>
                )}

                {/* Acciones rápidas */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Acciones rápidas</p>
                  <div className="grid grid-cols-3 gap-2">
                    <ActionBtn
                      icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>}
                      label="WhatsApp" hoverColor="hover:border-green-500/30 hover:bg-green-500/8 hover:text-green-400"
                      onClick={() => onQuickAction('whatsapp_sent', 'WhatsApp enviado', `https://wa.me/${cleanPhone(e.phone)}`)}
                    />
                    <ActionBtn
                      icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17z"/></svg>}
                      label="Llamar" hoverColor="hover:border-yellow-500/30 hover:bg-yellow-500/8 hover:text-yellow-400"
                      onClick={() => onQuickAction('called', 'Llamada realizada', `tel:${cleanPhone(e.phone)}`)}
                    />
                    <ActionBtn
                      icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                      label="Email" hoverColor="hover:border-orange-500/30 hover:bg-orange-500/8 hover:text-orange-400"
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
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff' }}
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
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-purple-300 border border-purple-500/25 bg-purple-500/8 hover:bg-purple-500/15 transition-colors"
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
                    <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Estado del lead</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(['pending', 'contacted', 'clase_prueba', 'perdido'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => onStatusChange(e.id, s)}
                          disabled={s === e.status}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                            s === e.status
                              ? `${STATUS_PILL[s]} cursor-default`
                              : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          {STATUS_LABEL[s]}
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
                    rows={4}
                    placeholder="Interesado en guitarra eléctrica, disponible tardes, mamá solicita info de precios…"
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
                      {savingNotes ? 'Guardando…' : notesSaved ? '✓ Guardado' : 'Guardar nota'}
                    </button>
                  </div>
                </section>

                {/* Timeline */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-4">Historial de seguimiento</p>
                  {loadingEvents ? (
                    <p className="text-xs text-white/30 text-center py-6">Cargando…</p>
                  ) : events.length === 0 ? (
                    <p className="text-xs text-white/25 text-center py-6">Sin eventos registrados.</p>
                  ) : (
                    <ol className="space-y-0">
                      {events.map((ev, i) => (
                        <li key={ev.id} className="flex gap-4 pb-5 last:pb-0">
                          <div className="flex flex-col items-center">
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${EVENT_COLORS[ev.type]}`}>
                              {EVENT_ICONS[ev.type]}
                            </span>
                            {i < events.length - 1 && <div className="w-px flex-1 bg-white/[0.07] mt-1.5" />}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-sm text-white/75">{ev.description}</p>
                            <p className="text-xs text-white/30 mt-0.5">{fmtDateTime(ev.created_at)}</p>
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

function ActionBtn({ icon, label, hoverColor, onClick }: { icon: React.ReactNode; label: string; hoverColor: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 py-3.5 rounded-xl border border-white/[0.08] text-white/40 transition-all ${hoverColor}`}
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

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${color}`}>{children}</span>
}

// ── Página ────────────────────────────────────────────────────

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[] | null>(null)
  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState<string | null>(null)
  const [selected, setSelected]       = useState<EnrollmentRow | null>(null)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [newIds, setNewIds]           = useState<Set<string>>(new Set())
  const [filter, setFilter]           = useState('all')
  const [search, setSearch]           = useState('')
  const [events, setEvents]           = useState<EnrollmentEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [notesText, setNotesText]     = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved]   = useState(false)
  const [converting, setConverting]   = useState(false)
  const [convertedStudentId, setConvertedStudentId] = useState<string | null>(null)
  const [convertError, setConvertError] = useState<string | null>(null)
  const [flash, setFlash]             = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await getEnrollments()
    if (error) setLoadError(error)
    setEnrollments(data as EnrollmentRow[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Supabase Realtime: datos del CRM ───────────────────────
  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const ch = sb
      .channel('crm-enrollments-data')
      // Nueva inscripción → agregar al inicio de la lista con animación
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enrollments' },
        ({ new: row }) => {
          const newRow = row as EnrollmentRow
          setEnrollments(prev => [newRow, ...(prev ?? [])])
          setNewIds(prev => {
            const next = new Set(prev)
            next.add(newRow.id)
            // Quitar el badge de "nuevo" después de 8 s
            setTimeout(() => setNewIds(p => { const s = new Set(p); s.delete(newRow.id); return s }), 8000)
            return next
          })
        }
      )
      // Actualización (estado, notas, conversión)
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

  const filtered = useMemo(() => {
    if (!enrollments) return []
    let list = filter === 'all'
      ? enrollments
      : filter === 'clase_prueba'
        ? enrollments.filter(e => e.status === 'clase_prueba' || e.status === 'scheduled')
        : filter === 'perdido'
          ? enrollments.filter(e => e.status === 'perdido' || e.status === 'cancelled')
          : enrollments.filter(e => e.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.student_name.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        e.course_interest.toLowerCase().includes(q)
      )
    }
    return list
  }, [enrollments, filter, search])

  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(null), 2500) }

  function openDrawer(e: EnrollmentRow) {
    setSelected(e)
    setConvertedStudentId(e.converted_student_id ?? null)
    setConvertError(null)
    setDrawerOpen(true)
  }

  function closeDrawer() { setDrawerOpen(false) }

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
    setEnrollments(prev => prev?.map(e => e.id === selected.id ? { ...e, internal_notes: notesText } : e) ?? null)
    setNotesSaved(true)
    reloadEvents()
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
    showFlash('¡Estudiante creado exitosamente!')
  }

  const FILTERS = ['all', 'pending', 'contacted', 'clase_prueba', 'converted', 'perdido']
  const FILTER_LABEL: Record<string, string> = {
    all:          'Todos',
    pending:      'Nuevos',
    contacted:    'Contactados',
    clase_prueba: 'Clase Prueba',
    converted:    'Matriculados',
    perdido:      'Perdidos',
  }

  return (
    <div className="space-y-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Inscripciones</h1>
          <p className="text-sm text-white/40 mt-0.5">CRM de prospectos</p>
        </div>
        <button onClick={load} className="text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25">
          Recargar
        </button>
      </div>

      {flash && (
        <div className="px-4 py-2 rounded-lg bg-green-900/30 text-green-400 text-sm border border-green-500/20">{flash}</div>
      )}

      {loadError && (
        <div className="px-4 py-2 rounded-lg bg-red-900/30 text-red-400 text-sm border border-red-500/20">
          Error cargando inscripciones: {loadError}
        </div>
      )}

      <SummaryCards enrollments={enrollments} />

      {/* Barra de búsqueda + filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono…"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filter === s ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              style={filter === s ? { backgroundColor: ORANGE } : { backgroundColor: 'rgba(255,255,255,0.06)' }}
            >
              {FILTER_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista — ocupa todo el ancho */}
      {loading ? (
        <div className="text-center py-16 text-white/30 text-sm">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No hay inscripciones.</div>
      ) : (
        <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
          {/* Cabecera de tabla */}
          <div className="hidden sm:grid grid-cols-[auto_1fr_140px_140px_120px_100px] gap-4 px-4 py-2.5 border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-white/25 font-semibold">
            <span className="w-2" />
            <span>Prospecto</span>
            <span>Curso</span>
            <span>Contacto</span>
            <span>Recibido</span>
            <span className="text-right">Estado</span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {filtered.map(e => {
              const isNew    = isToday(e.created_at)
              const isKid    = e.student_age < 18
              const isJustIn = newIds.has(e.id)

              return (
                <button
                  key={e.id}
                  onClick={() => openDrawer(e)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-white/[0.025] transition-all group ${
                    isJustIn ? 'bg-orange-500/[0.05] animate-pulse-once' : ''
                  }`}
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden flex items-start gap-3">
                    <span className={`mt-1.5 block w-2 h-2 shrink-0 rounded-full ${STATUS_DOT[e.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-white">{e.student_name}</span>
                        {isNew && <Badge color="bg-orange-500/15 text-orange-400">Nuevo</Badge>}
                        {isKid ? <Badge color="bg-sky-500/10 text-sky-400">Niño</Badge> : <Badge color="bg-white/5 text-white/30">Adulto</Badge>}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{e.student_age} años · {e.course_interest}</p>
                      <p className="text-xs text-white/50 font-mono mt-0.5">{e.phone}</p>
                    </div>
                    <span className="text-[11px] text-white/30 shrink-0 whitespace-nowrap">{timeAgo(e.created_at)}</span>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:grid grid-cols-[auto_1fr_140px_140px_120px_100px] gap-4 items-center">
                    <span className={`block w-2 h-2 shrink-0 rounded-full ${STATUS_DOT[e.status]}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors truncate">{e.student_name}</span>
                        {isNew && <Badge color="bg-orange-500/15 text-orange-400">Nuevo</Badge>}
                        {isKid ? <Badge color="bg-sky-500/10 text-sky-400">Niño</Badge> : <Badge color="bg-white/5 text-white/30">Adulto</Badge>}
                      </div>
                      <p className="text-xs text-white/35 mt-0.5">{e.student_age} años</p>
                    </div>
                    <span className="text-xs text-white/55 truncate">{e.course_interest}</span>
                    <span className="text-xs text-white/50 font-mono truncate">{e.phone}</span>
                    <span className="text-xs text-white/30">{timeAgo(e.created_at)}</span>
                    <span className={`text-right`}>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_PILL[e.status]}`}>
                        {STATUS_LABEL[e.status]}
                      </span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Drawer */}
      <Drawer
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
        onClose={closeDrawer}
        onStatusChange={handleStatusChange}
        onQuickAction={handleQuickAction}
        onNotesChange={v => { setNotesText(v); setNotesSaved(false) }}
        onSaveNotes={handleSaveNotes}
        onConvert={handleConvert}
      />
    </div>
  )
}
