export interface PlanOption {
  id: string
  name: string
  price: number | null
  duration_months: number | null
  description: string | null
  active: boolean
  sort_order: number
  label: string
}

const cop = (n: number) => '$' + n.toLocaleString('es-CO')

export function planLabel(p: { name: string; price: number | null; duration_months: number | null }): string {
  if (p.price == null) return `${p.name} — Cotización personalizada`
  const total = p.duration_months ? ` (${cop(p.price * p.duration_months)} total)` : ''
  return `${p.name} — ${cop(p.price)}/mes${total}`
}
