import { describe, it, expect } from 'vitest'
import {
  bogotaDateStr,
  bogotaTimeStr,
  bogotaDateTime,
  bogotaNoon,
  formatBogotaDate,
  formatBogotaTime,
} from '@/lib/tz'

// El servidor de Vercel corre en UTC; estos casos son los que producían
// correos y recordatorios con 5 horas de desfase.

describe('bogotaDateStr', () => {
  it('usa el día local, no el UTC, en la franja nocturna', () => {
    // 2026-09-04 01:00 UTC = 2026-09-03 20:00 en Bogotá
    expect(bogotaDateStr(new Date('2026-09-04T01:00:00Z'))).toBe('2026-09-03')
  })

  it('aplica offsets de días sobre la fecha local', () => {
    const n = new Date('2026-09-03T13:00:00Z') // 08:00 Bogotá
    expect(bogotaDateStr(n)).toBe('2026-09-03')
    expect(bogotaDateStr(n, 1)).toBe('2026-09-04')
    expect(bogotaDateStr(n, -1)).toBe('2026-09-02')
  })
})

describe('bogotaTimeStr', () => {
  it('devuelve la hora colombiana, no la del servidor', () => {
    const n = new Date('2026-09-03T12:00:00Z')
    expect(bogotaTimeStr(n)).toBe('07:00')
    expect(bogotaTimeStr(n, 3)).toBe('10:00')
  })
})

describe('bogotaDateTime', () => {
  it('interpreta scheduled_date + start_time como hora de Bogotá', () => {
    expect(bogotaDateTime('2026-09-04', '15:00:00').toISOString()).toBe('2026-09-04T20:00:00.000Z')
  })

  it('acepta start_time sin segundos', () => {
    expect(bogotaDateTime('2026-09-04', '15:00').toISOString()).toBe('2026-09-04T20:00:00.000Z')
  })

  it('calcula bien las horas que faltan para la clase', () => {
    const clase = bogotaDateTime('2026-09-04', '15:00:00')
    const ahora = new Date('2026-09-04T18:00:00Z') // 13:00 Bogotá
    expect((clase.getTime() - ahora.getTime()) / 3600000).toBe(2)
  })
})

describe('etiquetas para correos', () => {
  it('muestra la hora real de la clase', () => {
    // El bug: new Date('2026-09-04T15:00:00') en UTC formateado a Bogotá daba 10:00 a.m.
    expect(formatBogotaTime('2026-09-04', '15:00:00').replace(/ | /g, ' ')).toMatch(/^3:00 p/)
  })

  it('no adelanta ni atrasa el día en clases de madrugada o de noche', () => {
    expect(formatBogotaDate('2026-09-04', { day: 'numeric', month: 'numeric', year: 'numeric' })).toBe('4/9/2026')
  })
})

describe('bogotaNoon', () => {
  it('ancla el día local para aritmética de calendario', () => {
    const d = bogotaNoon('2026-09-03')
    expect(d.toISOString()).toBe('2026-09-03T17:00:00.000Z')
    expect(d.toISOString().split('T')[0]).toBe('2026-09-03')
    d.setDate(d.getDate() + 7)
    expect(bogotaDateStr(d)).toBe('2026-09-10')
  })
})
