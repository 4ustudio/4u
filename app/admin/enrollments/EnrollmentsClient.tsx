'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  MdDescription, MdSwapHoriz, MdCall, MdEmail, MdEditNote, MdPersonAdd,
  MdClose, MdCheckCircle, MdVisibility, MdDownload, MdInfoOutline, MdRefresh, MdSearch,
} from 'react-icons/md'
import { FaWhatsapp } from 'react-icons/fa'
import {
  getEnrollments,
  getEnrollmentEvents,
  updateEnrollmentStatusAction,
  addEnrollmentEvent,
  saveInternalNotes,
  convertEnrollmentToStudent,
  getEnrollmentContract,
} from '../_actions/enrollments'
import type { EnrollmentRow, EnrollmentEvent } from '@/types/enrollment'
import type { EnrollmentContractDoc } from '../_actions/enrollments'

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
  contacted:    'bg-white/40',
  clase_prueba: 'bg-green-400',
  scheduled:    'bg-green-400',
  perdido:      'bg-red-500',
  cancelled:    'bg-red-500',
  converted:    'bg-[#ff7a00]',
}
const STATUS_PILL: Record<string, string> = {
  pending:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  contacted:    'bg-white/8 text-white/55 border-white/12',
  clase_prueba: 'bg-green-500/10 text-green-400 border-green-500/20',
  scheduled:    'bg-green-500/10 text-green-400 border-green-500/20',
  perdido:      'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled:    'bg-red-500/10 text-red-400 border-red-500/20',
  converted:    'bg-[#ff7a00]/12 text-[#ff9a3b] border-[#ff7a00]/25',
}
const LEVEL_LABEL: Record<string, string> = {
  never: 'Sin experiencia', beginner: 'Principiante',
  intermediate: 'Intermedio', advanced: 'Avanzado',
}
const EVENT_ICONS: Record<string, React.ReactNode> = {
  form_received:  <MdDescription className="h-3 w-3" />,
  status_changed: <MdSwapHoriz className="h-3 w-3" />,
  whatsapp_sent:  <FaWhatsapp className="h-3 w-3" />,
  called:         <MdCall className="h-3 w-3" />,
  email_sent:     <MdEmail className="h-3 w-3" />,
  note_added:     <MdEditNote className="h-3 w-3" />,
  converted:      <MdPersonAdd className="h-3 w-3" />,
}
const EVENT_COLORS: Record<string, string> = {
  form_received: 'text-white/40 bg-white/5',  status_changed: 'text-white/55 bg-white/8',
  whatsapp_sent: 'text-green-400 bg-green-400/10', called: 'text-yellow-400 bg-yellow-400/10',
  email_sent:    'text-orange-400 bg-orange-400/10', note_added: 'text-white/50 bg-white/5',
  converted:     'text-[#ff9a3b] bg-[#ff7a00]/10',
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
        { label: 'Contactados',  val: s.contacted,   c: 'text-white/55',  bg: 'bg-white/6 border-white/10' },
        { label: 'Clase Prueba', val: s.clasePrueba, c: 'text-green-400',  bg: 'bg-green-400/8 border-green-400/10' },
        { label: 'Matriculados', val: s.converted,   c: 'text-[#ff9a3b]', bg: 'bg-[#ff7a00]/8 border-[#ff7a00]/12' },
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
  contractDoc: EnrollmentContractDoc | null
  loadingContract: boolean
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
  contractDoc, loadingContract,
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
          ${open ? 'translate-x-0' : 'translate-x-[105%] pointer-events-none'}
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
                <MdClose className="h-5 w-5" />
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
                    <InfoRow label="Modalidad" value={e.student_type === 'self' ? 'Para sí mismo' : e.student_type === 'other' ? 'Para otra persona' : 'Para su hijo/a'} />
                    <InfoRow label="Curso"     value={e.course_interest} />
                    <InfoRow label="Nivel"     value={LEVEL_LABEL[e.level] ?? e.level} />
                    <InfoRow label="Hora pref." value={e.preferred_time} />
                    {e.notes?.match(/Día primera sesión:\s*(.+)/)?.[1] && (
                      <InfoRow label="Día 1ª sesión" value={e.notes.match(/Día primera sesión:\s*(.+)/)![1].trim()} />
                    )}
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
                      <FaWhatsapp className="h-4 w-4 text-green-400 shrink-0" />
                      <span className="text-sm text-white/70 font-mono group-hover:text-white transition-colors">{e.phone}</span>
                    </a>
                    <a
                      href={`mailto:${e.email}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group"
                    >
                      <MdEmail className="h-4 w-4 text-white/30 shrink-0" />
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

                {/* Documentación Legal */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Documentación legal</p>
                  {loadingContract ? (
                    <p className="text-xs text-white/30 py-2">Verificando contrato…</p>
                  ) : contractDoc ? (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                          <MdCheckCircle className="h-3 w-3" />
                          Contrato firmado
                        </span>
                        {contractDoc.document_version && (
                          <span className="text-[11px] text-white/30">v{contractDoc.document_version}</span>
                        )}
                      </div>
                      {contractDoc.signed_at && (
                        <p className="text-xs text-white/40">
                          Firmado el {new Date(contractDoc.signed_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      )}
                      {(contractDoc.viewUrl || contractDoc.downloadUrl) && (
                        <div className="flex gap-2 pt-0.5">
                          {contractDoc.viewUrl && (
                            <a
                              href={contractDoc.viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-white/60 border border-white/10 rounded-lg px-3 py-1.5 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                            >
                              <MdVisibility className="h-3.5 w-3.5" />
                              Ver PDF
                            </a>
                          )}
                          {contractDoc.downloadUrl && (
                            <a
                              href={contractDoc.downloadUrl}
                              download
                              className="flex items-center gap-1.5 text-xs font-medium text-white/60 border border-white/10 rounded-lg px-3 py-1.5 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                            >
                              <MdDownload className="h-3.5 w-3.5" />
                              Descargar
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/30 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                        <MdInfoOutline className="h-3 w-3" />
                        Sin contrato
                      </span>
                    </div>
                  )}
                </section>

                {/* Acciones rápidas */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Acciones rápidas</p>
                  <div className="grid grid-cols-3 gap-2">
                    <ActionBtn
                      icon={<FaWhatsapp className="h-4 w-4" />}
                      label="WhatsApp" hoverColor="hover:border-green-500/30 hover:bg-green-500/8 hover:text-green-400"
                      onClick={() => onQuickAction('whatsapp_sent', 'WhatsApp enviado', `https://wa.me/${cleanPhone(e.phone)}`)}
                    />
                    <ActionBtn
                      icon={<MdCall className="h-4 w-4" />}
                      label="Llamar" hoverColor="hover:border-yellow-500/30 hover:bg-yellow-500/8 hover:text-yellow-400"
                      onClick={() => onQuickAction('called', 'Llamada realizada', `tel:${cleanPhone(e.phone)}`)}
                    />
                    <ActionBtn
                      icon={<MdEmail className="h-4 w-4" />}
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
                            : <><MdPersonAdd className="h-4 w-4" />Convertir a estudiante</>
                          }
                        </button>
                        {convertError && <p className="text-red-400 text-xs text-center mt-1.5">{convertError}</p>}
                      </>
                    ) : (
                      <a
                        href={convertedStudentId ? `/admin/students/${convertedStudentId}` : '/admin/students'}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[#ff9a3b] border border-[#ff7a00]/25 bg-[#ff7a00]/8 hover:bg-[#ff7a00]/15 transition-colors"
                      >
                        <MdPersonAdd className="h-4 w-4" />
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
  return <MdRefresh className="h-4 w-4 animate-spin" />
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${color}`}>{children}</span>
}

// ── Página ────────────────────────────────────────────────────

export default function EnrollmentsClient({ initialEnrollments }: { initialEnrollments: EnrollmentRow[] }) {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[] | null>(initialEnrollments)
  const [reloading, setReloading]     = useState(false)
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
  const [contractDoc, setContractDoc] = useState<EnrollmentContractDoc | null>(null)
  const [loadingContract, setLoadingContract] = useState(false)

  const load = useCallback(async () => {
    setLoadError(null)
    const { data, error } = await getEnrollments()
    if (error) setLoadError(error)
    setEnrollments(data as EnrollmentRow[])
  }, [])

  const reload = useCallback(async () => {
    setReloading(true)
    await load()
    setReloading(false)
  }, [load])

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
    setContractDoc(null)
    setLoadingContract(true)
    getEnrollmentContract(e.id).then(doc => {
      setContractDoc(doc)
      setLoadingContract(false)
    }).catch(() => setLoadingContract(false))
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
    <div className="space-y-5 w-full overflow-x-hidden">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Inscripciones</h1>
          <p className="text-sm text-white/40 mt-0.5">CRM de prospectos</p>
        </div>
        <button
          onClick={reload}
          disabled={reloading}
          className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25 disabled:opacity-60"
        >
          {reloading && <SpinIcon />}
          {reloading ? 'Recargando…' : 'Recargar'}
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
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
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
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No hay inscripciones.</div>
      ) : (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
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
                        {isKid ? <Badge color="bg-white/8 text-white/55">Niño</Badge> : <Badge color="bg-white/5 text-white/30">Adulto</Badge>}
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
                        {isKid ? <Badge color="bg-white/8 text-white/55">Niño</Badge> : <Badge color="bg-white/5 text-white/30">Adulto</Badge>}
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
        contractDoc={contractDoc}
        loadingContract={loadingContract}
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
