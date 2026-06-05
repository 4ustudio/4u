import type { MusicScore } from './scoring'

export type MusicProfile = {
  id:          string
  name:        string
  tagline:     string
  description: string
  strengths:   string[]
  nextStep:    string
}

export type CareerType = {
  id:          string
  name:        string
  description: string
  insight:     string
}

// ── Arquetipos de perfil musical ─────────────────────────────────────

const PROFILES: MusicProfile[] = [
  {
    id: 'creador_expresivo',
    name: 'El Creador Expresivo',
    tagline: 'Tienes ideas, ahora necesitas técnica para materializarlas',
    description: 'Tu instinto creativo es tu mayor fortaleza. Generas ideas naturalmente y conectas con la música de forma emocional.',
    strengths: ['Pensamiento creativo', 'Conexión emocional', 'Capacidad de improvisación'],
    nextStep: 'Desarrollar disciplina técnica para dar forma a tus ideas.',
  },
  {
    id: 'interprete_nato',
    name: 'El Intérprete Nato',
    tagline: 'Vives para tocar y transmitir emociones al público',
    description: 'Tu mayor habilidad es interpretar y conectar con el público. La música es para ti una forma de comunicación.',
    strengths: ['Expresión en escenario', 'Sensibilidad musical', 'Capacidad interpretativa'],
    nextStep: 'Refinar tu técnica para ampliar tu repertorio.',
  },
  {
    id: 'arquitecto_sonoro',
    name: 'El Arquitecto Sonoro',
    tagline: 'Construyes música desde cero con precisión y visión',
    description: 'Piensas en capas, texturas y estructuras. Tienes vocación para producir y construir paisajes sonoros complejos.',
    strengths: ['Visión de producción', 'Pensamiento estructurado', 'Oído técnico'],
    nextStep: 'Dominar herramientas de producción y composición.',
  },
  {
    id: 'disciplinado_tecnico',
    name: 'El Técnico Disciplinado',
    tagline: 'Tu constancia es tu superpoder musical',
    description: 'Eres metódico, constante y comprometido. Tu nivel técnico crece de forma sólida y sostenida.',
    strengths: ['Disciplina de práctica', 'Progresión técnica', 'Consistencia'],
    nextStep: 'Incorporar más creatividad e improvisación en tu práctica.',
  },
  {
    id: 'artista_integral',
    name: 'El Artista Integral',
    tagline: 'Dominas múltiples dimensiones del arte musical',
    description: 'Tienes un balance notable entre técnica, creatividad y presencia escénica. Eres un músico completo en desarrollo.',
    strengths: ['Versatilidad musical', 'Balance técnico-creativo', 'Visión artística amplia'],
    nextStep: 'Elegir una especialización y profundizarla al máximo.',
  },
  {
    id: 'explorador_musical',
    name: 'El Explorador Musical',
    tagline: 'Estás descubriendo tu identidad sonora',
    description: 'Estás en las primeras etapas de tu viaje musical. Tienes potencial sin moldear y una mente abierta.',
    strengths: ['Mentalidad de crecimiento', 'Curiosidad musical', 'Sin límites establecidos'],
    nextStep: 'Comprometerte con un instrumento y un método de estudio.',
  },
]

// ── Tipos de carrera (Simulador) ──────────────────────────────────────

const CAREER_TYPES: CareerType[] = [
  {
    id: 'musico_escenario',
    name: 'Músico de Escenario',
    description: 'Tu camino apunta al directo: conciertos, giras, conexión con el público.',
    insight: 'Tus decisiones priorizan la experiencia en vivo. Necesitarás reforzar producción para tener mayor independencia.',
  },
  {
    id: 'productor_creativo',
    name: 'Productor Creativo',
    description: 'Tu futuro está detrás de la consola creando música para ti y otros artistas.',
    insight: 'Tienes visión para producir. Desarrolla tu técnica interpretativa para comunicar mejor tus ideas.',
  },
  {
    id: 'musico_completo',
    name: 'Músico Completo',
    description: 'Tocas, produces y te presentas en vivo. Eres versátil y autosuficiente.',
    insight: 'Tu balance es tu mayor activo. Profundiza en el área que más disfrutes para diferenciarte.',
  },
  {
    id: 'artista_independiente',
    name: 'Artista Independiente',
    description: 'Creas, produces y distribuyes tu propia música con visión clara.',
    insight: 'Tu camino es autónomo. Enfócate en construir tu identidad sonora y tu audiencia.',
  },
]

// ── Lógica de selección ───────────────────────────────────────────────

export function getProfile(score: MusicScore): MusicProfile {
  const top = topDimension(score)

  if (score.creatividad >= 65 && score.produccion >= 55) return find('arquitecto_sonoro')
  if (score.performance >= 65 && score.interpretacion >= 55) return find('interprete_nato')
  if (score.disciplina >= 65 && score.creatividad < 45)   return find('disciplinado_tecnico')
  if (score.creatividad >= 60 && score.disciplina < 45)   return find('creador_expresivo')

  const avg = Object.values(score).reduce((a, b) => a + b, 0) / 5
  if (avg >= 55) return find('artista_integral')

  return find('explorador_musical')
}

export function getCareerType(score: MusicScore): CareerType {
  if (score.performance >= 55 && score.produccion >= 55) return findCareer('musico_completo')
  if (score.performance >= 60)  return findCareer('musico_escenario')
  if (score.produccion >= 60)   return findCareer('productor_creativo')
  if (score.creatividad >= 60)  return findCareer('artista_independiente')
  return findCareer('musico_completo')
}

function topDimension(score: MusicScore): keyof MusicScore {
  return Object.entries(score).reduce((a, b) => (b[1] > a[1] ? b : a))[0] as keyof MusicScore
}

function find(id: string): MusicProfile {
  return PROFILES.find(p => p.id === id) ?? PROFILES[5]
}

function findCareer(id: string): CareerType {
  return CAREER_TYPES.find(c => c.id === id) ?? CAREER_TYPES[2]
}
