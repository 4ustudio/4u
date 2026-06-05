import type { MusicScore } from './scoring'

export type CourseRecommendation = {
  name:   string
  slug:   string
  reason: string
}

export type PlanRecommendation = {
  name: string
  href: string
  reason: string
}

const COURSE_MAP: Array<{ condition: (s: MusicScore) => boolean; course: CourseRecommendation }> = [
  {
    condition: s => s.performance >= 55 || s.interpretacion >= 50,
    course: { name: 'Guitarra', slug: 'guitarra', reason: 'Ideal para desarrollar interpretación y presencia escénica.' },
  },
  {
    condition: s => s.disciplina >= 55 && s.interpretacion >= 45,
    course: { name: 'Piano', slug: 'piano', reason: 'El piano construye disciplina técnica y lectura musical sólida.' },
  },
  {
    condition: s => s.performance >= 60,
    course: { name: 'Canto', slug: 'canto', reason: 'Tu perfil de performance apunta a la voz como instrumento principal.' },
  },
  {
    condition: s => s.disciplina >= 60 && s.performance >= 45,
    course: { name: 'Batería', slug: 'bateria', reason: 'La batería combina disciplina rítmica y energía en escenario.' },
  },
  {
    condition: s => s.produccion >= 55 || s.creatividad >= 60,
    course: { name: 'Producción Musical', slug: 'produccion-musical', reason: 'Tu perfil creativo y técnico es ideal para producción.' },
  },
  {
    condition: s => s.interpretacion >= 50 && s.performance >= 40,
    course: { name: 'Bajo', slug: 'bajo', reason: 'El bajo une interpretación y presencia rítmica en conjunto.' },
  },
]

export function getRecommendedCourses(score: MusicScore, max = 2): CourseRecommendation[] {
  return COURSE_MAP
    .filter(({ condition }) => condition(score))
    .slice(0, max)
    .map(({ course }) => course)
}

export function getRecommendedPlan(score: MusicScore): PlanRecommendation {
  const avg = Object.values(score).reduce((a, b) => a + b, 0) / 5

  if (avg >= 60) {
    return {
      name: 'Plan Avanzado — Jóvenes & Adultos',
      href: '/planes/jovenes-adultos',
      reason: 'Tu nivel y objetivos encajan con nuestro plan más completo.',
    }
  }
  if (score.produccion >= 55) {
    return {
      name: 'Plan Producción Musical',
      href: '/produccion',
      reason: 'Tu perfil apunta directamente a la producción y composición.',
    }
  }
  return {
    name: 'Plan Estándar — Jóvenes & Adultos',
    href: '/planes/jovenes-adultos',
    reason: 'El punto de inicio perfecto para tu camino musical.',
  }
}

export function getDreamRoadmap(dream: string, timeframe: string): Array<{ phase: string; months: string; milestones: string[] }> {
  const roadmaps: Record<string, Array<{ phase: string; months: string; milestones: string[] }>> = {
    stage: [
      { phase: 'Fundamentos técnicos', months: 'Meses 1-4', milestones: ['Postura y técnica base', 'Escalas y acordes esenciales', 'Primeras canciones completas'] },
      { phase: 'Repertorio y técnica live', months: 'Meses 5-8', milestones: ['5 canciones dominadas', 'Práctica en grupo', 'Primera presentación en academia'] },
      { phase: 'Preparación de fecha', months: 'Meses 9-12', milestones: ['Set list de 30 min', 'Ensayos con banda', 'Primera fecha en vivo'] },
    ],
    album: [
      { phase: 'Composición y arreglos', months: 'Meses 1-3', milestones: ['3 demos escritas', 'Arreglos básicos', 'Estudio de producción'] },
      { phase: 'Grabación y producción', months: 'Meses 4-7', milestones: ['Grabación de tracks', 'Mezcla y edición', 'Arte y distribución'] },
      { phase: 'Lanzamiento', months: 'Meses 8-10', milestones: ['Masterización', 'Distribución digital', 'Presentación del álbum'] },
    ],
    produce: [
      { phase: 'DAW y teoría', months: 'Meses 1-3', milestones: ['Dominio del DAW', 'Teoría musical aplicada', 'Primeros beats'] },
      { phase: 'Producción avanzada', months: 'Meses 4-8', milestones: ['Mezcla profesional', 'Trabajo con artistas', 'Portafolio de 5 tracks'] },
      { phase: 'Independencia creativa', months: 'Meses 9-12', milestones: ['Primer lanzamiento', 'Red de colaboración', 'Primeros ingresos'] },
    ],
    pleasure: [
      { phase: 'Bases sólidas', months: 'Meses 1-3', milestones: ['Técnica fundamental', '10 canciones favoritas', 'Rutina de práctica'] },
      { phase: 'Profundización', months: 'Meses 4-8', milestones: ['Teoría básica', 'Improvisación libre', 'Repertorio personal'] },
      { phase: 'Disfrute pleno', months: 'Meses 9+', milestones: ['Tocar con otros', 'Explorar nuevos géneros', 'Música sin límites'] },
    ],
    teach: [
      { phase: 'Técnica y teoría', months: 'Meses 1-4', milestones: ['Teoría musical sólida', 'Técnica avanzada', 'Pedagogía básica'] },
      { phase: 'Método pedagógico', months: 'Meses 5-9', milestones: ['Primeros estudiantes', 'Metodología propia', 'Material didáctico'] },
      { phase: 'Ejercicio docente', months: 'Meses 10-14', milestones: ['Clases regulares', 'Seguimiento de progreso', 'Reconocimiento local'] },
    ],
    band: [
      { phase: 'Preparación individual', months: 'Meses 1-3', milestones: ['Técnica de conjunto', 'Repertorio compartido', 'Comunicación musical'] },
      { phase: 'Formación y ensayos', months: 'Meses 4-7', milestones: ['Encontrar integrantes', 'Ensayos regulares', '10 canciones del set'] },
      { phase: 'Primera presentación', months: 'Meses 8-12', milestones: ['Set list completo', 'Imagen de banda', 'Primera fecha'] },
    ],
  }

  const timeMultipliers: Record<string, number> = { '6m': 0.5, '1y': 1, '2y': 2, 'no_rush': 1.5 }
  return roadmaps[dream] ?? roadmaps['pleasure']
}
