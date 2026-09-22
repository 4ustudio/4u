'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MdAdd, MdSearch, MdShield, MdChevronRight, MdGroup, MdCheckCircle,
  MdTrendingUp, MdCalendarMonth, MdSchedule, MdSchool, MdAutorenew,
  MdFilterList, MdMoreVert, MdMusicNote, MdKeyboardArrowLeft, MdKeyboardArrowRight,
} from 'react-icons/md'
import type { StudentListRow, StudentsKpis } from '../_actions/students'
import { isBirthdayMonth } from '@/lib/students/birthday'
import WhatsAppButton from '@/components/admin/WhatsAppButton'

const ORANGE = '#ff7a00'

// ── Utilidades ────────────────────────────────────────────────

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function calcAge(birth: string | null): number | null {
  if (!birth) return null
  const diff = Date.now() - new Date(birth).getTime()
  return Math.floor(diff / 31557600000)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso), n = new Date()
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

const DAY_SHORT: Record<number, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom',
}

function fmtShortDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

// Estimado a partir de la fecha de inicio del horario + cuota mensual de clases,
// asumiendo el mismo ritmo semanal (occurrencesPerWeek horarios activos).
function estimateEndDate(activeFrom: string, quotaTotal: number, occurrencesPerWeek: number): string {
  const weeksNeeded = Math.ceil(quotaTotal / occurrencesPerWeek)
  const d = new Date(activeFrom + 'T12:00:00')
  d.setDate(d.getDate() + (weeksNeeded - 1) * 7)
  return d.toISOString().split('T')[0]
}

// Cada clase dura 1 hora — el fin se calcula sumando 1h al inicio.
function fmtTimeRange(startTime: string): string {
  const [h, m] = startTime.slice(0, 5).split(':').map(Number)
  const end = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  return `${startTime.slice(0, 5)}–${end}`
}

function isSameDate(a: string, b: Date): boolean {
  const d = new Date(a + 'T12:00:00')
  return d.getDate() === b.getDate() && d.getMonth() === b.getMonth() && d.getFullYear() === b.getFullYear()
}

function nextClassLabel(dateStr: string): { text: string; tone: 'today' | 'soon' } {
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (isSameDate(dateStr, today)) return { text: 'Hoy', tone: 'today' }
  if (isSameDate(dateStr, tomorrow)) return { text: 'Mañana', tone: 'soon' }
  const d = new Date(dateStr + 'T12:00:00')
  return { text: d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }), tone: 'soon' }
}

const COURSE_COLORS = [
  'bg-orange-500/10 text-orange-400',
  'bg-purple-500/10 text-purple-400',
  'bg-blue-500/10 text-blue-400',
  'bg-pink-500/10 text-pink-400',
  'bg-green-500/10 text-green-400',
]
function courseColor(name: string): string {
  const idx = name.charCodeAt(0) % COURSE_COLORS.length
  return COURSE_COLORS[idx]
}

// ── Colores ───────────────────────────────────────────────────

const STATUS_PILL: Record<string, string> = {
  lead:        'bg-white/8 text-white/55 border-white/10',
  matriculado: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  activo:      'bg-green-500/10 text-green-400 border-green-500/20',
  riesgo:      'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  inactivo:    'bg-red-500/10 text-red-300 border-red-500/20',
  exalumno:    'bg-white/5 text-white/35 border-white/10',
  active:      'bg-green-500/10 text-green-400 border-green-500/20',
  inactive:    'bg-white/5 text-white/35 border-white/10',
  suspended:   'bg-red-500/10 text-red-400 border-red-500/20',
}
const STATUS_LABEL: Record<string, string> = {
  lead: 'Lead', matriculado: 'Matriculado', activo: 'Activo', riesgo: 'Riesgo', inactivo: 'Inactivo', exalumno: 'Exalumno',
  active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido',
}

const AVATAR_COLORS = [
  'bg-orange-500/20 text-orange-300',
  'bg-white/10 text-white/60',
  'bg-purple-500/20 text-purple-300',
  'bg-green-500/20 text-green-300',
  'bg-pink-500/20 text-pink-300',
  'bg-yellow-500/20 text-yellow-300',
]

function avatarColor(id: string): string {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// ── Anillo de progreso ───────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#fb923c' : '#f87171'
  const r = 15, c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <div className="relative h-9 w-9 shrink-0">
      <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" className="text-white/10" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────────

function KpiCard({ icon, color, value, label, sublabel, href, linkLabel }: {
  icon: React.ReactNode
  color: string
  value: string | number
  label: string
  sublabel?: string
  href?: string
  linkLabel?: string
}) {
  const content = (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 h-full">
      <div className="flex items-start justify-between gap-2">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
        {!href && <MdChevronRight className="h-4 w-4 text-white/15" />}
      </div>
      <p className="text-2xl font-extrabold text-white mt-3">{value}</p>
      <p className="text-xs text-white/50 mt-0.5">{label}</p>
      {sublabel && <p className="text-[10px] text-white/25 mt-0.5">{sublabel}</p>}
      {href && linkLabel && (
        <p className="text-[11px] font-semibold mt-2" style={{ color: ORANGE }}>{linkLabel} →</p>
      )}
    </div>
  )
  return href ? <Link href={href} className="block h-full hover:border-white/20 transition-colors">{content}</Link> : content
}

// ── Página principal ──────────────────────────────────────────

const SORTS = {
  name:     { label: 'Nombre A-Z', fn: (a: StudentListRow, b: StudentListRow) => a.name.localeCompare(b.name) },
  recent:   { label: 'Más recientes', fn: (a: StudentListRow, b: StudentListRow) => +new Date(b.enrolled_at) - +new Date(a.enrolled_at) },
  progress: { label: 'Progreso', fn: (a: StudentListRow, b: StudentListRow) => (b.progress?.completed ?? -1) / (b.progress?.total || 1) - (a.progress?.completed ?? -1) / (a.progress?.total || 1) },
} as const

export default function StudentsClient({ initialStudents, kpis }: { initialStudents: StudentListRow[]; kpis: StudentsKpis }) {
  const router = useRouter()
  const [students] = useState<StudentListRow[]>(initialStudents)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<keyof typeof SORTS>('recent')
  const [sortOpen, setSortOpen] = useState(false)
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(10)
  const [deletedToast, setDeletedToast] = useState(false)

  // Viene de permanentlyDeleteStudentAction (?borrado=1)
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('borrado')) return
    url.searchParams.delete('borrado')
    window.history.replaceState(null, '', url)
    setDeletedToast(true)
    const t = setTimeout(() => setDeletedToast(false), 3500)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? students : students.filter(s => (s.student_status ?? s.status) === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.email ?? '').toLowerCase().includes(q)
      )
    }
    return [...list].sort(SORTS[sort].fn)
  }, [students, filter, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageSafe = Math.min(page, totalPages)
  const paginated = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage)

  const FILTERS = ['all', 'activo', 'riesgo', 'inactivo', 'exalumno', 'lead', 'matriculado']
  const FILTER_LABEL: Record<string, string> = {
    all: 'Todos', activo: 'Activos', riesgo: 'Riesgo', inactivo: 'Inactivos', exalumno: 'Exalumnos', lead: 'Leads', matriculado: 'Matriculados',
  }

  function updateFilter(v: string) { setFilter(v); setPage(1) }
  function updateSearch(v: string) { setSearch(v); setPage(1) }

  return (
    <div className="space-y-5 w-full page-animate">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Estudiantes</h1>
          <p className="text-sm text-white/40 mt-0.5">Directorio de la academia</p>
        </div>
        <Link
          href="/admin/students/nuevo"
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl transition-all hover:brightness-110"
          style={{ backgroundColor: ORANGE }}
        >
          <MdAdd className="h-4 w-4" />
          Nuevo estudiante
        </Link>
      </div>

      {/* KPIs — 8 cards, 2 filas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<MdGroup className="h-5 w-5" />} color="bg-orange-500/15 text-orange-400"
          value={kpis.total} label="Total" sublabel="Estudiantes registrados" />
        <KpiCard icon={<MdCheckCircle className="h-5 w-5" />} color="bg-green-500/15 text-green-400"
          value={kpis.active} label="Activos" sublabel={`${kpis.activePct}% del total`} />
        <KpiCard icon={<MdTrendingUp className="h-5 w-5" />} color="bg-red-500/15 text-red-400"
          value={kpis.newThisMonth} label="Ingresaron este mes" sublabel={`${kpis.newThisMonthPct}% del total`} />
        <KpiCard icon={<MdCalendarMonth className="h-5 w-5" />} color="bg-purple-500/15 text-purple-400"
          value={kpis.classesThisWeek} label="Clases esta semana" sublabel="Programadas" />
        <KpiCard icon={<MdCalendarMonth className="h-5 w-5" />} color="bg-orange-500/15 text-orange-400"
          value={kpis.classesToday} label="Clases de hoy" sublabel="Programadas"
          href="/admin/agenda" linkLabel="Ver agenda del día" />
        <KpiCard icon={<MdSchedule className="h-5 w-5" />} color="bg-blue-500/15 text-blue-400"
          value={kpis.upcoming7d} label="Próximas clases" sublabel="En los próximos 7 días"
          href="/admin/agenda" linkLabel="Ver agenda semanal" />
        <KpiCard icon={<MdSchool className="h-5 w-5" />} color="bg-purple-500/15 text-purple-400"
          value={kpis.activeInstructors} label="Profesores activos" sublabel="Profesores"
          href="/admin/instructors" linkLabel="Ver profesores" />
        <KpiCard icon={<MdAutorenew className="h-5 w-5" />} color="bg-pink-500/15 text-pink-400"
          value={kpis.avgAttendance30d !== null ? `${kpis.avgAttendance30d}%` : '—'} label="Asistencia promedio" sublabel="Últimos 30 días"
          href="/admin/academico" linkLabel="Ver reporte" />
      </div>

      {/* Búsqueda + filtros */}
      <div className="relative z-30 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            value={search}
            onChange={e => updateSearch(e.target.value)}
            placeholder="Buscar estudiante o contacto…"
            className="w-full pl-9 pr-3 py-2 text-xs bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(s => (
            <button
              key={s}
              onClick={() => updateFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${filter === s ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              style={filter === s ? { backgroundColor: ORANGE } : { backgroundColor: 'rgba(255,255,255,0.06)' }}
            >
              {FILTER_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-3 py-2 rounded-lg border border-white/10 hover:border-white/20"
          >
            <MdFilterList className="h-4 w-4" />
            Filtros
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-[#141414] border border-white/10 rounded-xl py-1 min-w-[160px] shadow-2xl">
                <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/25 font-semibold">Ordenar por</p>
                {(Object.keys(SORTS) as (keyof typeof SORTS)[]).map(k => (
                  <button
                    key={k}
                    onClick={() => { setSort(k); setSortOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${sort === k ? 'text-orange-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    {SORTS[k].label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">
          {students.length === 0 ? (
            <div className="space-y-3">
              <p>No hay estudiantes registrados.</p>
              <Link href="/admin/students/nuevo" className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                <MdAdd className="h-4 w-4" />
                Crear el primero
              </Link>
            </div>
          ) : 'Sin resultados para este filtro.'}
        </div>
      ) : (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-white/25 font-semibold">
                  <th className="text-left px-5 py-2.5 font-semibold">Estudiante</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Programa / Clase</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Profesor</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Próxima clase</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Frecuencia</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Progreso</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Estado</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paginated.map(s => {
                  const age = calcAge(s.birth_date)
                  const schedules = s.schedules ?? []
                  const primary = schedules[0]
                  const distinctCourses = [...new Set(schedules.map(sc => sc.course_name).filter(Boolean))]
                  const nc = s.nextClass ? nextClassLabel(s.nextClass.date) : null
                  const pct = s.progress && s.progress.total > 0 ? Math.round((s.progress.completed / s.progress.total) * 100) : null
                  // Sin horario fijo activo → usar la clase agendada más reciente como respaldo.
                  const courseName     = primary?.course_name ?? s.fallbackClass?.courseName ?? null
                  const instructorName = primary?.instructor_name ?? s.fallbackClass?.instructorName ?? null

                  return (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/admin/students/${s.id}`)}
                      className="hover:bg-white/[0.025] transition-colors cursor-pointer group"
                    >
                      {/* Estudiante */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-[170px]">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(s.id)}`}>
                            {initials(s.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors truncate">
                                {s.name}
                              </span>
                              {s.user_id && (
                                <span title="Portal activo" className="text-[10px] text-[#ff9a3b]">
                                  <MdShield className="h-3 w-3" />
                                </span>
                              )}
                              {isBirthdayMonth(s.birth_date) && <span className="text-[10px]">🎂</span>}
                            </div>
                            <p className="text-xs text-white/35 mt-0.5 truncate">
                              {[age ? `${age} años` : null, s.city].filter(Boolean).join(' · ') || 'Sin datos'}
                            </p>
                            <div onClick={ev => ev.stopPropagation()} className="mt-1 flex items-center gap-1.5">
                              <span className="text-[11px] text-white/40 font-mono">{s.phone}</span>
                              <WhatsAppButton
                                phone={s.phone}
                                template="general_message"
                                vars={{ name: s.name }}
                                entityType="student"
                                entityId={s.id}
                                variant="icon"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Programa / Clase */}
                      <td className="px-3 py-3.5">
                        {courseName ? (
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${courseColor(courseName)}`}>
                              <MdMusicNote className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{courseName}</p>
                              {distinctCourses.length > 1 && (
                                <p className="text-[10px] text-white/30">+{distinctCourses.length - 1} más</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-white/20">Sin curso asignado</span>
                        )}
                      </td>

                      {/* Profesor */}
                      <td className="px-3 py-3.5">
                        {instructorName ? (
                          <div className="flex items-center gap-2 min-w-[110px]">
                            <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60 shrink-0">
                              {initials(instructorName)}
                            </div>
                            <span className="text-xs text-white/60 truncate">{instructorName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-white/20">Sin asignar</span>
                        )}
                      </td>

                      {/* Próxima clase */}
                      <td className="px-3 py-3.5">
                        {s.nextClass && nc ? (
                          <div className="min-w-[120px]">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              nc.tone === 'today' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {nc.text}
                            </span>
                            <p className="text-xs text-white/70 mt-1 font-mono">{fmtTimeRange(s.nextClass.startTime)}</p>
                            {s.nextClass.classroomName && (
                              <p className="text-[10px] text-white/30 mt-0.5">{s.nextClass.classroomName}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-white/20">Sin próxima clase</span>
                        )}
                      </td>

                      {/* Frecuencia */}
                      <td className="px-3 py-3.5">
                        {schedules.length > 0 ? (
                          <div className="min-w-[100px]">
                            <p className="text-xs text-white/70 font-medium">
                              {schedules.length} {schedules.length === 1 ? 'vez' : 'veces'} por semana
                            </p>
                            <p className="text-[10px] text-white/30 mt-0.5">
                              {schedules.map(sc => `${DAY_SHORT[sc.day_of_week]} ${fmtTimeRange(sc.start_time)}`).join(' · ')}
                            </p>
                            <p className="text-[10px] text-white/25 mt-0.5">
                              Desde {fmtShortDate(primary!.active_from)}
                              {s.progress && s.progress.total > 0 && (
                                <> · Termina ~{fmtShortDate(estimateEndDate(primary!.active_from, s.progress.total, schedules.length))}</>
                              )}
                            </p>
                          </div>
                        ) : s.fallbackSchedule ? (
                          <div className="min-w-[100px]">
                            {s.fallbackSchedule.occurrencesPerWeek !== null ? (
                              <>
                                <p className="text-xs text-white/70 font-medium">
                                  ~{s.fallbackSchedule.occurrencesPerWeek} {s.fallbackSchedule.occurrencesPerWeek === 1 ? 'vez' : 'veces'} por semana
                                </p>
                                <p className="text-[10px] text-white/25 mt-0.5">
                                  Desde {fmtShortDate(s.fallbackSchedule.startDate)}
                                  {s.progress && s.progress.total > 0 && (
                                    <> · Termina ~{fmtShortDate(estimateEndDate(s.fallbackSchedule.startDate, s.progress.total, s.fallbackSchedule.occurrencesPerWeek))}</>
                                  )}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-white/70 font-medium">1 clase registrada</p>
                                <p className="text-[10px] text-white/25 mt-0.5">
                                  {fmtShortDate(s.fallbackSchedule.startDate)} · sin patrón definido aún
                                </p>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-white/20">Sin horario</span>
                        )}
                      </td>

                      {/* Progreso */}
                      <td className="px-3 py-3.5">
                        {pct !== null ? (
                          <div className="flex items-center gap-2">
                            <ProgressRing pct={pct} />
                            <span className="text-[10px] text-white/30">{s.progress!.completed}/{s.progress!.total} clases</span>
                          </div>
                        ) : (
                          <span className="text-xs text-white/20">Sin datos</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-3 py-3.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap ${STATUS_PILL[s.student_status ?? s.status]}`}>
                          {STATUS_LABEL[s.student_status ?? s.status]}
                        </span>
                      </td>

                      {/* Kebab */}
                      <td className="px-3 py-3.5" onClick={ev => ev.stopPropagation()}>
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="text-white/20 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5 inline-flex"
                          title="Ver perfil"
                        >
                          <MdMoreVert className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer: paginación */}
          <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-white/25">
              Mostrando {filtered.length === 0 ? 0 : (pageSafe - 1) * perPage + 1}–{Math.min(pageSafe * perPage, filtered.length)} de {filtered.length} estudiantes
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pageSafe <= 1}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <MdKeyboardArrowLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      p === pageSafe ? 'text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                    style={p === pageSafe ? { backgroundColor: ORANGE } : undefined}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={pageSafe >= totalPages}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <MdKeyboardArrowRight className="h-4 w-4" />
                </button>
              </div>
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                className="text-xs bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-white/60 focus:outline-none"
              >
                {[10, 25, 50].map(n => <option key={n} value={n}>{n} por página</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
      {deletedToast && createPortal(
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 rounded-full bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 shadow-lg">
          <MdCheckCircle className="h-4 w-4 text-green-400" />
          Estudiante eliminado correctamente.
        </div>,
        document.body
      )}
    </div>
  )
}
