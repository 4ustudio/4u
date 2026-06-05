'use client'

import { useState } from 'react'
import ResultCard from './ResultCard'
import { calcCareerScore, type CareerChoice } from '@/lib/ia/scoring'
import { getCareerType } from '@/lib/ia/profiles'
import { getRecommendedCourses, getRecommendedPlan } from '@/lib/ia/recommendations'
import { trackEvent, saveJourney } from '@/lib/ia/events'

const SCENARIOS = [
  {
    id: 1,
    context: 'Estás en tus primeros meses de aprendizaje.',
    situation: 'Te ofrecen tocar en un evento pequeño, pero sin pago.',
    options: [
      { value: 'accept',    label: 'Acepto — es experiencia valiosa',       emoji: '🎤', insight: 'Priorizas la exposición sobre la compensación.' },
      { value: 'negotiate', label: 'Negocio para que reconozcan mi trabajo', emoji: '💬', insight: 'Valoras tu trabajo desde el principio.' },
      { value: 'decline',   label: 'Lo rechazo, prefiero seguir preparándome', emoji: '📚', insight: 'Prefieres estar listo antes de presentarte.' },
    ],
  },
  {
    id: 2,
    context: 'Llevas varios meses practicando.',
    situation: 'Un amigo artista quiere que co-produzcan una canción juntos.',
    options: [
      { value: 'coproduce', label: 'Me lanzo a co-producir con él',          emoji: '🎛️', insight: 'Disfrutas crear en equipo.' },
      { value: 'support',   label: 'Lo apoyo tocando en su proyecto',        emoji: '🎸', insight: 'Eres un músico de apoyo y equipo.' },
      { value: 'solo',      label: 'Prefiero avanzar en mi proyecto propio', emoji: '🎯', insight: 'Tu visión artística es individual.' },
    ],
  },
  {
    id: 3,
    context: 'Tienes 3 meses libres para dedicarte a la música.',
    situation: '¿Qué harías con ese tiempo?',
    options: [
      { value: 'practice', label: 'Practicar intensamente mi técnica',       emoji: '🏋️', insight: 'Inviertes en fundamentos sólidos.' },
      { value: 'create',   label: 'Componer y producir nuevo material',      emoji: '✍️',  insight: 'La creación es tu motor.' },
      { value: 'perform',  label: 'Buscar presentaciones y tocar en vivo',   emoji: '🎤', insight: 'El escenario es tu meta.' },
    ],
  },
]

export default function CareerSimulator() {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [choices, setChoices]         = useState<CareerChoice[]>([])
  const [selected, setSelected]       = useState<string | null>(null)
  const [result, setResult]           = useState<ReturnType<typeof buildResult> | null>(null)
  const [started, setStarted]         = useState(false)
  const [showInsight, setShowInsight] = useState(false)

  function buildResult(allChoices: CareerChoice[]) {
    const score      = calcCareerScore(allChoices)
    const careerType = getCareerType(score)
    const courses    = getRecommendedCourses(score)
    const plan       = getRecommendedPlan(score)
    return { score, careerType, courses, plan }
  }

  async function handleStart() {
    setStarted(true)
    await trackEvent('journey_started', 'carrera')
  }

  function handleSelect(val: string) {
    setSelected(val)
    setShowInsight(true)
  }

  async function handleNext() {
    if (!selected) return
    const newChoice: CareerChoice = { scenario: SCENARIOS[scenarioIdx].id, choice: selected }
    const allChoices = [...choices, newChoice]
    setChoices(allChoices)
    setSelected(null)
    setShowInsight(false)

    if (scenarioIdx < SCENARIOS.length - 1) {
      setScenarioIdx(i => i + 1)
    } else {
      const res = buildResult(allChoices)
      setResult(res)
      const journeyId = await saveJourney({
        feature:             'carrera',
        input_data:          { choices: allChoices },
        result_data:         { career_type: res.careerType.id },
        music_score:         res.score,
        career_type:         res.careerType.id,
        recommended_courses: res.courses.map(c => c.name),
      })
      await trackEvent('journey_completed', 'carrera', journeyId ?? undefined, { career_type: res.careerType.id })
    }
  }

  const scenario = SCENARIOS[scenarioIdx]
  const selectedOption = scenario?.options.find(o => o.value === selected)

  if (!started) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="text-5xl">🎯</div>
        <h2 className="text-2xl font-bold text-white font-poppins">Simula tu carrera musical</h2>
        <p className="text-white/60 max-w-sm mx-auto text-sm leading-relaxed">
          3 escenarios reales. Tus decisiones revelan qué tipo de músico eres y hacia dónde va tu carrera.
        </p>
        <button
          onClick={handleStart}
          className="bg-[#ff7a00] hover:bg-[#ff9a3c] text-white font-semibold py-3 px-8 rounded-xl transition-colors"
        >
          Empezar simulación
        </button>
      </div>
    )
  }

  if (result) {
    return (
      <ResultCard
        badge="Tu carrera proyectada"
        title={result.careerType.name}
        tagline={result.careerType.description}
        description={result.careerType.insight}
        score={result.score}
        ctas={[
          { label: 'Hablar con un instructor', href: '/agendar', primary: true },
          { label: 'Ver mi plan recomendado',  href: result.plan.href },
        ]}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Progreso */}
      <div className="flex items-center gap-2">
        <span className="text-[#ff7a00] text-sm font-semibold">{scenarioIdx + 1} / {SCENARIOS.length}</span>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ff7a00] rounded-full transition-all duration-300"
            style={{ width: `${((scenarioIdx + 1) / SCENARIOS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Escenario */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-1">
        <p className="text-white/50 text-xs uppercase tracking-wider">{scenario.context}</p>
        <p className="text-white font-semibold text-lg">{scenario.situation}</p>
      </div>

      {/* Opciones */}
      <div className="space-y-3">
        {scenario.options.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`
              w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200
              ${selected === opt.value
                ? 'border-[#ff7a00] bg-[#ff7a00]/10 text-white'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <span className="text-xl shrink-0">{opt.emoji}</span>
            <span className="text-sm font-medium flex-1">{opt.label}</span>
            {selected === opt.value && <span className="text-[#ff7a00] shrink-0">✓</span>}
          </button>
        ))}
      </div>

      {/* Insight */}
      {showInsight && selectedOption && (
        <div className="bg-[#ff7a00]/10 border border-[#ff7a00]/20 rounded-xl p-4 text-sm text-[#ff7a00]">
          <span className="font-semibold">Insight: </span>{selectedOption.insight}
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!selected}
        className="w-full bg-[#ff7a00] hover:bg-[#ff9a3c] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {scenarioIdx === SCENARIOS.length - 1 ? 'Ver mi carrera proyectada' : 'Siguiente escenario'}
      </button>
    </div>
  )
}
