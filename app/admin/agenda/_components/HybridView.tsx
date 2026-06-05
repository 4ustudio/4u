'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import WeekCalendar from './WeekCalendar'
import type { ClassSession, AvailableSlot } from '@/types/admin'
import type { Classroom } from './BookSessionModal'

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
  weekStart, sessions, blocked, students, courses, classrooms, instructors, availabilityByDay,
}: Props) {
  const router                          = useRouter()
  const [selectedId, setSelectedId]     = useState<string | null>(null)
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
      channel = sb
        .channel('admin-agenda-sessions')
        .on('postgres_changes', {
          event:  '*',
          schema: 'public',
          table:  'class_sessions',
        }, () => doRefresh())
        .on('postgres_changes', {
          event:  '*',
          schema: 'public',
          table:  'blocked_dates',
        }, () => doRefresh())
        .subscribe((status) => {
          // Re-suscribir si la conexión falla o expira
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(retry)
            retry = setTimeout(() => {
              sb.removeChannel(channel)
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
  }, [doRefresh])

  // ── Polling cada 30s como fallback ──────────────────────────────
  useEffect(() => {
    const id = setInterval(doRefresh, 30_000)
    return () => clearInterval(id)
  }, [doRefresh])

  // ── Refresh al volver a la pestaña ──────────────────────────────
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

  const visibleSessions = useMemo(
    () => selectedId ? sessions.filter(s => s.student_id === selectedId) : sessions,
    [sessions, selectedId]
  )

  const selectedStudent = selectedId ? students.find(s => s.id === selectedId) : null
  const activeCount = students.filter(s => s.status === 'active').length

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
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo
          </Link>
        </div>

        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-gray-800 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          />
        </div>

        {!selectedId && (
          <p className="text-[10px] text-white/25 leading-relaxed">
            Toca un estudiante para filtrar el calendario →
          </p>
        )}

        {selectedId && selectedStudent && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 rounded-lg px-3 py-2">
            <svg className="h-3.5 w-3.5 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
            </svg>
            <span className="text-xs text-orange-300 flex-1 truncate font-medium">{selectedStudent.name}</span>
            <button onClick={() => setSelectedId(null)} className="text-orange-400/50 hover:text-orange-300 shrink-0 transition-colors" title="Ver todos">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
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
                      setSelectedId(isSelected ? null : s.id)
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
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
                      </svg>
                      Ver perfil completo
                    </Link>
                  </div>
                </div>
              )
            })}
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
          <svg
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          <span>{refreshing ? 'Actualizando…' : lastRefresh.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className={`h-1.5 w-1.5 rounded-full ${refreshing ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />
        </button>
      </div>

      <WeekCalendar
        weekStart={weekStart}
        sessions={visibleSessions}
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
    <div className="animate-fade-in-up">
      {/* ── MÓVIL: tabs + contenido ───────────────────────────── */}
      <div className="lg:hidden -m-4">
        {/* Tabs móvil */}
        <div className="flex border-b border-white/10 bg-gray-900 sticky top-0 z-10">
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
      <div className="hidden lg:flex -m-6" style={{ height: 'calc(100vh - 48px)' }}>
        <aside className="w-72 shrink-0 bg-gray-900 border-r border-white/10 flex flex-col overflow-hidden">
          {StudentsPanel}
        </aside>
        <div className="flex-1 min-w-0 overflow-auto">
          {CalendarPanel}
        </div>
      </div>
    </div>
  )
}
