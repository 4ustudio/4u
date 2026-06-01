'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getStudents } from '../_actions/students'
import type { Student } from '@/types/admin'

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

// ── Colores ───────────────────────────────────────────────────

const STATUS_PILL: Record<string, string> = {
  active:    'bg-green-500/10 text-green-400 border-green-500/20',
  inactive:  'bg-white/5 text-white/35 border-white/10',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido',
}
const TYPE_LABEL: Record<string, string> = { new: 'Nuevo', regular: 'Regular' }
const TYPE_PILL: Record<string, string> = {
  new:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/15',
  regular: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
}

const AVATAR_COLORS = [
  'bg-orange-500/20 text-orange-300',
  'bg-blue-500/20 text-blue-300',
  'bg-purple-500/20 text-purple-300',
  'bg-green-500/20 text-green-300',
  'bg-pink-500/20 text-pink-300',
  'bg-yellow-500/20 text-yellow-300',
]

function avatarColor(id: string): string {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// ── Tarjetas de resumen ───────────────────────────────────────

function SummaryCards({ students }: { students: Student[] | null }) {
  const s = useMemo(() => {
    if (!students) return { total: 0, active: 0, newType: 0, portal: 0 }
    return {
      total:   students.length,
      active:  students.filter(s => s.status === 'active').length,
      newType: students.filter(s => isThisMonth(s.enrolled_at)).length,
      portal:  students.filter(s => !!s.user_id).length,
    }
  }, [students])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {([
        { label: 'Total',            val: s.total,   c: 'text-white',      bg: 'bg-white/5 border-white/8' },
        { label: 'Activos',          val: s.active,  c: 'text-green-400',  bg: 'bg-green-400/8 border-green-400/10' },
        { label: 'Ingresaron este mes', val: s.newType, c: 'text-orange-400', bg: 'bg-orange-400/8 border-orange-400/10' },
        { label: 'Con portal',       val: s.portal,  c: 'text-blue-400',   bg: 'bg-blue-400/8 border-blue-400/10' },
      ] as const).map(card => (
        <div key={card.label} className={`rounded-xl border px-4 py-3 ${card.bg}`}>
          <p className={`text-2xl font-extrabold ${card.c}`}>{students === null ? '—' : card.val}</p>
          <p className="text-xs text-white/40 mt-0.5 font-medium">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[] | null>(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await getStudents()) } catch { setStudents([]) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!students) return []
    let list = filter === 'all' ? students : students.filter(s => s.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.email ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [students, filter, search])

  const FILTERS = ['all', 'active', 'inactive', 'suspended']
  const FILTER_LABEL: Record<string, string> = {
    all: 'Todos', active: 'Activos', inactive: 'Inactivos', suspended: 'Suspendidos',
  }

  return (
    <div className="space-y-5 w-full">

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
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Nuevo estudiante
        </Link>
      </div>

      <SummaryCards students={students} />

      {/* Búsqueda + filtros */}
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

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-white/30 text-sm">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">
          {students?.length === 0 ? (
            <div className="space-y-3">
              <p>No hay estudiantes registrados.</p>
              <Link href="/admin/students/nuevo" className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Crear el primero
              </Link>
            </div>
          ) : 'Sin resultados para este filtro.'}
        </div>
      ) : (
        <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
          {/* Encabezado de tabla — desktop */}
          <div className="hidden md:grid md:grid-cols-[48px_1fr_160px_160px_100px_80px] gap-4 px-5 py-2.5 border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-white/25 font-semibold">
            <span />
            <span>Estudiante</span>
            <span>Contacto</span>
            <span>Inscrito</span>
            <span>Tipo</span>
            <span className="text-right">Estado</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {filtered.map(s => {
              const age = calcAge(s.birth_date)

              return (
                <Link
                  key={s.id}
                  href={`/admin/students/${s.id}`}
                  className="flex md:grid md:grid-cols-[48px_1fr_160px_160px_100px_80px] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.025] transition-colors group"
                >
                  {/* Avatar */}
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(s.id)}`}>
                    {initials(s.name)}
                  </div>

                  {/* Nombre + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors truncate">
                        {s.name}
                      </span>
                      {s.user_id && (
                        <span title="Portal activo" className="text-[10px] text-blue-400">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">
                      {[age ? `${age} años` : null, s.city, s.music_genre].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                    </p>
                  </div>

                  {/* Contacto */}
                  <div className="hidden md:block min-w-0">
                    <p className="text-xs text-white/60 font-mono truncate">{s.phone}</p>
                    {s.email && <p className="text-xs text-white/30 truncate mt-0.5">{s.email}</p>}
                  </div>

                  {/* Fecha inscripción */}
                  <div className="hidden md:block">
                    <p className="text-xs text-white/50">{fmtDate(s.enrolled_at)}</p>
                    {isThisMonth(s.enrolled_at) && (
                      <p className="text-[10px] text-orange-400 mt-0.5 font-medium">Este mes</p>
                    )}
                  </div>

                  {/* Tipo */}
                  <div className="hidden md:block">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${TYPE_PILL[s.student_type]}`}>
                      {TYPE_LABEL[s.student_type]}
                    </span>
                  </div>

                  {/* Estado */}
                  <div className="hidden md:flex justify-end">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_PILL[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>

                  {/* Mobile: estado + flecha */}
                  <div className="md:hidden ml-auto flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_PILL[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                    <svg className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Footer con total */}
          <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-xs text-white/25">
              {filtered.length} de {students?.length ?? 0} estudiantes
            </p>
            <Link
              href="/admin/students/nuevo"
              className="text-xs text-white/40 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Nuevo
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
