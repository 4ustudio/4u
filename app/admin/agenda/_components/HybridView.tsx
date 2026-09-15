'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MdAdd, MdSearch, MdCalendarMonth, MdClose, MdPerson, MdRefresh, MdViewAgenda, MdSchool, MdPersonSearch } from 'react-icons/md'
import { createBrowserClient } from '@supabase/ssr'
import WeekCalendar from './WeekCalendar'
import type { ClassSession, AvailableSlot, TrialSession } from '@/types/admin'
import type { EnrollmentRow } from '@/types/enrollment'
import type { Classroom } from './BookSessionModal'

export type ViewFilter = 'all' | 'classes' | 'trials'

const VIEW_FILTERS: { value: ViewFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all',     label: 'Todo',          icon: <MdViewAgenda className="h-3.5 w-3.5" aria-hidden="true" /> },
  { value: 'classes', label: 'Clases',        icon: <MdSchool className="h-3.5 w-3.5" aria-hidden="true" /> },
  { value: 'trials',  label: 'Reconocimiento', icon: <MdPersonSearch className="h-3.5 w-3.5" aria-hidden="true" /> },
]

interface Student {
  id: string
  name: string
  phone: string
  email: string | null
  status: string
  student_type: string
}

interface Props {
  weekStart:         string
  sessions:          ClassSession[]
  trials:            TrialSession[]
  leads:             EnrollmentRow[]
  blocked:           any[]
  students:          Student[]
  courses:           { id: string; name: string }[]
  classrooms:        Classroom[]
  instructors:       { id: string; name: string }[]
  availabilityByDay: Record<string, AvailableSlot[]>
}

const STATUS_DOT: Record<string, string> = {
  active:    'bg-green-400',
  inactive:  'bg-gray-500',
  suspended: 'bg-red-400',
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function HybridView({
  weekStart, sessions, trials, leads, blocked, students, courses, classrooms, instructors, availabilityByDay,
}: Props) {
  const router                          = useRouter()
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  // Un interesado no es un estudiante: se le agenda clase de prueba, no clase regular.
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [viewFilter, setViewFilter]     = useState<ViewFilter>('all')
  const [search, setSearch]             = useState('')
  const [mobileTab, setMobileTab]       = useState<'agenda' | 'students'>('agenda')
  const [lastRefresh, setLastRefresh]   = useState<Date>(new Date())
  const [refreshing, setRefreshing]     = useState(false)
  const refreshingRef                   = useRef(false)

  const doRefresh = useCallback(() => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    router.refresh()
    setTimeout(() => {
      refreshingRef.current = false
      setRefreshing(false)
      setLastRefresh(new Date())
    }, 800)
  }, [router])

  // Ref para acceder a doRefresh sin re-disparar el effect
  const doRefreshRef = useRef(doRefresh)
  useEffect(() => { doRefreshRef.current = doRefresh }, [doRefresh])

  // ── Supabase Realtime: escuchar INSERT/UPDATE en class_sessions ──
  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let retry: ReturnType<typeof setTimeout> | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any

    const subscribe = () => {
      // Nombre único por intento: createBrowserClient() reusa el mismo cliente
      // singleton en el navegador, y un nombre fijo choca con el canal anterior
      // si el retry ocurre antes de que termine el removeChannel() async —
      // Supabase devolvería el canal viejo ya suscrito y el .on() fallaría.
      const channelName = `admin-agenda-sessions-${Date.now()}-${Math.random().toString(36).slice(2)}`
      channel = sb
        .channel(channelName)
        .on('postgres_changes', {
          event:  '*',
          schema: 'public',
          table:  'class_sessions',
        }, () => doRefreshRef.current())
        .on('postgres_changes', {
          event:  '*',
          schema: 'public',
          table:  'blocked_dates',
        }, () => doRefreshRef.current())
        .on('postgres_changes', {
          event:  '*',
          schema: 'public',
          table:  'enrollments',
        }, () => doRefreshRef.current())
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(retry)
            retry = setTimeout(async () => {
              await sb.removeChannel(channel)
              subscribe()
            }, 3000)
          }
        })
    }

    subscribe()

    return () => {
      clearTimeout(retry)
      if (channel) sb.removeChannel(channel)
    }
  }, []) // sin dependencias — doRefreshRef siempre está actualizado

  // ── Refresh al volver a la pestaña (fallback si realtime se perdió mientras estaba en background) ──
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) doRefresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [doRefresh])

  const sessionsPerStudent = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of sessions) {
      if (!['cancelled', 'rescheduled'].includes(s.status)) {
        map[s.student_id] = (map[s.student_id] ?? 0) + 1
      }
    }
    return map
  }, [sessions])

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return students
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.email?.toLowerCase().includes(q) ?? false)
    )
  }, [students, search])

  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return leads
    return leads.filter(l =>
      l.student_name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.course_interest.toLowerCase().includes(q)
    )
  }, [leads, search])

  const visibleSessions = useMemo(
    () => selectedId ? sessions.filter(s => s.student_id === selectedId) : sessions,
    [sessions, selectedId]
  )

  const visibleTrials = useMemo(
    () => selectedLeadId ? trials.filter(t => t.id === selectedLeadId) : trials,
    [trials, selectedLeadId]
  )

  const selectedStudent = selectedId ? students.find(s => s.id === selectedId) : null
  const selectedLead    = selectedLeadId ? leads.find(l => l.id === selectedLeadId) : null
  const activeCount = students.filter(s => s.status === 'active').length

  function pickStudent(id: string) {
    setSelectedLeadId(null)
    setSelectedId(prev => (prev === id ? null : id))
  }

  function pickLead(id: string) {
    setSelectedId(null)
    setSelectedLeadId(prev => (prev === id ? null : id))
  }

  // Panel de estudiantes (compartido entre móvil y desktop)
  const StudentsPanel = (
    <div className="flex flex-col h-full">
      {/* Header del panel */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Estudiantes</h2>
            <p className="text-[10px] text-white/30 mt-0.5">{activeCount} activos de {students.length}</p>
          </div>
          <Link
            href="/admin/students/nuevo"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors px-2.5 py-1.5 rounded-lg shrink-0"
          >
            <MdAdd className="h-3.5 w-3.5" aria-hidden="true" />
            Nuevo
          </Link>
        </div>

        <div className="relative">
          <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          />
        </div>

        {!selectedId && !selectedLeadId && (
          <p className="text-[10px] text-white/25 leading-relaxed">
            Toca un estudiante o interesado para filtrar el calendario →
          </p>
        )}

        {selectedStudent && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 rounded-lg px-3 py-2">
            <MdCalendarMonth className="h-3.5 w-3.5 text-orange-400 shrink-0" aria-hidden="true" />
            <span className="text-xs text-orange-300 flex-1 truncate font-medium">{selectedStudent.name}</span>
            <button onClick={() => setSelectedId(null)} className="text-orange-400/50 hover:text-orange-300 shrink-0 transition-colors" title="Ver todos">
              <MdClose className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {selectedLead && (
          <div className="bg-sky-500/10 border border-sky-500/25 rounded-lg px-3 py-2 space-y-1">
            <div className="flex items-center gap-2">
              <MdPersonSearch className="h-3.5 w-3.5 text-sky-400 shrink-0" aria-hidden="true" />
              <span className="text-xs text-sky-200 flex-1 truncate font-medium">{selectedLead.student_name}</span>
              <button onClick={() => setSelectedLeadId(null)} className="text-sky-400/50 hover:text-sky-300 shrink-0 transition-colors" title="Ver todos">
                <MdClose className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-[10px] text-sky-300/60 leading-relaxed">
              Toca una hora libre para agendarle la clase de prueba
            </p>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-white/30 text-sm">Sin resultados</p>
            <p className="text-white/20 text-xs mt-1">Intenta con otro nombre</p>
          </div>
        ) : (
          <div className="space-y-px px-2">
            {filteredStudents.map((s) => {
              const isSelected = selectedId === s.id
              const weekCount  = sessionsPerStudent[s.id] ?? 0
              return (
                <div
                  key={s.id}
                  className={`rounded-xl border transition-all ${
                    isSelected ? 'border-orange-500/40 bg-orange-500/10' : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'
                  }`}
                >
                  <button
                    onClick={() => {
                      pickStudent(s.id)
                      // En móvil, al seleccionar estudiante ir a agenda
                      if (!isSelected) setMobileTab('agenda')
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60'
                    }`}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-orange-300' : 'text-white/90'}`}>{s.name}</p>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s.status] ?? 'bg-gray-500'}`} />
                      </div>
                      <p className="text-[11px] text-white/35 truncate">{s.phone}</p>
                    </div>
                    {weekCount > 0 ? (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-orange-500/30 text-orange-300' : 'bg-orange-500/20 text-orange-400'
                      }`} title={`${weekCount} clase${weekCount !== 1 ? 's' : ''} esta semana`}>
                        {weekCount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/20 shrink-0">—</span>
                    )}
                  </button>
                  <div className="px-3 pb-2.5 -mt-1">
                    <Link
                      href={`/admin/students/${s.id}`}
                      className="flex items-center gap-1 text-[11px] text-white/30 hover:text-orange-400 transition-colors w-fit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MdPerson className="h-3 w-3" aria-hidden="true" />
                      Ver perfil completo
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Interesados: aún no son alumnos, se les agenda clase de prueba */}
        {filteredLeads.length > 0 && (
          <div className="mt-4">
            <div className="px-4 pb-2 flex items-center gap-2">
              <MdPersonSearch className="h-3.5 w-3.5 text-sky-400/70 shrink-0" aria-hidden="true" />
              <h3 className="text-[11px] font-bold text-sky-300/80 uppercase tracking-wider">Interesados</h3>
              <span className="text-[10px] text-white/25">{filteredLeads.length}</span>
            </div>
            <div className="space-y-px px-2">
              {filteredLeads.map((l) => {
                const isSelected = selectedLeadId === l.id
                const hasTrial   = Boolean(l.trial_date)
                return (
                  <div
                    key={l.id}
                    className={`rounded-xl border transition-all ${
                      isSelected ? 'border-sky-500/40 bg-sky-500/10' : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'
                    }`}
                  >
                    <button
                      onClick={() => {
                        pickLead(l.id)
                        if (!isSelected) setMobileTab('agenda')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-dashed ${
                        isSelected ? 'bg-sky-500 text-white border-sky-300' : 'bg-sky-500/10 text-sky-300/80 border-sky-400/40'
                      }`}>
                        {l.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-sky-200' : 'text-white/90'}`}>{l.student_name}</p>
                        </div>
                        <p className="text-[11px] text-white/35 truncate">{l.phone} · {l.course_interest}</p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 border ${
                          hasTrial
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/25'
                            : 'bg-white/5 text-white/30 border-white/10'
                        }`}
                        title={hasTrial ? 'Ya tiene clase de prueba agendada' : 'Sin clase de prueba'}
                      >
                        {hasTrial ? 'Agendado' : 'Sin cita'}
                      </span>
                    </button>
                    <div className="px-3 pb-2.5 -mt-1">
                      <Link
                        href="/admin/interesados"
                        className="flex items-center gap-1 text-[11px] text-white/30 hover:text-sky-400 transition-colors w-fit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MdPersonSearch className="h-3 w-3" aria-hidden="true" />
                        Ver en Interesados
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
        <p className="text-[10px] text-white/20">
          {filteredStudents.length !== students.length
            ? `${filteredStudents.length} de ${students.length}`
            : `${students.length} estudiante${students.length !== 1 ? 's' : ''}`}
        </p>
        {selectedId && (
          <button onClick={() => setSelectedId(null)} className="text-[10px] text-orange-400/60 hover:text-orange-400 transition-colors">
            Ver todos →
          </button>
        )}
      </div>
    </div>
  )

  // Panel del calendario
  const CalendarPanel = (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-white">
            {selectedStudent ? (
              <><span className="text-white/40 font-normal">Agenda — </span>{selectedStudent.name}</>
            ) : 'Agenda'}
          </h1>
          {selectedStudent ? (
            <p className="text-xs text-white/40 mt-0.5">
              Solo clases de este estudiante ·{' '}
              <button onClick={() => setSelectedId(null)} className="text-orange-400 hover:underline">Ver todos</button>
            </p>
          ) : (
            <p className="text-xs text-white/30 mt-0.5">Todas las clases · Toca una clase para gestionarla</p>
          )}
        </div>

        {/* Indicador de actualización automática */}
        <button
          onClick={doRefresh}
          title="Actualizar ahora"
          className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded-lg hover:bg-white/5 shrink-0"
        >
          <MdRefresh className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{refreshing ? 'Actualizando…' : lastRefresh.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className={`h-1.5 w-1.5 rounded-full ${refreshing ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />
        </button>
      </div>

      {/* Filtro de tipo de sesión */}
      <div className="flex items-center gap-1 mb-3 p-[3px] rounded-[10px] bg-white/[0.04] border border-white/[0.08] w-fit">
        {VIEW_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setViewFilter(f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewFilter === f.value ? 'bg-[#ff7a00] text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      <WeekCalendar
        weekStart={weekStart}
        sessions={visibleSessions}
        trials={visibleTrials}
        viewFilter={viewFilter}
        selectedLead={selectedLead ? { id: selectedLead.id, name: selectedLead.student_name } : undefined}
        blocked={blocked}
        students={students}
        courses={courses}
        classrooms={classrooms}
        instructors={instructors}
        availabilityByDay={availabilityByDay}
        defaultStudentId={selectedId ?? undefined}
      />
    </div>
  )

  return (
    <div className="animate-fade-in-up overflow-x-hidden">
      {/* ── MÓVIL: tabs + contenido ───────────────────────────── */}
      <div className="lg:hidden -m-4">
        {/* Tabs móvil */}
        <div className="flex border-b border-white/10 bg-[#0f0f0f] sticky top-0 z-10">
          <button
            onClick={() => setMobileTab('agenda')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mobileTab === 'agenda' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-white/40'
            }`}
          >
            📅 Agenda
          </button>
          <button
            onClick={() => setMobileTab('students')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mobileTab === 'students' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-white/40'
            }`}
          >
            👥 Estudiantes {selectedId && <span className="ml-1 text-[10px] bg-orange-500 text-white rounded-full px-1.5 py-0.5">1</span>}
          </button>
        </div>

        {/* Contenido móvil */}
        {mobileTab === 'agenda' && CalendarPanel}
        {mobileTab === 'students' && (
          <div className="h-[calc(100vh-8rem)]">{StudentsPanel}</div>
        )}
      </div>

      {/* ── DESKTOP: panel lateral + calendario ───────────────── */}
      {/* Altura fija = viewport - header (48px). El sidebar llena todo, el calendario scrollea dentro. */}
      <div className="hidden lg:flex min-h-[calc(100vh-10rem)] overflow-hidden rounded-[28px] border border-white/8 bg-[#090909]">
        <aside className="w-72 xl:w-80 shrink-0 bg-[#0f0f0f] border-r border-white/10 flex flex-col overflow-hidden">
          {StudentsPanel}
        </aside>
        <div className="flex-1 min-w-0 overflow-auto">
          {CalendarPanel}
        </div>
      </div>
    </div>
  )
}
