export interface PlanOption {
  name: string
  price: number | null
  label: string
}

export const PLAN_OPTIONS: PlanOption[] = [
  { name: 'Plan New Talent',           price: 1100000, label: 'Plan New Talent — $1.100.000/mes' },
  { name: 'Plan Fast Talent',          price: 1900000, label: 'Plan Fast Talent — $1.900.000/mes' },
  { name: 'Plan Bandas',               price: 2500000, label: 'Plan Bandas — $2.500.000/mes' },
  { name: 'Plan Artista',              price: 3500000, label: 'Plan Artista — $3.500.000/mes' },
  { name: 'Plan Artista Premium',      price: 4500000, label: 'Plan Artista Premium — $4.500.000/mes' },
  { name: 'Plan Profesional',          price: null,    label: 'Plan Profesional — Cotización personalizada' },
  { name: 'Plan Corporativo',          price: null,    label: 'Plan Corporativo — Cotización personalizada' },
  { name: 'Plan Kids & Teens',         price: 1100000, label: 'Plan Kids & Teens — $1.100.000/mes' },
  { name: 'Plan Premium Kids & Teens', price: 1600000, label: 'Plan Premium Kids & Teens — $1.600.000/mes' },
]

export function planPrice(name: string | null | undefined): number | null {
  return PLAN_OPTIONS.find(p => p.name === name)?.price ?? null
}
