export type RecentSale = {
  name: string
  detail: string
  amount: number
  status: string
  statusTone: 'green' | 'orange'
  occurredAt: string
}

export function peso(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function shortPeso(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  if (value >= 1000) return `$${Math.round(value / 1000)}K`
  return peso(value)
}

export function percentage(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export function courseEstimate(course: string | null | undefined) {
  const normalized = (course ?? '').toLowerCase()
  if (normalized.includes('producción') || normalized.includes('produccion')) return 3500000
  if (normalized.includes('banda')) return 2500000
  if (normalized.includes('kids') || normalized.includes('teen')) return 1100000
  if (normalized.includes('canto')) return 1900000
  return 1100000
}

export function formatOccurredAt(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  const time = date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Hoy, ${time}`
  if (isYesterday) return `Ayer, ${time}`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export function getMonthBounds(refMonth: Date = new Date()) {
  const start = new Date(refMonth.getFullYear(), refMonth.getMonth(), 1)
  const end = new Date(refMonth.getFullYear(), refMonth.getMonth() + 1, 0)
  return {
    rangeLabel: `${start.getDate()} ${start.toLocaleDateString('es-CO', { month: 'short' })} – ${end.getDate()} ${end.toLocaleDateString('es-CO', { month: 'short' })}, ${end.getFullYear()}`,
  }
}

// `?month=YYYY-MM` de la URL → Date (día 1 de ese mes). Default: mes actual.
export function parseMonthParam(param: string | undefined): Date {
  if (param) {
    const match = /^(\d{4})-(\d{2})$/.exec(param)
    if (match) {
      const year = Number(match[1])
      const month = Number(match[2]) - 1
      if (month >= 0 && month <= 11) return new Date(year, month, 1)
    }
  }
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export function formatMonthParam(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(date: Date): string {
  const label = date.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function isCurrentMonth(date: Date): boolean {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}
