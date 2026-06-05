export type MusicScore = {
  creatividad:    number
  disciplina:     number
  interpretacion: number
  produccion:     number
  performance:    number
}

export type ProfileAnswers = {
  level:      string
  genres:     string[]
  goal:       string
  hours:      string
  instrument: string
}

export type DreamAnswers = {
  dream:       string
  timeframe:   string
  currentLevel: string
}

export type CareerChoice = {
  scenario: number
  choice:   string
}

// ── Matrices de puntuación ────────────────────────────────────────────

const LEVEL_SCORES: Record<string, Partial<MusicScore>> = {
  none:         { disciplina: 10, creatividad: 30 },
  beginner:     { disciplina: 35, interpretacion: 25 },
  intermediate: { disciplina: 55, interpretacion: 45, performance: 30 },
  advanced:     { disciplina: 80, interpretacion: 70, performance: 60 },
}

const GOAL_SCORES: Record<string, Partial<MusicScore>> = {
  pleasure:  { creatividad: 60, interpretacion: 40 },
  perform:   { performance: 70, disciplina: 50, interpretacion: 40 },
  record:    { produccion: 70, creatividad: 60 },
  teach:     { disciplina: 70, interpretacion: 60, performance: 40 },
}

const HOURS_SCORES: Record<string, Partial<MusicScore>> = {
  '1-2':   { disciplina: 10 },
  '3-5':   { disciplina: 30 },
  '6-10':  { disciplina: 55 },
  '10+':   { disciplina: 75 },
}

const INSTRUMENT_SCORES: Record<string, Partial<MusicScore>> = {
  guitar:      { performance: 50, interpretacion: 45 },
  piano:       { disciplina: 60, interpretacion: 55, creatividad: 40 },
  voice:       { performance: 65, interpretacion: 60 },
  drums:       { disciplina: 65, performance: 50 },
  production:  { produccion: 75, creatividad: 65 },
  bass:        { performance: 45, interpretacion: 40, disciplina: 50 },
  other:       { creatividad: 40, interpretacion: 35 },
}

const DREAM_SCORES: Record<string, Partial<MusicScore>> = {
  stage:    { performance: 75, disciplina: 60, interpretacion: 55 },
  album:    { produccion: 60, creatividad: 70, interpretacion: 50 },
  produce:  { produccion: 80, creatividad: 75 },
  pleasure: { creatividad: 55, interpretacion: 45 },
  teach:    { disciplina: 70, interpretacion: 65, performance: 40 },
  band:     { performance: 65, disciplina: 55, interpretacion: 50 },
}

// Escenarios del simulador: [choice] → delta scores
const CAREER_SCENARIOS: Record<string, Record<string, Partial<MusicScore>>> = {
  s1: {
    accept:    { performance: 20, disciplina: 15 },
    negotiate: { creatividad: 15, performance: 18 },
    decline:   { produccion: 15, disciplina: 10 },
  },
  s2: {
    coproduce: { produccion: 25, creatividad: 20 },
    support:   { interpretacion: 20, disciplina: 15 },
    solo:      { creatividad: 25, performance: 10 },
  },
  s3: {
    practice:  { disciplina: 25, interpretacion: 20 },
    create:    { creatividad: 25, produccion: 15 },
    perform:   { performance: 25, interpretacion: 15 },
  },
}

function mergeScores(base: MusicScore, delta: Partial<MusicScore>): MusicScore {
  return {
    creatividad:    Math.min(100, base.creatividad    + (delta.creatividad    ?? 0)),
    disciplina:     Math.min(100, base.disciplina     + (delta.disciplina     ?? 0)),
    interpretacion: Math.min(100, base.interpretacion + (delta.interpretacion ?? 0)),
    produccion:     Math.min(100, base.produccion     + (delta.produccion     ?? 0)),
    performance:    Math.min(100, base.performance    + (delta.performance    ?? 0)),
  }
}

export function calcProfileScore(answers: ProfileAnswers): MusicScore {
  let score: MusicScore = { creatividad: 20, disciplina: 20, interpretacion: 20, produccion: 20, performance: 20 }
  score = mergeScores(score, LEVEL_SCORES[answers.level]      ?? {})
  score = mergeScores(score, GOAL_SCORES[answers.goal]        ?? {})
  score = mergeScores(score, HOURS_SCORES[answers.hours]      ?? {})
  score = mergeScores(score, INSTRUMENT_SCORES[answers.instrument] ?? {})
  return score
}

export function calcDreamScore(answers: DreamAnswers): MusicScore {
  let score: MusicScore = { creatividad: 25, disciplina: 25, interpretacion: 25, produccion: 25, performance: 25 }
  score = mergeScores(score, DREAM_SCORES[answers.dream] ?? {})
  if (answers.timeframe === '6m')    score = mergeScores(score, { disciplina: 20 })
  if (answers.timeframe === '1y')    score = mergeScores(score, { disciplina: 10 })
  if (answers.currentLevel === 'bases')   score = mergeScores(score, { interpretacion: 15, disciplina: 15 })
  if (answers.currentLevel === 'plays')   score = mergeScores(score, { interpretacion: 25, performance: 20 })
  return score
}

export function calcCareerScore(choices: CareerChoice[]): MusicScore {
  let score: MusicScore = { creatividad: 20, disciplina: 20, interpretacion: 20, produccion: 20, performance: 20 }
  for (const { scenario, choice } of choices) {
    const key = `s${scenario}`
    score = mergeScores(score, CAREER_SCENARIOS[key]?.[choice] ?? {})
  }
  return score
}
