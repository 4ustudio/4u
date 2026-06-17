'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AcademicDashboardData } from '@/app/admin/_actions/academic'

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']

interface Props {
  data: AcademicDashboardData
}

export function AcademicDashboardClient({ data }: Props) {
  const [tab, setTab] = useState<'kpis' | 'attendance' | 'risk' | 'matching'>('kpis')
  const { kpis } = data

  return (
    <div className="space-y-6 w-full page-animate">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-white/35 mb-1">
          <Link href="/admin" className="hover:text-white/60 transition-colors">Admin</Link>
          <span>/</span>
          <span className="text-white/60">Académico</span>
        </div>
        <h1 className="text-xl font-bold text-white">Indicadores Académicos</h1>
        <p className="text-sm text-white/40 mt-0.5">Operación, asistencia y capacidad.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {[
          { key: 'kpis' as const, label: 'KPIs', desc: 'Indicadores generales' },
          { key: 'attendance' as const, label: 'Asistencia', desc: 'Por instructor y curso' },
          { key: 'risk' as const, label: 'Riesgo', desc: 'Alertas académicas' },
          { key: 'matching' as const, label: 'Matching', desc: 'Instructores vs horarios' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-[#ff7a00] text-[#ff7a00]'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
            <span className="block text-[10px] text-white/30 font-normal">{t.desc}</span>
          </button>
        ))}
      </div>

      {tab === 'kpis' && <KPITab kpis={kpis} />}
      {tab === 'attendance' && <AttendanceTab data={data} />}
      {tab === 'risk' && <RiskTab data={data} />}
      {tab === 'matching' && <MatchingTab data={data} />}
    </div>
  )
}

/* ── KPIs ────────────────────────────────────────────────────── */
function KPITab({ kpis }: { kpis: AcademicDashboardData['kpis'] }) {
  const items = [
    { label: 'Clases hoy', value: kpis.todayClasses, hint: 'en curso', color: 'green' as const },
    { label: 'Clases semana', value: kpis.weekClasses, hint: 'programadas', color: 'blue' as const },
    { label: 'Clases mes', value: kpis.monthClasses, hint: 'totales', color: 'purple' as const },
    { label: 'Asistencia promedio', value: `${kpis.averageAttendance}%`, hint: 'últimos 30d', color: 'green' as const },
    { label: 'No-show rate', value: `${kpis.noShowRate}%`, hint: 'últimos 30d', color: kpis.noShowRate > 15 ? 'red' as const : 'orange' as const },
    { label: 'Ocupación instructores', value: `${kpis.instructorOccupancy}%`, hint: 'con clases', color: 'blue' as const },
    { label: 'Ocupación salones', value: `${kpis.classroomOccupancy}%`, hint: 'capacidad estimada', color: 'purple' as const },
    { label: 'Sin horario fijo', value: kpis.studentsWithoutSchedule, hint: 'estudiantes activos', color: kpis.studentsWithoutSchedule > 0 ? 'red' as const : 'green' as const },
    { label: 'Instructores ociosos', value: kpis.instructorsWithoutAssignment, hint: 'sin asignación', color: kpis.instructorsWithoutAssignment > 0 ? 'red' as const : 'green' as const },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map(item => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  )
}

function KpiCard({ label, value, hint, color }: { label: string; value: string | number; hint: string; color: 'green' | 'blue' | 'purple' | 'orange' | 'red' }) {
  const colors = {
    green: 'from-green-500/10 to-green-500/5 border-green-500/20 text-green-400',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400',
    orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-400',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-400',
  }
  return (
    <div className={`rounded-xl border p-5 bg-gradient-to-br ${colors[color]}`}>
      <p className="text-3xl font-extrabold font-poppins">{value}</p>
      <p className="text-sm font-semibold text-white/80 mt-2">{label}</p>
      <p className="text-xs text-white/40 mt-0.5">{hint}</p>
    </div>
  )
}

/* ── Asistencia ──────────────────────────────────────────────── */
function AttendanceTab({ data }: { data: AcademicDashboardData }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Asistencia por Instructor</h2>
        </div>
        <Table
          headers={['Instructor', 'Clases', 'Asistencia', '%']}
          rows={data.attendanceByInstructor.map(i => [
            i.name,
            String(i.total),
            String(i.attended),
            <span key={i.name} className={i.rate >= 80 ? 'text-green-400' : i.rate >= 60 ? 'text-yellow-400' : 'text-red-400'}>{i.rate}%</span>,
          ])}
        />
      </div>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Asistencia por Curso</h2>
        </div>
        <Table
          headers={['Curso', 'Clases', 'Asistencia', '%']}
          rows={data.attendanceByCourse.map(c => [
            c.name,
            String(c.total),
            String(c.attended),
            <span key={c.name} className={c.rate >= 80 ? 'text-green-400' : c.rate >= 60 ? 'text-yellow-400' : 'text-red-400'}>{c.rate}%</span>,
          ])}
        />
      </div>
    </div>
  )
}

/* ── Riesgo ──────────────────────────────────────────────────── */
function RiskTab({ data }: { data: AcademicDashboardData }) {
  const riskCount = data.riskStudents.length
  const criticalCount = data.riskStudents.filter(r => r.risk_level === 'critical').length
  const warningCount = data.riskStudents.filter(r => r.risk_level === 'warning').length

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-2xl font-extrabold font-poppins text-red-400">{criticalCount}</p>
          <p className="text-sm font-semibold text-white/80 mt-1">Críticos</p>
          <p className="text-xs text-white/40">3+ no-shows en 60 días</p>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-2xl font-extrabold font-poppins text-yellow-400">{warningCount}</p>
          <p className="text-sm font-semibold text-white/80 mt-1">Advertencia</p>
          <p className="text-xs text-white/40">asistencia &lt; 50%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-2xl font-extrabold font-poppins text-white">{riskCount}</p>
          <p className="text-sm font-semibold text-white/80 mt-1">Total en riesgo</p>
          <p className="text-xs text-white/40">requieren atención</p>
        </div>
      </div>

      {riskCount === 0 ? (
        <p className="text-sm text-white/40 text-center py-8">No hay estudiantes en riesgo académico.</p>
      ) : (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
          <Table
            headers={['Estudiante', 'Estado', 'Score', 'No-shows', 'Asistencia 90d', 'Riesgo']}
            rows={data.riskStudents.map(r => [
              <Link key={r.id} href={`/admin/students/${r.id}`} className="text-white hover:text-[#ff7a00] transition-colors">{r.name}</Link>,
              <span key={`s-${r.id}`} className="text-xs text-white/60">{r.student_status ?? '—'}</span>,
              <span key={`sc-${r.id}`} className={r.retention_score && r.retention_score < 50 ? 'text-red-400' : 'text-white/60'}>{r.retention_score ?? '—'}</span>,
              <span key={`ns-${r.id}`} className="text-red-400">{r.recent_no_shows}</span>,
              <span key={`ar-${r.id}`} className={r.attendance_rate_90d !== null && r.attendance_rate_90d < 50 ? 'text-red-400' : 'text-white/60'}>{r.attendance_rate_90d !== null ? `${r.attendance_rate_90d}%` : '—'}</span>,
              <span key={`rl-${r.id}`} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                r.risk_level === 'critical' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
              }`}>
                {r.risk_level === 'critical' ? 'Crítico' : 'Advertencia'}
              </span>,
            ])}
          />
        </div>
      )}

      <div className="text-xs text-white/30 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
        <strong className="text-white/60">Reglas de riesgo académico:</strong> 3 ausencias consecutivas (no_show) en 60 días → <strong>crítico</strong>. Asistencia &lt; 50% en 90 días → <strong>advertencia</strong>.
      </div>
    </div>
  )
}

/* ── Matching ────────────────────────────────────────────────── */
function MatchingTab({ data }: { data: AcademicDashboardData }) {
  const { unmatchedSchedules, availableInstructors } = data.matching

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Horarios sin instructor</h2>
          <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full">{unmatchedSchedules.length}</span>
        </div>
        {unmatchedSchedules.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">Todos los horarios tienen instructor asignado.</p>
        ) : (
          <Table
            headers={['Estudiante', 'Curso', 'Día', 'Hora']}
            rows={unmatchedSchedules.map(s => [
              s.student_name,
              s.course_name,
              DAY_NAMES[s.day_of_week - 1] ?? '—',
              s.start_time,
            ])}
          />
        )}
      </div>

      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Instructores disponibles</h2>
          <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">{availableInstructors.length}</span>
        </div>
        <Table
          headers={['Instructor', 'Cursos', 'Franjas']}
          rows={availableInstructors.map(i => [
            i.name,
            <span key={i.name} className="text-xs text-white/50">{i.courses.join(', ') || '—'}</span>,
            <span key={`a-${i.name}`} className="text-white/60">{i.availabilitySlots}</span>,
          ])}
        />
      </div>
    </div>
  )
}

/* ── Tabla reutilizable ──────────────────────────────────────── */
function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            {headers.map(h => (
              <th key={h} className="text-left px-5 py-2.5 text-xs text-white/35 font-semibold uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3 text-white/70">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
