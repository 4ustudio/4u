'use client'

import { useState } from 'react'
import QuizStep from './QuizStep'
import ResultCard from './ResultCard'
import { calcDreamScore, type DreamAnswers } from '@/lib/ia/scoring'
import { getProfile } from '@/lib/ia/profiles'
import { getRecommendedCourses, getRecommendedPlan, getDreamRoadmap } from '@/lib/ia/recommendations'
import { trackEvent, saveJourney } from '@/lib/ia/events'

const DREAM_LABELS: Record<string, string> = {
  stage:    'Tocar en un escenario',
  album:    'Grabar mi propio álbum',
  produce:  'Producir para otros artistas',
  pleasure: 'Aprender por placer',
  teach:    'Enseñar música',
  band:     'Formar una banda',
}

const STEPS = [
  {
    key: 'dream',
    question: '¿Cuál es tu sueño musical?',
    options: [
      { value: 'stage',    label: 'Tocar en un escenario',         emoji: '🎤' },
      { value: 'album',    label: 'Grabar mi propio álbum',        emoji: '💿' },
      { value: 'produce',  label: 'Producir para otros artistas',  emoji: '🎛️' },
      { value: 'pleasure', label: 'Aprender por placer',           emoji: '😊' },
      { value: 'teach',    label: 'Enseñar música',                emoji: '📚' },
      { value: 'band',     label: 'Formar una banda',              emoji: '🎸' },
    ],
  },
  {
    key: 'timeframe',
    question: '¿En cuánto tiempo quieres lograrlo?',
    options: [
      { value: '6m',      label: '6 meses',     emoji: '⚡' },
      { value: '1y',      label: '1 año',       emoji: '📅' },
      { value: '2y',      label: '2 años',      emoji: '🗓️' },
      { value: 'no_rush', label: 'Sin prisa',   emoji: '🌊' },
    ],
  },
  {
    key: 'currentLevel',
    question: '¿Qué tienes hoy?',
    options: [
      { value: 'none',   label: 'Cero experiencia musical',         emoji: '🌱' },
      { value: 'bases',  label: 'Bases de un instrumento',          emoji: '🎯' },
      { value: 'plays',  label: 'Toco pero sin técnica formal',     emoji: '🎸' },
    ],
  },
]

type Answers = Partial<DreamAnswers>

export default function DreamBuilder() {
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult]   = useState<ReturnType<typeof buildResult> | null>(null)
  const [started, setStarted] = useState(false)

  function buildResult(ans: Answers) {
    const dreamAnswers: DreamAnswers = {
      dream:        ans.dream ?? 'pleasure',
      timeframe:    ans.timeframe ?? '1y',
      currentLevel: ans.currentLevel ?? 'none',
    }
    const score    = calcDreamScore(dreamAnswers)
    const profile  = getProfile(score)
    const courses  = getRecommendedCourses(score)
    const plan     = getRecommendedPlan(score)
    const roadmap  = getDreamRoadmap(dreamAnswers.dream, dreamAnswers.timeframe)
    return { score, profile, courses, plan, roadmap, dreamAnswers }
  }

  async function handleStart() {
    setStarted(true)
    await trackEvent('journey_started', 'sueno')
  }

  function handleChange(key: string, val: string | string[]) {
    setAnswers(prev => ({ ...prev, [key]: val }))
  }

  async function handleNext() {
    const current = STEPS[step]
    const val = answers[current.key as keyof Answers]
    if (!val) return

    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      const res = buildResult(answers)
      setResult(res)
      const journeyId = await saveJourney({
        feature:             'sueno',
        input_data:          answers as Record<string, unknown>,
        result_data:         { dream: res.dreamAnswers.dream, plan: res.plan.name },
        music_score:         res.score,
        career_type:         res.dreamAnswers.dream,
        recommended_courses: res.courses.map(c => c.name),
      })
      await trackEvent('journey_completed', 'sueno', journeyId ?? undefined, { dream: res.dreamAnswers.dream })
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  const currentStep = STEPS[step]
  const currentVal  = answers[currentStep?.key as keyof Answers] ?? ''
  const hasValue    = !!currentVal

  if (!started) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="text-5xl">🌟</div>
        <h2 className="text-2xl font-bold text-white font-poppins">Construye tu sueño musical</h2>
        <p className="text-white/60 max-w-sm mx-auto text-sm leading-relaxed">
          3 preguntas. Obtén un roadmap personalizado con fases, hitos y el plan que te llevará ahí.
        </p>
        <button
          onClick={handleStart}
          className="bg-[#ff7a00] hover:bg-[#ff9a3c] text-white font-semibold py-3 px-8 rounded-xl transition-colors"
        >
          Construir mi camino
        </button>
      </div>
    )
  }

  if (result) {
    return (
      <div className="space-y-6">
        <ResultCard
          badge="Tu camino musical"
          title={`Sueño: ${DREAM_LABELS[result.dreamAnswers.dream]}`}
          tagline={result.profile.tagline}
          description={result.profile.description}
          score={result.score}
          ctas={[
            { label: 'Agendar clase gratis', href: '/agendar', primary: true },
            { label: 'Ver mi plan recomendado', href: result.plan.href },
          ]}
        />

        {/* Roadmap */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Tu roadmap</h3>
          <div className="space-y-4">
            {result.roadmap.map((phase, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#ff7a00]/20 border border-[#ff7a00]/40 flex items-center justify-center text-[#ff7a00] text-sm font-bold">
                    {i + 1}
                  </div>
                  {i < result.roadmap.length - 1 && <div className="w-px flex-1 bg-white/10 mt-2" />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-semibold text-sm">{phase.phase}</h4>
                    <span className="text-white/40 text-xs">{phase.months}</span>
                  </div>
                  <ul className="space-y-1">
                    {phase.milestones.map((m, j) => (
                      <li key={j} className="text-white/60 text-sm flex items-start gap-1.5">
                        <span className="text-[#ff7a00] text-xs mt-1">·</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <QuizStep
        step={step + 1}
        total={STEPS.length}
        question={currentStep.question}
        options={currentStep.options}
        value={currentVal as string}
        onChange={val => handleChange(currentStep.key, val)}
      />

      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="flex-1 border border-white/20 text-white/70 hover:text-white hover:border-white/40 py-3 rounded-xl transition-colors text-sm font-medium"
          >
            Anterior
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!hasValue}
          className="flex-1 bg-[#ff7a00] hover:bg-[#ff9a3c] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {step === STEPS.length - 1 ? 'Ver mi roadmap' : 'Siguiente'}
        </button>
      </div>
    </div>
  )
}
