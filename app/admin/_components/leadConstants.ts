import type { EnrollmentSource } from '@/types/enrollment'

export type KanbanStatus = 'pending' | 'contacted' | 'clase_prueba' | 'converted' | 'perdido'

export const SOURCES: { value: EnrollmentSource; label: string }[] = [
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

export const LOST_REASONS = [
  'Precio muy alto',
  'Horario no disponible',
  'Eligió otra academia',
  'No respondió',
  'Sin interés definitivo',
  'Aplazó la decisión',
  'Otro',
]

export const COLUMNS: { status: KanbanStatus; label: string; dot: string; header: string; border: string; accent: string }[] = [
  { status: 'pending',      label: 'Nuevo',        dot: 'bg-yellow-400',  header: 'border-yellow-500/30 text-yellow-400', border: 'border-yellow-500/10', accent: '#facc15' },
  { status: 'contacted',    label: 'Contactado',   dot: 'bg-violet-400',  header: 'border-violet-500/30 text-violet-300', border: 'border-violet-500/10', accent: '#a78bfa' },
  { status: 'clase_prueba', label: 'Clase Prueba', dot: 'bg-green-400',   header: 'border-green-500/30 text-green-400',   border: 'border-green-500/10', accent: '#4ade80' },
  { status: 'converted',    label: 'Matriculado',  dot: 'bg-[#ff7a00]',   header: 'border-purple-500/30 text-[#ff9a3b]',  border: 'border-purple-500/10', accent: '#ff7a00' },
  { status: 'perdido',      label: 'Perdido',      dot: 'bg-red-500',     header: 'border-red-500/30 text-red-400',       border: 'border-red-500/10', accent: '#f87171' },
]

export const PILL: Record<string, string> = {
  pending:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  contacted:    'bg-white/8 text-white/55 border-white/12',
  clase_prueba: 'bg-green-500/10 text-green-400 border-green-500/20',
  scheduled:    'bg-green-500/10 text-green-400 border-green-500/20',
  perdido:      'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled:    'bg-red-500/10 text-red-400 border-red-500/20',
  converted:    'bg-[#ff7a00]/12 text-[#ff9a3b] border-[#ff7a00]/25',
}

export const SOURCE_COLORS: Record<string, string> = {
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

export const LEVEL_LABELS: Record<string, string> = {
  never: 'Sin experiencia', beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado',
}

export const inputClass = 'w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30 disabled:opacity-50'

export function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora mismo'
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Ayer' : `Hace ${d}d`
}

export function isToday(iso: string): boolean {
  const d = new Date(iso), n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

export function cleanPhone(p: string) { return p.replace(/[^0-9]/g, '') }

export function canonicalStatus(s: string): KanbanStatus {
  if (s === 'scheduled')  return 'clase_prueba'
  if (s === 'cancelled')  return 'perdido'
  return s as KanbanStatus
}

export function statusLabel(s: string): string {
  return COLUMNS.find(c => c.status === canonicalStatus(s))?.label ?? s
}
